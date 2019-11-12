export interface FormSnapshot {
  content: any[];
  error: boolean;
}

export interface FormData {
  id: string;
  url: string;
  fillName: string;
  fill: any[];
  preview: string;
  hotkey?: string;
  comment?: string;
  editMode?: boolean;
}
