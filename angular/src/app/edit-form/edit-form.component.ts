import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormData, FormSnapshot, Modes } from '../shared/app.models';

import { AppService } from '../shared/app.service';
import { NgForm } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';

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

  constructor(private appService: AppService, private readonly _changeDetector: ChangeDetectorRef) {}
  ngOnInit() {
    //this.subscription = this.snapshot$.
  }

  ngOnChanges() {
    this._changeDetector.detectChanges();
  }

  onSubmit(f: NgForm) {
    console.log(f.value); // { first: '', last: '' }
  }
}
