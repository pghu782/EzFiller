import { FormData, AppState } from './app.models';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { StatusType, Mode, FilterType, PageCommand, Action } from './enum.models';
import { Form } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public form: FormData;
  private readonly _data$: Observable<Array<FormData>>;

  public readonly dataSource$ = new Subject<FormData>();

  public readonly detectDisplayChanges$ = new Subject<boolean>();
  public readonly statusText$ = new Subject<string>();
  public readonly statusType$ = new Subject<StatusType>();
  public statusType: StatusType;
  public readonly appState$ = new Subject<AppState>();

  private fullState: AppState;

  constructor() {
    this.fullState = new AppState();
  }

  public getSnapshots(url: string) {
    return new Observable(subscriber => {
      const handler = e => subscriber.next(e);

      chrome.storage.local.get(null, (items: FormData[]) => {
        for (var key in items) {
          if (this.urlMatch(url, items[key].url)) {
            this.dataSource$.next(items[key]);
          }
        }
        subscriber.next();
      });
    });
  }

  public initSnapshot$() {
    return new Observable(subscriber => {
      const handler = e => subscriber.next(e);
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { command: PageCommand.SaveForm }, handler);
      });
    });
  }

  public refreshDisplay() {
    this.detectDisplayChanges$.next(true);
  }

  public saveSnapshot$(snapshot: FormData) {
    return new Observable(subscriber => {
      chrome.storage.local.set({ [snapshot.id]: snapshot }, () => {
        if (this.fullState.action == Action.Create) {
          this.dataSource$.next(snapshot);
        }
        subscriber.next();
      });
    });
  }

  public switchUrlScheme(scheme: FilterType) {
    this.fullState.filterType = scheme;
    switch (scheme) {
      case FilterType.Domain:
        this.setStatus('Switching to domain URL filtering...');
        break;
      case FilterType.Full:
        this.setStatus('Switching to full URL filtering...');
        break;
      default:
        break;
    }
  }

  private urlMatch(targetUrl, storedUrl) {
    var url1 = this.parseUri(targetUrl.toLowerCase());
    var url2 = this.parseUri(storedUrl.toLowerCase());

    if (storedUrl === '*') {
      return true;
    } else if (this.fullState.filterType === FilterType.Domain) {
      return url1.host === url2.host;
    } else if (this.fullState.filterType === FilterType.Full) {
      return url1.host + url1.path == url2.host + url2.path;
    } else {
      return false;
    }
  }

  public checkHotKeyDuplicates(hotkey: string) {
    return new Observable<boolean>(subscriber => {
      chrome.storage.local.get(null, (items: FormData[]) => {
        let isDuplicate = false;
        for (var key in items) {
          if (items[key].hotkey == hotkey) {
            isDuplicate = true;
            break;
          }
        }
        // let matches = items.some(x => x.hotkey == hotkey);
        subscriber.next(isDuplicate);
      });
    });
  }

  public parseUri(url) {
    var a = document.createElement('a');
    a.setAttribute('href', url);

    return {
      host: a.hostname,
      path: a.pathname
    };
  }

  public setStatus(text: string, type?: StatusType) {
    this.fullState.statusText = text;
    this.fullState.statusType = type ? type : StatusType.Info;
    this.appState$.next(this.fullState);
  }

  public switchMode(mode: Mode) {
    this.fullState.mode = mode;
    this.appState$.next(this.fullState);
  }

  public switchAction(action: Action) {
    this.fullState.action = action;
    this.appState$.next(this.fullState);
  }

  public checkChromeError(): boolean {
    const error = chrome.runtime.lastError;
    if (error) {
      this.setStatus(JSON.stringify(error), StatusType.Error);
    }
    return !!error;
  }
}
