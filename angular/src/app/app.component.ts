// prettier-ignore
import { ChangeDetectorRef,Component,Inject,
  OnInit, Renderer2 } from "@angular/core";
import { Router } from '@angular/router';
import { TAB_ID } from './shared/tab-id.injector';
import { FormData, FormSnapshot, AppState } from './shared/app.models';
import { AppService } from './shared/app.service';
import { PageCommand, Mode, StatusType, FilterType, Action } from './shared/enum.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public Mode = Mode;
  public StatusType = StatusType;
  public FilterType = FilterType;
  public Action = Action;

  public appState: AppState;
  public currentFormSnapshot: string;
  public dataSource: FormData[] = [];
  public currentUrl: string;
  public currentSnapshot: FormData;

  readonly tabId = this._tabId;

  // public snapshotSubject = new Subject<FormData>();
  // readonly snapshot$ = this.snapshotSubject
  //   .asObservable()
  //   .pipe(tap(() => setTimeout(() => this._changeDetector.detectChanges())));

  constructor(
    @Inject(TAB_ID) private readonly _tabId: number,
    public readonly _changeDetector: ChangeDetectorRef,
    public appService: AppService,
    public renderer: Renderer2,
    public router: Router
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

    this.appService.detectDisplayChanges$.subscribe(() => {
      this._changeDetector.detectChanges();
    });

    this.appService.dataSource$.subscribe(response => {
      this.dataSource.push(response);
      this._changeDetector.detectChanges();

      // this.dataSource.forEach(element => {
      //   if (element.hotkey) {
      //     this.bindHotKeys(element.hotkey, element.id);
      //   }
      // });
    });
  }

  public onKeyDown($event) {
    // this.updateStatusText($event);
  }

  private querySnapshotData() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      this.currentUrl = tabs[0].url;
      this.appService.getSnapshots(this.currentUrl).subscribe(() => {
        this.appService.setStatus('Loaded all snapshots!', StatusType.Success);
        this._changeDetector.detectChanges();
      });
    });
  }

  private bindHotKeys(hotkey: string, snapshotId: string) {
    this.renderer.listen(document, 'keydown.' + hotkey, event => {
      // console.log(event);
      this.loadFormSnapShotFromId(snapshotId);
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

  public deleteFormSnapshot(snap: FormData) {
    chrome.storage.local.remove(snap.id, () => {
      if (this.appService.checkChromeError()) return;
      const deleteIndex = this.dataSource.findIndex(x => x.id == snap.id);
      if (deleteIndex > -1) this.dataSource.splice(deleteIndex, 1);
      this._changeDetector.detectChanges();
    });
  }

  public editSnapshot(snap: FormData) {
    this.currentSnapshot = snap;
    this.appService.switchMode(Mode.Edit);
    this.appService.switchAction(Action.Edit);
    this._changeDetector.detectChanges();
  }

  public saveSnapshot() {
    this.currentSnapshot = null;
    this.appService.switchMode(Mode.Edit);
    this.appService.switchAction(Action.Create);
    this._changeDetector.detectChanges();
  }
}
