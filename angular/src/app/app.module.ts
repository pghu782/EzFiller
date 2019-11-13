import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TruncatePipe } from './shared/truncatePipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditFormComponent } from './edit-form/edit-form.component';
import { DetectChangesDirective } from './shared/detect-changes-directive';

@NgModule({
  declarations: [AppComponent, TruncatePipe, EditFormComponent, DetectChangesDirective],
  imports: [CommonModule, NgbModule, BrowserModule, AppRoutingModule, FormsModule, RouterModule],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule {}
