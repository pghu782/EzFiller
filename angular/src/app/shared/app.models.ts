import { StatusType, Mode } from './enum.models';

export interface FormSnapshot {
  content: any[];
  error: boolean;
}

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

  constructor() {
    this.statusText = '';
    this.statusType = StatusType.Info;
    this.mode = Mode.List;
  }
}
