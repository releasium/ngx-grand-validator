import { describe, it, expect } from 'vitest';
import { FormControl, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { ValidatorRegistry } from './validator-registry';
import { BUILT_IN_VALIDATORS } from './built-in-validators';

describe('ValidatorRegistry', () => {
  it('exposes every built-in validator by name', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    expect(registry.get('required')).toBeDefined();
    expect(registry.get('cardNumber')).toBeDefined();
    expect(registry.get('alphanumericWithSpaces')).toBeDefined();
  });

  it('creates a working ValidatorFn from a name and args', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    const fn = registry.create('minLength', [5]) as ValidatorFn;
    expect(fn(new FormControl('abc'))).toEqual({
      minlength: { requiredValue: 5, actualValue: 3 },
    });
  });

  it('returns null for an unknown name instead of throwing', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    expect(registry.create('noSuchValidator', [])).toBeNull();
  });

  it('accepts a consumer-supplied validator', () => {
    const shout: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
      c.value === String(c.value).toUpperCase() ? null : { shout: {} };
    const registry = new ValidatorRegistry([
      ...BUILT_IN_VALIDATORS,
      {
        name: 'shout',
        errorKey: 'shout',
        factory: () => shout,
        defaultMessage: 'Must be uppercase',
      },
    ]);
    expect(registry.create('shout', [])!(new FormControl('hi'))).toEqual({ shout: {} });
    expect(registry.messages()['shout']).toBe('Must be uppercase');
  });

  it('every definition name matches the error key its validator emits', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    const probes: Record<string, [unknown[], unknown]> = {
      required: [[], ''],
      minLength: [[5], 'ab'],
      maxLength: [[2], 'abcdef'],
      exactLength: [[4], 'ab'],
      min: [[10], 1],
      max: [[10], 99],
      digit: [[], 'abc'],
      email: [[], 'nope'],
      integer: [[], '1.5'],
      pattern: [[/^z+$/], 'aaa'],
      cardNumber: [[], '1234567812345678'],
      alphanumeric: [[{ whiteSpace: false }], '!!!'],
      alphanumericWithSpaces: [[{ whiteSpace: true }], '!!!'],
    };

    for (const [name, [args, value]] of Object.entries(probes)) {
      const errors = registry.create(name, args)!(new FormControl(value));
      const expectedKey = registry.get(name)!.errorKey;
      expect(Object.keys(errors ?? {})).toContain(expectedKey);
    }
  });
});
