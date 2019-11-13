// prettier-ignore
import { ChangeDetectorRef,Component,Inject,ChangeDetectionStrategy,
  OnInit, AfterViewInit, Input, NgZone, OnChanges } from "@angular/core";
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Router } from '@angular/router';
import { TAB_ID } from './shared/tab-id.injector';
import { FormData, FormSnapshot, Modes } from './shared/app.models';
import { AppService } from './shared/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnChanges {
  private readonly _message = new Subject<string>();
  public currentFormSnapshot: string;
  public dataSource: FormData[];
  public currentUrl: string;
  public newFillName: string;
  public Modes = Modes;
  public currentMode = Modes.List;

  public currentSnapshot: FormData;

  readonly tabId = this._tabId;

  public snapshotSubject = new Subject<FormData>();
  readonly snapshot$ = this.snapshotSubject
    .asObservable()
    .pipe(tap(() => setTimeout(() => this._changeDetector.detectChanges())));

  constructor(
    @Inject(TAB_ID) private readonly _tabId: number,
    private readonly _changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
    private router: Router,
    private appService: AppService,
    private zone: NgZone
  ) {}

  public ngOnInit() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      this.currentUrl = tabs[0].url;
      this.loadFilledPageData(this.currentUrl);
    });
  }

  public switchMode(mode: Modes) {
    this.currentMode = mode;
    this._changeDetector.detectChanges();
  }

  public ngAfterViewInit() {}

  public ngOnChanges() {
    //this._changeDetector.detectChanges();
  }

  public loadFilledPageData(url: string) {
    this.appService.getFormSnapshots(url).subscribe(x => {
      this.dataSource = x;
      this._changeDetector.detectChanges();
      // setTimeout(() => {
      //   this._changeDetector.detectChanges();
      // });
    });
  }

  public onClick(): void {
    chrome.tabs.sendMessage(this.tabId, { command: 'save_form' }, message => {
      this._message.next(
        chrome.runtime.lastError
          ? `The current page is protected by the browser or try to refresh the current page...`
          : message
      );
      this.currentFormSnapshot = JSON.stringify(message);
    });
  }

  public saveFill(): boolean {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'save_form' }, response => {
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
      chrome.tabs.sendMessage(tabs[0].id, { command: 'load', data: snap }, response => {
        if (response.error) console.log(response.message);
        else {
          console.log('Response received: ' + JSON.stringify(response));
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
        const deleteIndex = this.dataSource.findIndex(x => x.id == snap.id);
        if (deleteIndex > -1) this.dataSource.splice(deleteIndex, 1);
        this._changeDetector.detectChanges();
      }
    });
  }

  public editFormSnapshot(snap: FormData) {
    this.currentSnapshot = JSON.parse(JSON.stringify(snap));
    this.switchMode(Modes.Edit);
  }

  public updateFormSnapShot() {
    let snap = this.currentSnapshot;
    let updatedSnap = {};
    updatedSnap[snap.id] = snap;
    chrome.storage.sync.set(updatedSnap, () => {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      } else {
        this.switchMode(Modes.List);
        this.loadFilledPageData(this.currentUrl);
      }
    });
  }

  public storeInputs(inputs: any): void {
    const id = this.datePipe.transform(new Date(), 'yyyy-MM-dd') + '-' + uuid.v4();
    const entryName = this.newFillName ? this.newFillName.trim() : 'Unnamed Form';

    let storageEntry: FormData = {
      id: id,
      fillName: entryName,
      url: this.currentUrl,
      fill: inputs,
      preview: JSON.stringify(inputs, null, 2),
      comment: 'N/A'
    };

    chrome.storage.sync.set({ [id]: storageEntry }, () => {
      this.newFillName = '';
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
