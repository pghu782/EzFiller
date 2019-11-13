import { FormData, Modes } from './app.models';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public form: FormData;
  private readonly dataSubject: BehaviorSubject<Array<FormData>>;
  private readonly _data$: Observable<Array<FormData>>;

  constructor() {
    this.dataSubject = new BehaviorSubject([]);
    this._data$ = this.dataSubject.asObservable();
  }

  public switchMode(mode: Modes) {
    //this.currentMode = mode;
  }

  public getFormSnapshots(url: string): Observable<FormData[]> {
    return new Observable<FormData[]>(subscriber => {
      let dataArr: FormData[] = [];

      chrome.storage.sync.get(null, (items: FormData[]) => {
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

  public urlMatch(targetUrl, storedUrl) {
    if (!storedUrl) {
      return false;
    }

    var filterType = 'FULL';
    var url1 = this.parseUri(targetUrl.toLowerCase());
    var url2 = this.parseUri(storedUrl.toLowerCase());

    if (storedUrl === '*') {
      return true;
    } else if (filterType === 'FILTER_BY_DOMAIN') {
      return url1.host === url2.host;
    } else if (filterType === 'FULL') {
      //return (url1.protocol + url1.host + url1.path) == (url2.protocol + url2.host + url2.path);
      return url1.host + url1.path == url2.host + url2.path;
    } else if (filterType === 'FILTER_BY_FULL') {
      //return current == storage;
    } else {
      console.error('Filter has not been set: ' + filterType);
      return false;
    }
  }

  public parseUri(url) {
    var a = document.createElement('a');
    a.setAttribute('href', url);

    return {
      host: a.hostname,
      path: a.pathname
    };
  }
}
