import { FormControl } from '@angular/forms';
import { minLengthValidator } from './min-length.validator';

describe('Min Length Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    const min = 5; // Replace 5 with your desired minimum length
    validatorFn = minLengthValidator(min);
    control = new FormControl('');
  });

  it('should return null when the control value has the minimum length', () => {
    control.setValue('12345'); // 5 characters
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

  it('should return an error object when the control value is less than the minimum length', () => {
    control.setValue('123'); // 3 characters, which is less than the minimum of 5
    const result = validatorFn(control);
    expect(result).toEqual({
      'minlength': {
        'requiredValue': 5,
        'actualValue': 3
      }
    });
  });

  it('should return an error object when the control value is a valid number in string format', () => {
    control.setValue('123'); // '123' as a string
    const result = validatorFn(control);
    expect(result).toEqual({
      'minlength': {
        'requiredValue': 5,
        'actualValue': 3
      }
    });
  });

  it('should return null when the control value is a valid number in string format with spaces', () => {
    control.setValue('  12345  '); // 8 characters, but only 5 significant characters, which satisfies the minimum of 5
    const result = validatorFn(control);
    expect(result).toBeNull();
  });
});
