// prettier-ignore
import { ChangeDetectorRef,Component,Inject,ChangeDetectionStrategy,
  OnInit, AfterViewInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Subject } from "rxjs";
import { tap } from "rxjs/operators";
import { TAB_ID } from "./tab-id.injector";
import * as uuid from "uuid";
import { Router } from "@angular/router";

import { FormData, FormSnapshot } from "./shared/app.models";
import { AppService } from "./shared/app.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly _message = new Subject<string>();
  public currentFormSnapshot: string;
  public dataSource: FormData[] = [];
  public currentUrl: string;
  public newFillName: string;

  readonly tabId = this._tabId;
  readonly message$ = this._message.asObservable().pipe(tap(() => setTimeout(() => this._changeDetector.detectChanges())));

  constructor(
    @Inject(TAB_ID) private readonly _tabId: number,
    private readonly _changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
    private router: Router,
    private appService: AppService
  ) {}

  public ngOnInit() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      this.currentUrl = tabs[0].url;
      this.loadFilledPageData(this.currentUrl);
    });
  }

  public ngAfterViewInit() {}

  public loadFilledPageData(url: string) {
    chrome.storage.sync.get(null, items => {
      for (var key in items) {
        //if (key == 'filter') {
        //   continue;
        //}
        if (this.urlMatch(url, items[key].url)) {
          this.dataSource.push(items[key]);
        }
      }
      this._changeDetector.detectChanges();
    });
  }

  private urlMatch(targetUrl, storedUrl) {
    if (!storedUrl) {
      return false;
    }

    var filterType = "FULL";
    var url1 = this.parseUri(targetUrl.toLowerCase());
    var url2 = this.parseUri(storedUrl.toLowerCase());

    if (storedUrl === "*") {
      return true;
    } else if (filterType === "FILTER_BY_DOMAIN") {
      return url1.host === url2.host;
    } else if (filterType === "FULL") {
      //return (url1.protocol + url1.host + url1.path) == (url2.protocol + url2.host + url2.path);
      return url1.host + url1.path == url2.host + url2.path;
    } else if (filterType === "FILTER_BY_FULL") {
      //return current == storage;
    } else {
      console.error("Filter has not been set: " + filterType);
      return false;
    }
  }

  private parseUri(url) {
    var a = document.createElement("a");
    a.setAttribute("href", url);

    return {
      host: a.hostname,
      path: a.pathname
    };
  }

  public onClick(): void {
    chrome.tabs.sendMessage(this.tabId, { command: "save_form" }, message => {
      this._message.next(chrome.runtime.lastError ? `The current page is protected by the browser or try to refresh the current page...` : message);
      this.currentFormSnapshot = JSON.stringify(message);
      //console.log(this.currentFormSnapshot);
    });
  }

  public saveFill(): boolean {
    //TODO: rename

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: "save_form" }, response => {
        if (response.error) console.log(response.message);
        else {
          this.storeInputs(response.content);
        }
      });
    });
    return true;
  }

  public loadFormSnapshot(snap: FormData) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: "load", data: snap }, response => {
        if (response.error) console.log(response.message);
        else {
          console.log("Response received: " + JSON.stringify(response));
        }
      });
    });
  }

  public clearStorage() {
    chrome.storage.sync.clear(function() {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
  }

  public deleteFormSnapshot(snap: FormData) {
    chrome.storage.sync.remove(snap.id, () => {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      } else {
        console.log(this.dataSource);
        const deleteIndex = this.dataSource.findIndex(x => x.id == snap.id);
        if (deleteIndex > -1) this.dataSource.splice(deleteIndex, 1);
        this._changeDetector.detectChanges();
      }
    });
  }

  public editFormSnapshot(snap: FormData) {
    snap.editMode = true;

    this.appService.form = snap;
    this._changeDetector.detectChanges();
  }

  public storeInputs(inputs: any): void {
    const id = this.datePipe.transform(new Date(), "yyyy-MM-dd") + "-" + uuid.v4();
    const entryName = this.newFillName ? this.newFillName.trim() : "Unnamed Form";

    let storageEntry: FormData = {
      id: id,
      fillName: entryName,
      url: this.currentUrl,
      fill: inputs,
      preview: JSON.stringify(inputs),
      comment: "N/A"
    };

    chrome.storage.sync.set({ [id]: storageEntry }, () => {
      //console.log(inputs);
      this.newFillName = "";
      this.dataSource.push(storageEntry);
      this._changeDetector.detectChanges();
    });
  }
}

// document.addEventListener(
//   "DOMContentLoaded",
//   function() {
//     document.addEventListener("keypress", event => {
//       if (event.keyCode == 13) {
//         alert("hi.");
//       }
//     });
//   },
//   false
// );
