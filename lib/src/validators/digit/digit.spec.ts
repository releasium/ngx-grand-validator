import { FormControl } from '@angular/forms';
import { digitValidator } from './digit.validator';

describe('Digit Validator', () => {
  it('should return null when the control value is a valid digit', () => {
    const validatorFn = digitValidator();
    const control = new FormControl('12345');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is 0', () => {
    const validatorFn = digitValidator();
    const control = new FormControl('0');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is not a digit', () => {
    const validatorFn = digitValidator();
    const control = new FormControl('abc');
    const result = validatorFn(control);
    expect(result).toEqual({ 'digit': {} });
  });

  it('should return null when the control value is null', () => {
    const validatorFn = digitValidator();
    const control = new FormControl(null);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is undefined', () => {
    const validatorFn = digitValidator();
    const control = new FormControl(undefined);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is an empty string', () => {
    const validatorFn = digitValidator();
    const control = new FormControl('');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is a valid number in string format', () => {
    const validatorFn = digitValidator();
    const control = new FormControl('123.45');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });
});
