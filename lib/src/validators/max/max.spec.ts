import { FormControl } from '@angular/forms';
import { maxValidator } from './max.validator';

describe('Max Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    const max = 100; // Replace 100 with your desired maximum value
    validatorFn = maxValidator(max);
    control = new FormControl('');
  });

  it('should return null when the control value is less than the maximum', () => {
    control.setValue(50);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return null when the control value is equal to the maximum', () => {
    control.setValue(100);
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value is greater than the maximum', () => {
    control.setValue(150);
    const result = validatorFn(control);
    expect(result).toEqual({
      'max': {
        'requiredValue': 100,
        'actualValue': 150
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
    control.setValue('120');
    const result = validatorFn(control);
    expect(result).toEqual({
      'max': {
        'requiredValue': 100,
        'actualValue': '120'
      }
    });
  });
});
