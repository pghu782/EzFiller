import { FormData, AppState } from './app.models';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { StatusType, Mode, FilterType } from './enum.models';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public form: FormData;
  private readonly dataSubject: BehaviorSubject<Array<FormData>>;
  private readonly _data$: Observable<Array<FormData>>;

  public readonly currentMode$ = new Subject<Mode>();
  public readonly statusText$ = new Subject<string>();
  public readonly statusType$ = new Subject<StatusType>();
  public statusType: StatusType;
  public readonly appState$ = new Subject<AppState>();

  private fullState: AppState;

  constructor() {
    this.dataSubject = new BehaviorSubject([]);
    this._data$ = this.dataSubject.asObservable();
    this.fullState = new AppState();
    // this.currentMode = Modes.List;
  }

  public getFormSnapshots(url: string) {
    return new Observable<FormData[]>(subscriber => {
      chrome.storage.local.get(null, (items: FormData[]) => {
        let dataArr: FormData[] = [];
        for (var key in items) {
          if (this.urlMatch(url, items[key].url)) {
            dataArr.push(items[key]);
          }
        }
        subscriber.next(dataArr);
      });
    });
  }

  get myData$(): Observable<Array<FormData>> {
    return this._data$;
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

  public checkChromeError(): boolean {
    const error = chrome.runtime.lastError;
    if (error) {
      this.setStatus(JSON.stringify(error), StatusType.Error);
    }
    return !!error;
  }
}
