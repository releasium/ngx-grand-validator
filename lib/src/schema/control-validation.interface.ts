import { FormControlType } from './controls.enum';

export interface GVItemConfig {
  name: string;
  type: FormControlType;
  validation?: GVRuleItems[];
  arrayFormGroup?: GVItemConfig[];
  arrayLength?: number;
}

export interface GVRuleItems {
  available: boolean;
  rules: GVRules;
}

export interface GVRules {
  [key: string]: GVRule|string|number|boolean|RegExp|string[];
}

export interface GVRule {
  value: any;
  msg?: string;
  disabled?: boolean;
}

export interface GVData<T> {
  [key: string]: T[];
}
