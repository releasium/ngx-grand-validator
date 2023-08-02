import { FormControl } from '@angular/forms';
import { minValidator } from './min.validator';

describe('Min Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    const min = 10; // Replace 10 with your desired minimum value
    validatorFn = minValidator(min);
    control = new FormControl('');
  });

  it('should return null when the control value is greater than the minimum', () => {
    control.setValue(15);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is equal to the minimum', () => {
    control.setValue(10);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is less than the minimum', () => {
    control.setValue(5);
    const result = validatorFn(control);
    expect(result).toEqual({
      'min': {
        'requiredValue': 10,
        'actualValue': 5
      }
    });
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
    control.setValue('5'); // '5' as a string
    const result = validatorFn(control);
    expect(result).toEqual({
      'min': {
        'requiredValue': 10,
        'actualValue': '5'
      }
    });
  });
});
