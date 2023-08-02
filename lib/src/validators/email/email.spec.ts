import { FormControl } from '@angular/forms';
import { emailValidator } from './email.validator';

describe('Email Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    validatorFn = emailValidator();
    control = new FormControl('');
  });

  it('should return null when the control value is a valid email', () => {
    control.setValue('test@example.com');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is not a valid email', () => {
    control.setValue('invalid-email');
    const result = validatorFn(control);
    expect(result).toEqual({ 'email': {} });
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

  it('should return null when the control value is a valid email with a subdomain', () => {
    control.setValue('test@sub.example.com');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is a valid email with a top-level domain of up to 16 characters', () => {
    control.setValue('test@example.abcdefghijk');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is a valid email with special characters in the local part', () => {
    control.setValue('test+user%name@example.com');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should not validate simple string', () => {
    control.setValue('tesasasdom');
    const result = validatorFn(control);
    console.log({ result });
    expect(result).toEqual({email: {}});
  });

  it('should not validate not valid email', () => {
    control.setValue('tesasa@sdom');
    const result = validatorFn(control);
    console.log({ result });
    expect(result).toEqual({email: {}});
  });
});
