import { FormControl } from '@angular/forms';
import { integerValidator } from './integer.validator';

describe('Integer Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    validatorFn = integerValidator();
    control = new FormControl('');
  });

  it('should return null when the control value is a valid integer', () => {
    control.setValue('12345');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is 0', () => {
    control.setValue('0');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value contains non-numeric characters', () => {
    control.setValue('abc');
    const result = validatorFn(control);
    expect(result).toEqual({ 'integer': {} });
  });

  it('should return null when the control value is null', () => {
    control.setValue(null);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is undefined', () => {
    control.setValue(undefined);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is an empty string', () => {
    control.setValue('');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is a valid number in string format with spaces', () => {
    control.setValue('  12345  ');
    const result = validatorFn(control);
    expect(result).toEqual({ 'integer': {} });
  });

  it('should return an error object when the control value is a valid number in string format with a decimal point', () => {
    control.setValue('123.45');
    const result = validatorFn(control);
    expect(result).toEqual({ 'integer': {} });
  });
});
