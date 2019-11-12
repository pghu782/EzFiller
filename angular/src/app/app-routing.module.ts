import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { EditFormComponent } from "./edit-form/edit-form.component";

const routes: Routes = [
  {
    path: "edit",
    component: EditFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
