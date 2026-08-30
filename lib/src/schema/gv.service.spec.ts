import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { GV } from '../decorators/gv';
import { GVModel } from '../decorators/gv-model';
import { ValidatorRegistry } from '../core/registry/validator-registry';
import { BUILT_IN_VALIDATORS } from '../core/registry/built-in-validators';
import { GVService } from './gv.service';
import { FormControlType } from './controls.enum';
import { GVItemConfig } from './control-validation.interface';

class Signup extends GVModel {
  @GV.control()
  nickname!: string;

  @GV.control()
  rows!: unknown[];
}

describe('GVService', () => {
  let service: GVService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ValidatorRegistry, useValue: new ValidatorRegistry(BUILT_IN_VALIDATORS) },
        GVService,
      ],
    });
    service = TestBed.inject(GVService);
  });

  it('applies an available rule set to a control', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { minLength: 4 } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.hasError('minlength')).toBe(true);
  });

  it('skips a rule set that is not available', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: false, rules: { minLength: 4 } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.valid).toBe(true);
  });

  it('ignores a disabled rule', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { minLength: { value: 4, disabled: true } } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.valid).toBe(true);
  });

  it('drops an unknown rule key without throwing', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { noSuchRule: 1 } }],
      },
    ];

    expect(() => service.createForm(Signup, schema)).not.toThrow();
  });

  it('populates a FormArray to the declared length', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'rows',
        type: FormControlType.ARRAY,
        arrayLength: 2,
        arrayFormGroup: [{ name: 'label', type: FormControlType.CONTROL }],
      },
    ];

    const form = service.createForm(Signup, schema);
    expect((form.get('rows') as UntypedFormArray).length).toBe(2);
  });

  it('reuses a FormArray the model already declared, keeping its validators', () => {
    class Row extends GVModel {
      @GV.control()
      label!: string;
    }

    class Declared extends GVModel {
      @GV.minLength(2)
      @GV.array(Row, 0)
      items!: unknown[];
    }

    const schema: GVItemConfig[] = [
      {
        name: 'items',
        type: FormControlType.ARRAY,
        arrayLength: 2,
        arrayFormGroup: [{ name: 'label', type: FormControlType.CONTROL }],
      },
    ];

    const form = Declared.createForm();
    const before = form.get('items') as UntypedFormArray;
    expect(before).toBeInstanceOf(UntypedFormArray);
    expect(before.validator).not.toBeNull();

    service.applySchema(schema, form);

    const after = form.get('items') as UntypedFormArray;
    expect(after).toBe(before);
    expect(after.length).toBe(2);
    expect(after.validator).not.toBeNull();
  });

  it('reports control availability', () => {
    const schema: GVItemConfig[] = [
      { name: 'nickname', type: FormControlType.CONTROL, validation: [{ available: true, rules: {} }] },
    ];
    expect(service.isControlAvailable('nickname', schema)).toBe(true);
    expect(service.isControlAvailable('missing', schema)).toBe(false);
  });
});
