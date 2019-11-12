import { Component, OnInit, Input } from "@angular/core";
import { FormData, FormSnapshot } from "../shared/app.models";

import { AppService } from "../shared/app.service";

@Component({
  selector: "app-edit-form",
  templateUrl: "./edit-form.component.html",
  styleUrls: ["../app.component.scss"]
})
export class EditFormComponent implements OnInit {
  @Input()
  public snapshot: FormData;

  constructor(private appService: AppService) {}

  ngOnInit() {}

  ngOnChanges(): void {
    this.snapshot = this.appService.form;
  }
}
