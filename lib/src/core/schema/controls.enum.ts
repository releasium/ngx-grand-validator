export enum FormControlType {
  ARRAY = 'ARRAY',
  GROUP = 'GROUP',
  CONTROL = 'CONTROL'
}

export namespace FormControlType {
  export function isArray(type: FormControlType) {
    return type === FormControlType.ARRAY;
  }

  export function isGroup(type: FormControlType) {
    return type === FormControlType.GROUP;
  }

  export function isControl(type: FormControlType) {
    return type === FormControlType.CONTROL;
  }
}
