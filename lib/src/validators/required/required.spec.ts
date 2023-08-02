import { FormControl } from '@angular/forms';
import { requiredValidator } from './required.validator';

describe('Required Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    validatorFn = requiredValidator();
    control = new FormControl('');
  });

  it('should return null when the control value is a non-empty string', () => {
    control.setValue('Hello');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is an empty string', () => {
    control.setValue('');
    const result = validatorFn(control);
    expect(result).toEqual({ 'required': {} });
  });

  it('should return null when the control value is a number', () => {
    control.setValue(123);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is an object', () => {
    control.setValue({ name: 'John' });
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is an array', () => {
    control.setValue(['apple', 'banana', 'orange']);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is true', () => {
    control.setValue(true);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is false', () => {
    control.setValue(false);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is null', () => {
    control.setValue(null);
    const result = validatorFn(control);
    expect(result).toEqual({ 'required': true });

  });

  it('should return null when the control value is undefined', () => {
    control.setValue(undefined);
    const result = validatorFn(control);
    expect(result).toEqual({ 'required': true });
  });
});
