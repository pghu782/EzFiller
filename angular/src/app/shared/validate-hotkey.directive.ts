import {
  Directive,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  OnChanges,
  SimpleChanges,
  HostListener
} from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, FormControl } from '@angular/forms';
import { AppService } from './app.service';

@Directive({
  selector: '[appValidateHotkey]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: ValidateHotkeyDirective,
      multi: true
    }
  ]
})
export class ValidateHotkeyDirective implements Validator {
  validator: ValidatorFn;

  constructor(private cd: ChangeDetectorRef, private appService: AppService) {
    this.validator = this.hotkeyValidator();
  }

  //@HostListener('window:keyup')
  @HostListener('input', ['$event']) onInput(event) {
    //console.log(event.target.value);
    this.cd.detectChanges();
  }

  public validate(c: FormControl) {
    return this.validator(c);
  }

  public hotkeyValidator(): ValidatorFn {
    return (c: FormControl) => {
      console.log(c.value);
      //let isValid = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(c.value);
      let isValid = /^Ctrl\s\+\s[a-z]$/.test(c.value);
      if (isValid) {
        return null;
      } else {
        return {
          appValidateHotkey: true
        };
      }
    };
  }

  public hotkeyValidator2(): ValidatorFn {
    return (c: FormControl) => {
      if (this.appService.checkHotKeyDuplicates) {
        return {
          appValidateHotkey: {
            valid: false
          }
        };
      } else {
        return null;
      }
    };
  }
}
