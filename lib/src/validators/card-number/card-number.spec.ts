import { FormControl } from '@angular/forms';
import { cardNumberValidator } from './card-number.validator'; // Adjust the import path as needed

describe('cardNumberValidator', () => {
  it('should return null when card number is valid', () => {
    const validator = cardNumberValidator();
    const control = new FormControl('4111111111111111'); // A valid card number

    const result = validator(control);

    expect(result).toBeNull();
  });

  it('should return validation error when card number is invalid', () => {
    const validator = cardNumberValidator();
    const control = new FormControl('4111111111111112'); // An invalid card number

    const result = validator(control);

    expect(result).toEqual({ 'cardNumber': null });
  });

  it('should return null when control value is falsy', () => {
    const validator = cardNumberValidator();
    const control = new FormControl('');

    const result = validator(control);

    expect(result).toBeNull();
  });
});
