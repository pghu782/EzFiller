import {
  Component,
  OnInit,
  Input,
  OnChanges,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Renderer2
} from '@angular/core';
import { FormData, FormSnapshot, Modes } from '../shared/app.models';

import { AppService } from '../shared/app.service';
import { NgForm, NgModel } from '@angular/forms';
import { Subscription, Observable, Subject, Subscriber } from 'rxjs';
import { debounceTime, distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { tryParseJSON } from '../shared/helpers';
import { AppComponent } from '../app.component';
import { DatePipe } from '@angular/common';

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

  // public editFormSnapShot() {
  //   let updatedSnap = {};
  //   const snap = this.currentSnapshot;
  //   console.log(snap);

  //   //Process inputs
  //   const newFields = tryParseJSON(snap.preview);
  //   if (!newFields) {
  //     this.updateStatusText('Invalid JSON entered! Please revise');
  //     return;
  //   } else {
  //     snap.fill = newFields;
  //   }

  //   updatedSnap[snap.id] = snap;

  //   chrome.storage.local.set(updatedSnap, () => {
  //     if (this.checkChromeError()) return;
  //     this.appService.switchMode(Modes.List);
  //     this.loadFilledPageData(this.currentUrl);
  //   });
  // }

  public cancelEditFormSnapShot() {
    this.appService.switchMode(Modes.List);
    this.appService.setStatus('');
  }
}
