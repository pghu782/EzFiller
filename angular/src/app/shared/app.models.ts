export enum Modes {
  List = 1,
  Edit
}

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
  comment?: string;
  editMode?: boolean;
  fill: any;
}
