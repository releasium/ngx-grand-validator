import { FormControl } from '@angular/forms';
import { patternValidator } from './pattern.validator';

describe('Pattern Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    const pattern = /^[A-Za-z0-9]+$/; // Replace with your desired regular expression pattern
    validatorFn = patternValidator(pattern);
    control = new FormControl('');
  });

  it('should return null when the control value matches the pattern', () => {
    control.setValue('Valid123');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value does not match the pattern', () => {
    control.setValue('Invalid@');
    const result = validatorFn(control);
    expect(result).toEqual({ 'pattern': {} });
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

  it('should return an error object when the control value is a valid number in string format', () => {
    control.setValue('123'); // Valid number string
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is a valid number in string format with spaces', () => {
    control.setValue(' 12345  '); // Valid number string with spaces
    const result = validatorFn(control);
    expect(result).toEqual({ 'pattern': {} });
  });
});
