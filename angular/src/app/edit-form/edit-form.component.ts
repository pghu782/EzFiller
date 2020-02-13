import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormData, FormSnapshot, Modes } from '../shared/app.models';

import { AppService } from '../shared/app.service';
import { NgForm, NgModel } from '@angular/forms';
import { Subscription, Observable, Subject, Subscriber } from 'rxjs';
import { debounceTime, distinctUntilChanged, mergeMap } from 'rxjs/operators';

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

  constructor(private appService: AppService, private readonly _changeDetector: ChangeDetectorRef) {}
  ngOnInit() {
    this.hotkeyChanged.subscribe(res => {
      this.snapshot.hotkey = res;
    });
  }

  ngOnChanges() {
    this._changeDetector.detectChanges();
  }

  public onSubmit(f: NgForm) {
    console.log(f.value); // { first: '', last: '' }
  }

  public inputHotkey($event: KeyboardEvent) {
    if (($event.ctrlKey || $event.altKey) && $event.key) {
      this.hotkeyChanged.next('CTRL + ' + $event.key);
      ($event.target as HTMLInputElement).value = 'CTRL + ' + $event.key;

      $event.stopPropagation();
    } else if ($event.key !== 'Control') {
      this.hotkeyChanged.next('');
      ($event.target as HTMLInputElement).value = '';
    }
    this._changeDetector.detectChanges();
  }
}
