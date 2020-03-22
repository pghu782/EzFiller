import { FormData, AppState } from './app.models';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject, of, Subscriber } from 'rxjs';
import { StatusType, Mode, FilterType, PageCommand, Action } from './enum.models';
import { Form } from '@angular/forms';
import { tryParseJSON } from './helpers';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public readonly dataSource$ = new Subject<FormData>();
  public readonly detectDisplayChanges$ = new Subject<boolean>();
  public readonly statusText$ = new Subject<string>();
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

  public importFile$(file: File) {
    const fileReader = new FileReader();
    fileReader.readAsText(file);

    return new Observable((observer: Subscriber<any>): void => {
      fileReader.onload = (ev: ProgressEvent): void => {
        const importJson = tryParseJSON((ev.target as any).result);
        if (!importJson) {
          this.setStatus('Invalid JSON imported.', StatusType.Error);
          observer.error('Invalid JSON imported.');
        }

        const snapshot = {
          id: '',
          fillName: file.name,
          url: '',
          fill: importJson,
          preview: (ev.target as any).result,
          comment: ''
        };
        observer.next(snapshot);
        observer.complete();
      };

      fileReader.onerror = (error): void => {
        observer.error(error);
      };
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

    // TODO: implement versatile URL matching
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

  public clearStatus() {
    this.setStatus('');
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
