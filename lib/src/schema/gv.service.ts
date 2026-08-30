import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
} from '@angular/forms';

import { FormControlType } from './controls.enum';
import { GVData, GVItemConfig, GVRule, GVRules } from './control-validation.interface';
import { GVModelStatic } from '../decorators/gv-model';
import { ValidatorRegistry } from '../core/registry/validator-registry';

@Injectable()
export class GVService {
  private readonly registry = inject(ValidatorRegistry);

  createForm(model: GVModelStatic, schema: GVItemConfig[]): UntypedFormGroup {
    const form = model.createForm();
    this.applySchema(schema, form);
    return form;
  }

  isControlAvailable(name: string, schema: GVItemConfig[]): boolean {
    return !!schema.find((c) => c.name === name)?.validation?.some((v) => v.available);
  }

  applySchema<T>(schema: GVItemConfig[], form: UntypedFormGroup, data: GVData<T> = {}): void {
    for (const item of schema) {
      const available = item.validation?.find((v) => v.available);
      const control = form.get(item.name);

      if (!control) {
        continue;
      }

      if (FormControlType.isControl(item.type)) {
        if (available?.rules) {
          this.applyRules(control, available.rules);
        } else {
          control.clearValidators();
          control.reset();
        }
        continue;
      }

      if (FormControlType.isArray(item.type)) {
        this.initFormArray(this.asFormArray(form, item.name, control), item, data[item.name]);
      }
    }
  }

  /**
   * A schema ARRAY entry may target a property the model declared with
   * `@GV.array()` — already a FormArray, possibly carrying validators that
   * `buildForm` attached — or one declared with `@GV.control()`, which is a
   * plain FormControl. Reuse the former; replace the latter. Replacing
   * unconditionally would silently discard the array's validators.
   */
  private asFormArray(form: UntypedFormGroup, name: string, control: AbstractControl): UntypedFormArray {
    if (control instanceof UntypedFormArray) {
      return control;
    }

    const array = new UntypedFormArray([], control.validator ? [control.validator] : []);
    form.setControl(name, array);
    return array;
  }

  private initFormArray<T>(array: UntypedFormArray, item: GVItemConfig, data?: T[]): void {
    const length = data?.length ?? item.arrayLength ?? 0;
    if (!length || !item.arrayFormGroup) {
      return;
    }

    array.clear();

    for (let index = 0; index < length; index++) {
      const group = this.createFormGroup(item.arrayFormGroup);
      if (data?.[index]) {
        group.patchValue(data[index] as object);
      }
      array.push(group);
    }
  }

  private createFormGroup(schema: GVItemConfig[]): UntypedFormGroup {
    const controls: Record<string, AbstractControl> = {};

    for (const item of schema) {
      const control = new UntypedFormControl(null);
      const available = item.validation?.find((v) => v.available);
      if (available?.rules) {
        this.applyRules(control, available.rules);
      }
      controls[item.name] = control;
    }

    return new UntypedFormGroup(controls);
  }

  private applyRules(control: AbstractControl, rules: GVRules): void {
    const validators = Object.entries(rules)
      .map(([key, value]) => this.toValidator(key, value))
      .filter((fn): fn is ValidatorFn => fn !== null);

    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private toValidator(key: string, value: GVRule | unknown): ValidatorFn | null {
    if (!this.isRule(value)) {
      return this.registry.create(key, value === undefined ? [] : [value]);
    }

    if (value.disabled) {
      return null;
    }

    return this.registry.create(key, value.value === undefined ? [] : [value.value]);
  }

  private isRule(rule: unknown): rule is GVRule {
    return typeof rule === 'object' && rule !== null && 'value' in rule;
  }
}
