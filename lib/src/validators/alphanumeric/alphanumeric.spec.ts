import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { alphanumericValidator } from './alphanumeric.validator';

describe('Alphanumeric Validator', () => {
  it('should return null if the input is valid alphanumeric without spaces', () => {
    const control = new FormControl('AbCdEf123');
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toBeNull();
  });

  it('should return null if the input is valid alphanumeric with spaces', () => {
    const control = new FormControl('Hello World 123');
    const validator = alphanumericValidator({ whiteSpace: true });
    const result: ValidationErrors | null = validator(control);

    expect(result).toBeNull();
  });

  it('should return null if the control value is empty and not required', () => {
    const control = new FormControl('');
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toBeNull();
  });

  it('should return null if the control value is empty and required', () => {
    const control = new FormControl('', { validators: Validators.required });
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toBeNull();
  });

  it('should return error object if the input contains non-alphanumeric characters', () => {
    const control = new FormControl('Hello, World!');
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toEqual({ alphanumeric: {} });
  });

  it('should return error object if the input contains spaces when not allowed', () => {
    const control = new FormControl('Hello World');
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toEqual({ alphanumeric: {} });
  });

  it('should return error object if the input contains spaces when not allowed (required)', () => {
    const control = new FormControl('Hello World', { validators: Validators.required });
    const validator = alphanumericValidator();
    const result: ValidationErrors | null = validator(control);

    expect(result).toEqual({ alphanumeric: {} });
  });

  it('should return error object if the input contains invalid characters and required', () => {
    const control = new FormControl('@InvalidInput!', { validators: Validators.required });
    const validator = alphanumericValidator({ whiteSpace: true });
    const result: ValidationErrors | null = validator(control);

    expect(result).toEqual({ alphanumericWithSpaces: {} });
  });
});
