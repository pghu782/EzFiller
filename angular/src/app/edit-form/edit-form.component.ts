import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { FormData } from '../shared/app.models';
import { AppService } from '../shared/app.service';
import { NgForm } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { tryParseJSON } from '../shared/helpers';
import { Mode, StatusType, Action } from '../shared/enum.models';
import { DatePipe } from '@angular/common';
import * as uuid from 'uuid';

@Component({
  selector: 'edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['../app.component.scss']
})
export class EditFormComponent implements OnInit, OnChanges {
  @Input()
  public snapshot: FormData;
  @Input()
  public url;

  public form: NgForm;
  public testCtrl: string = '';
  public hotkeyChanged = new Subject<string>();
  public subscription = new Subscription();

  private action: Action;

  constructor(
    private _changeDetector: ChangeDetectorRef,
    public appService: AppService,
    public datePipe: DatePipe,
    public renderer: Renderer2
  ) {}

  ngOnInit() {
    this.appService.appState$.subscribe(response => {
      this.action = response.action;
    });

    if (!this.snapshot) {
      this.snapshot = new FormData();
      this.appService.initSnapshot$().subscribe((response: any) => {
        if (response.error) {
          this.appService.setStatus(response.message, StatusType.Error);
        } else {
          this.snapshot = {
            id: '',
            fillName: 'Unnamed',
            url: this.url,
            fill: response.content,
            preview: JSON.stringify(response.content, null, 2),
            comment: ''
          };
          this.appService.refreshDisplay();
        }
      });
    } else {
      this.snapshot.hotkeyText = this.snapshot.hotkey ? this.prettifyHotkey(this.snapshot.hotkey) : '';
      this.hotkeyChanged.subscribe(res => {
        this.snapshot.hotkey = res;
      });
    }
  }

  ngOnChanges() {
    this.appService.refreshDisplay();
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

  public saveSnapshot() {
    const newFields = tryParseJSON(this.snapshot.preview);
    if (!newFields) {
      this.appService.setStatus('Invalid JSON entered! Please revise', StatusType.Error);
      return;
    } else {
      this.snapshot.fill = newFields;
    }

    if (!this.snapshot.id || this.snapshot.id === '') {
      this.snapshot.id = this.datePipe.transform(new Date(), 'yyyy-MM-dd') + '-' + uuid.v4();
    }

    this.snapshot.url = this.parseUrl(this.snapshot.url);

    this.appService.saveSnapshot$(this.snapshot).subscribe(response => {
      if (this.appService.checkChromeError()) return;
      this.appService.setStatus('Saved form!', StatusType.Success);
      this.appService.switchMode(Mode.List);
      this.appService.refreshDisplay();
    });
  }

  public cancelEditFormSnapShot() {
    this.appService.switchMode(Mode.List);
    this.appService.setStatus('');
  }

  private parseUrl(url: string) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    return url;
  }

  private validateForm() {
    const newFields = tryParseJSON(this.snapshot.preview);
    if (!newFields) {
      this.appService.setStatus('Invalid JSON entered! Please revise', StatusType.Error);
      return false;
    }

    return true;
  }
}
