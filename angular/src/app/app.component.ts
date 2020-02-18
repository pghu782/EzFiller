// prettier-ignore
import { ChangeDetectorRef,Component,Inject,
  OnInit, Renderer2 } from "@angular/core";
import { DatePipe } from '@angular/common';
import * as uuid from 'uuid';
import { Router } from '@angular/router';
import { TAB_ID } from './shared/tab-id.injector';
import { FormData, FormSnapshot, AppState } from './shared/app.models';
import { AppService } from './shared/app.service';
import { PageCommand, Mode, StatusType, FilterType } from './shared/enum.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public Mode = Mode;
  public StatusType = StatusType;
  public FilterType = FilterType;

  public appState: AppState;
  public currentFormSnapshot: string;
  public dataSource: FormData[];
  public currentUrl: string;
  public newFillName: string;
  public currentSnapshot: FormData;

  readonly tabId = this._tabId;

  // public snapshotSubject = new Subject<FormData>();
  // readonly snapshot$ = this.snapshotSubject
  //   .asObservable()
  //   .pipe(tap(() => setTimeout(() => this._changeDetector.detectChanges())));

  constructor(
    @Inject(TAB_ID) private readonly _tabId: number,
    public readonly _changeDetector: ChangeDetectorRef,
    public datePipe: DatePipe,
    public appService: AppService,
    public renderer: Renderer2
  ) {
    this.appState = new AppState();
    this.appState.statusText = 'Form extension initialized.';
  }

  ngOnInit() {
    this.querySnapshotData();

    this.appService.appState$.subscribe(response => {
      this.appState = response;
      this._changeDetector.detectChanges();
    });
  }

  public onKeyDown($event) {
    // this.updateStatusText($event);
  }

  private querySnapshotData() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      this.currentUrl = tabs[0].url;
      this.initSnapshotData(this.currentUrl);
    });
  }

  private initSnapshotData(url: string) {
    this.appService.getFormSnapshots(url).subscribe(response => {
      this.dataSource = response;
      this._changeDetector.detectChanges();

      this.dataSource.forEach(element => {
        if (element.hotkey) {
          this.bindHotKeys(element.hotkey, element.id);
        }
      });
    });
  }

  private bindHotKeys(hotkey: string, snapshotId: string) {
    this.renderer.listen(document, 'keydown.' + hotkey, event => {
      // console.log(event);
      this.loadFormSnapShotFromId(snapshotId);
    });
  }

  public saveFill() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: PageCommand.SaveForm }, response => {
        if (response.error) {
          this.appService.setStatus(response.message, StatusType.Error);
        } else {
          this.storeInputs(response.content);
          this.appService.setStatus('Saved form!', StatusType.Info);
        }
      });
    });
  }

  public loadFormSnapshot(snap: FormData) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: PageCommand.Load, data: snap }, response => {
        if (response.error) {
          this.appService.setStatus(response.message, StatusType.Error);
        } else {
          console.log('Response received: ' + JSON.stringify(response));
          this.appService.setStatus(
            "Fields from saved form '" + snap.fillName + "' successfully loaded.",
            StatusType.Info
          );
        }
      });
    });
  }

  public loadFormSnapShotFromId(id: string) {
    const snap = this.dataSource.find(f => f.id == id);
    if (snap) {
      this.loadFormSnapshot(snap);
    }
  }

  public switchUrlScheme(scheme: FilterType) {
    this.appService.switchUrlScheme(scheme);
    this.querySnapshotData();
  }

  public clearStorage() {
    chrome.storage.local.clear(() => {
      this.appService.checkChromeError();
      this.dataSource = [];
      this.appService.setStatus('Clear all form data!', StatusType.Success);
      this._changeDetector.detectChanges();
    });
  }

  public switchMode(mode: Mode) {
    this.appService.switchMode(mode);
  }

  public deleteFormSnapshot(snap: FormData) {
    chrome.storage.local.remove(snap.id, () => {
      if (this.appService.checkChromeError()) return;
      const deleteIndex = this.dataSource.findIndex(x => x.id == snap.id);
      if (deleteIndex > -1) this.dataSource.splice(deleteIndex, 1);
      this._changeDetector.detectChanges();
    });
  }

  public editFormSnapshot(snap: FormData) {
    this.currentSnapshot = snap;
    this.appService.switchMode(Mode.Edit);
    this._changeDetector.detectChanges();
  }

  public storeInputs(inputs: any): void {
    const entryId = this.datePipe.transform(new Date(), 'yyyy-MM-dd') + '-' + uuid.v4();
    const entryName = this.newFillName ? this.newFillName.trim() : 'Unnamed Form';

    const storageEntry: FormData = {
      id: entryId,
      fillName: entryName,
      url: this.currentUrl,
      fill: inputs,
      preview: JSON.stringify(inputs, null, 2),
      comment: 'N/A'
    };

    chrome.storage.local.set({ [entryId]: storageEntry }, () => {
      if (this.appService.checkChromeError()) return;
      this.newFillName = '';
      this.dataSource.push(storageEntry);
      this._changeDetector.detectChanges();
    });
  }
}
