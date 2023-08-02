import { FormControl } from '@angular/forms';
import { exactLengthValidator } from './exact-length.validator';

describe('Exact Length Validator', () => {
  let validatorFn: any;
  let control: FormControl;

  beforeEach(() => {
    validatorFn = exactLengthValidator(5); // Replace 5 with your desired exact length
    control = new FormControl('');
  });

  it('should return null when the control value has the exact length', () => {
    control.setValue('12345');
    const result = validatorFn(control);
    expect(result).toBeNull();
  });

  it('should return an error object when the control value does not have the exact length', () => {
    control.setValue('123');
    const result = validatorFn(control);
    expect(result).toEqual({
      'exactLength': {
        'requiredValue': 5,
        'actualValue': 3
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

  // it('should return an error object when the control value is not a string', () => {
  //   control.setValue(12345); // Non-string value
  //   const result = validatorFn(control);
  //   expect(result).toEqual({
  //     'exactLength': {
  //       'requiredValue': 5,
  //       'actualValue': 5 // Although the length is correct, it's not a string, so an error should be returned.
  //     }
  //   });
  // });

  // it('should return an error object when the control value is an array', () => {
  //   control.setValue(['1', '2', '3']); // Array value
  //   const result = validatorFn(control);
  //   expect(result).toEqual({
  //     'exactLength': {
  //       'requiredValue': 5,
  //       'actualValue': 3 // Although the length is correct, it's not a string, so an error should be returned.
  //     }
  //   });
  // });
});
