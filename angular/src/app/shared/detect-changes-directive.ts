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
@Directive({
  selector: '[detectChanges]'
})
export class DetectChangesDirective implements OnInit, OnChanges {
  @Input() public detectChanges: any;
  //@Input() public input: string;
  //<!-- [input]="snapshot.fillName" -->
  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {}

  //@HostListener('window:keyup')
  @HostListener('input', ['$event']) onInput(event) {
    //console.log(event.target.value);
    this.cd.detectChanges();
  }
  ngOnChanges(changes: SimpleChanges) {
    //if (changes.input) {
    //console.log('input changed');
    //this.cd.detectChanges();
    //}
  }
}
