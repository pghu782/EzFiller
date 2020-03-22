import { StatusType, Mode, FilterType, Action } from './enum.models';

export class FormData {
  id: string;
  url: string;
  fillName: string;
  preview: string;
  hotkey?: string;
  hotkeyText?: string;
  comment?: string;
  editMode?: boolean;
  fill: any[];
}

export class AppState {
  statusText: string;
  statusType: StatusType;
  mode: Mode;
  action: Action;
  filterType: FilterType;

  constructor() {
    this.statusText = '';
    this.statusType = StatusType.Info;
    this.mode = Mode.List;
    this.action = Action.Create;
    this.filterType = FilterType.Full;
  }
}
