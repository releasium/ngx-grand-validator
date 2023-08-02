import { FormControl } from '@angular/forms';
import { maxLengthValidator } from './max-length.validator';

describe('Max Length Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    const max = 10; // Replace 10 with your desired maximum length
    validatorFn = maxLengthValidator(max);
    control = new FormControl('');
  });

  it('should return null when the control value has the maximum length', () => {
    control.setValue('1234567890'); // 10 characters
    const result = validatorFn(control);
    expect(result).toBeNull();
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

  it('should return an error object when the control value exceeds the maximum length', () => {
    control.setValue('12345678901'); // 11 characters, which exceeds the maximum of 10
    const result = validatorFn(control);
    expect(result).toEqual({
      'maxlength': {
        'requiredValue': 10,
        'actualValue': 11
      }
    });
  });

  it('should return an error object when the control value is a valid number in string format with spaces', () => {
    control.setValue(' 123456 '); // 8 characters, which exceeds the maximum of 10
    const result = validatorFn(control);
    expect(result).toBeNull();
  });
});
