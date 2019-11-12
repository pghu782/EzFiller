import { FormData, Modes } from './app.models';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public form: FormData;

  public switchMode(mode: Modes) {
    //this.currentMode = mode;
  }
}
