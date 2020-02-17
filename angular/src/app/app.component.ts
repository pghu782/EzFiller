// prettier-ignore
import { ChangeDetectorRef,Component,Inject,ChangeDetectionStrategy,
  OnInit, AfterViewInit, Input, NgZone, OnChanges, HostListener, Renderer2 } from "@angular/core";
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Router } from '@angular/router';
import { TAB_ID } from './shared/tab-id.injector';
import { FormData, FormSnapshot, Modes } from './shared/app.models';
import { AppService } from './shared/app.service';
import { PageCommands } from './shared/enum.models';
import { tryParseJSON } from './shared/helpers';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly _message = new Subject<string>();
  public currentFormSnapshot: string;
  public dataSource: FormData[];
  public currentUrl: string;
  public newFillName: string;
  public Modes = Modes;
  public currentMode = Modes.List;

  public currentSnapshot: FormData;
  public statusText: string = '';

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
    private zone: NgZone,
    private renderer: Renderer2
  ) {}

  public ngOnInit() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      this.currentUrl = tabs[0].url;
      this.loadFilledPageData(this.currentUrl);
    });

    this._message.subscribe(m => {
      this.updateStatusText('ERROR: ' + m);
    });
  }

  private listenHotKeys($event) {
    console.log('got here with: ' + JSON.stringify($event));
  }

  public onKeyDown($event) {
    this.updateStatusText($event);
  }

  public switchMode(mode: Modes) {
    this.currentMode = mode;
    this._changeDetector.detectChanges();
  }

  public loadFilledPageData(url: string) {
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
      chrome.tabs.sendMessage(tabs[0].id, { command: PageCommands.SaveForm }, response => {
        if (response.error) {
          this.setErrorText(response.message);
        } else {
          this.storeInputs(response.content);
          this.updateStatusText('Saved form!');
        }
      });
    });
  }

  public loadFormSnapshot(snap: FormData) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { command: PageCommands.Load, data: snap }, response => {
        if (response.error) {
          this.setErrorText(response.message);
        } else {
          console.log('Response received: ' + JSON.stringify(response));
          this.updateStatusText("Fields from saved form '" + snap.fillName + "' successfully loaded.");
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

  public clearStorage() {
    chrome.storage.local.clear(function() {
      this.checkChromeError();
    });
  }

  public deleteFormSnapshot(snap: FormData) {
    chrome.storage.local.remove(snap.id, () => {
      if (this.checkChromeError()) return;
      const deleteIndex = this.dataSource.findIndex(x => x.id == snap.id);
      if (deleteIndex > -1) this.dataSource.splice(deleteIndex, 1);
      this._changeDetector.detectChanges();
    });
  }

  public editFormSnapshot(snap: FormData) {
    this.currentSnapshot = snap;
    this.switchMode(Modes.Edit);
  }

  public editFormSnapShot() {
    let updatedSnap = {};
    const snap = this.currentSnapshot;
    console.log(snap);

    //Process inputs
    const newFields = tryParseJSON(snap.preview);
    if (!newFields) {
      this.updateStatusText('Invalid JSON entered! Please revise');
      return;
    } else {
      snap.fill = newFields;
    }

    updatedSnap[snap.id] = snap;

    chrome.storage.local.set(updatedSnap, () => {
      if (this.checkChromeError()) return;
      this.switchMode(Modes.List);
      this.loadFilledPageData(this.currentUrl);
    });
  }

  public cancelEditFormSnapShot() {
    //TODO: revert values
    this.switchMode(Modes.List);
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
      if (this.checkChromeError()) return;
      this.newFillName = '';
      this.dataSource.push(storageEntry);
      this._changeDetector.detectChanges();
    });
  }

  private setErrorText(text: string) {
    this._message.next(text);
  }

  private checkChromeError(): boolean {
    const error = chrome.runtime.lastError;
    if (error) {
      this._message.next(JSON.stringify(error));
    }
    return !!error;
  }

  private updateStatusText(text: string) {
    this.statusText = text;
    this._changeDetector.detectChanges();
  }
}
