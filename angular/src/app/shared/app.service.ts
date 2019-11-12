import { FormData } from "./app.models";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class AppService {
  public form: FormData;
}
