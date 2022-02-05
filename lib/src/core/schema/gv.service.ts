import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';

import { FormControlType } from './controls.enum';
import { GVItemConfig, GVRules, GVRule, GVData } from './control-validation.interface';
import { GVModel } from '../gv';
import { GVDefaultValidators } from '../../validators/gv-default-validators';

@Injectable()
export class GVService {
  constructor(private fb: FormBuilder) {}

  createForm(model: typeof GVModel, schema: GVItemConfig[]): FormGroup {
    const form = model.createUIForm();
    this.applySchema(schema, form, undefined, model);

    return form;
  }

  isControlAvailable(name: string, schema: GVItemConfig[]): boolean {
    const control = schema.find(c => c.name === name);
    return !!control?.validation?.find(c => c.available);
  }

  applySchema<T>(
    schema: GVItemConfig[],
    form: FormGroup,
    data: GVData<T> = {},
    model?: typeof GVModel,
    arrayFormGroupModel?: typeof GVModel
  ) {
    schema.forEach(control => {
      const available = control.validation && control.validation.find(c => c.available);
      const rules = available && available.rules;
      const abstractControl = form.get(control.name);
      const controlMsgs = this.getControlMsgs(control.name, model!);

      if (FormControlType.isControl(control.type)) {
        available ? this.applyRules(abstractControl!, rules!, controlMsgs) : abstractControl?.reset();
        return;
      }

      if (FormControlType.isArray(control.type)) {
        this.initFormArray(
          abstractControl as FormArray,
          control.arrayFormGroup,
          (data || {})[control.name],
          control.arrayLength,
          arrayFormGroupModel
        );
        return;
      }
    });
  }

  private initFormArray<T>(
    array: FormArray,
    formGroupSchema: GVItemConfig[] | undefined,
    data?: T[],
    arrayLength?: number,
    formGroupModel?: typeof GVModel
  ) {
    if (!data && !arrayLength) {
      return;
    }

    (data || Array.from(Array(arrayLength))).forEach(d => {
      if (arrayLength && array.length === arrayLength) {
        return;
      }

      const formGroup = this.createFormGroup(formGroupSchema!, d, formGroupModel);
      array.push(formGroup);
    });
  }

  private createFormGroup<T>(
    schema: GVItemConfig[],
    data?: T,
    model?: typeof GVModel
  ) {
    const result: any = {};

    schema.forEach((schemaControl) => {
      const control = this.fb.control(null);
      const available = schemaControl.validation && schemaControl.validation.find(c => c.available);
      const controlMsgs = this.getControlMsgs(schemaControl.name, model!);

      result[schemaControl.name] = (available && available.rules)
        ? this.applyRules(control, available.rules, controlMsgs)
        : control;
    });

    const form = this.fb.group(result);
    form.patchValue(data || {});

    return form;
  }

  private applyRules(formControl: AbstractControl, rules: GVRules, msgs: {[key: string]: string;} = {}) {
    if (!rules) {
      return;
    }

    const validators = Object.entries(rules)
      .map(([key, value]) => {
        if (!this.isRule(value)) {
          return this.applyValidator(key, value);
        }

        if (value.disabled) {
          return null;
        }

        if (value.msg) {
          msgs[key] = value.msg;
        }

        return this.applyValidator(key, value.value);
      })
      .filter(el => el !== null);

    formControl.setValidators(validators);

    return formControl;
  }

  private applyValidator(key: string, value: any) {
    // @ts-ignore
    return GVDefaultValidators[key] ? GVDefaultValidators[key].apply(this, [value]) : null;
  }

  private getControlMsgs(controlName: string, model: typeof GVModel) {
    if (!model) {
      return {};
    }

    const uiForm = model.getUiForm();
    const controls = uiForm && uiForm.reflectFormControls;
    const uiFormControl = controls[controlName];

    return uiFormControl && uiFormControl.msg || {};
  }

  private isRule(rule: GVRule|any): rule is GVRule {
    return typeof rule === 'object' && 'value' in rule;
  }
}
