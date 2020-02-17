import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { FormData } from '../shared/app.models';
import { AppService } from '../shared/app.service';
import { NgForm } from '@angular/forms';
import { Subscription, Observable, Subject, Subscriber } from 'rxjs';
import { tryParseJSON } from '../shared/helpers';
import { Mode, StatusType } from '../shared/enum.models';

@Component({
  selector: 'app-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['../app.component.scss']
})
export class EditFormComponent implements OnInit, OnChanges {
  @Input()
  public snapshot: FormData;

  //@ViewChild('f')
  public form: NgForm;

  public testCtrl: string = '';
  public hotkeyChanged = new Subject<string>();
  public subscription = new Subscription();

  constructor(private _changeDetector: ChangeDetectorRef, public appService: AppService, public renderer: Renderer2) {}

  ngOnInit() {
    this.snapshot.hotkeyText = this.snapshot.hotkey ? this.prettifyHotkey(this.snapshot.hotkey) : '';

    this.hotkeyChanged.subscribe(res => {
      this.snapshot.hotkey = res;
    });
  }

  ngOnChanges() {
    // TODO: this doesn't seem to detectChanges
    this._changeDetector.detectChanges();
  }

  private prettifyHotkey(hotkey: string) {
    let result = '';
    result = hotkey.replace('control.', 'Ctrl + ');
    return result;
  }

  public inputHotkey($event: KeyboardEvent) {
    if ($event.ctrlKey && $event.key) {
      const newHotkey = 'control.' + $event.key;
      this.hotkeyChanged.next(newHotkey);
      this.snapshot.hotkeyText = this.prettifyHotkey(newHotkey);
      $event.stopPropagation();
    }
    //  else if ($event.key !== 'Control') {
    //   this.hotkeyChanged.next('');
    //   this.snapshot.hotkeyText = '';
    // }

    this._changeDetector.detectChanges();
  }

  public editFormSnapShot() {
    let updatedSnap = {};
    console.log(this.snapshot);

    //Process inputs
    const newFields = tryParseJSON(this.snapshot.preview);
    if (!newFields) {
      this.appService.setStatus('Invalid JSON entered! Please revise', StatusType.Error);
      return;
    } else {
      this.snapshot.fill = newFields;
    }

    updatedSnap[this.snapshot.id] = this.snapshot;

    chrome.storage.local.set(updatedSnap, () => {
      if (this.appService.checkChromeError()) return;
      this.appService.setStatus("Successfully updated form: '" + this.snapshot.fillName + "'", StatusType.Success);
      this.appService.switchMode(Mode.List);
    });
  }

  public cancelEditFormSnapShot() {
    this.appService.switchMode(Mode.List);
    this.appService.setStatus('');
  }
}
