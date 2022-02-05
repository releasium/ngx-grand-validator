import { ValidatorFn } from '@angular/forms';
import { requiredValidator } from './required/required.validator';
import { patternValidator } from './pattern/pattern.validator';
import { digitValidator } from './digit/digit.validator';
import { emailValidator } from './email/email.validator';
import { integerValidator } from './integer/integer.validator';
import { minLengthValidator } from './min-length/min-length.validator';
import { maxLengthValidator } from './max-length/max-length.validator';
import { minValidator } from './min/min.validator';
import { maxValidator } from './max/max.validator';
import { exactLengthValidator } from './exact-length/exact-length.validator';
import { equalsValidator } from './equals/equals.validator';
import { cardNumberValidator } from './card-number/card-number.validator';
import { alphanumericValidator } from './alphanumeric/alphanumeric.validator';

export class GVDefaultValidators {
  static required(): ValidatorFn {
    return requiredValidator();
  }

  static pattern(pattern: RegExp): ValidatorFn {
    return patternValidator(pattern);
  }

  static digit(): ValidatorFn {
    return digitValidator();
  }

  static email(): ValidatorFn {
    return emailValidator();
  }

  static integer(): ValidatorFn {
    return integerValidator();
  }

  static minLength(min: number): ValidatorFn {
    return minLengthValidator(min);
  }

  static maxLength(max: number): ValidatorFn {
    return maxLengthValidator(max);
  }

  static min(min: number): ValidatorFn {
    return minValidator(min);
  }


  static max(max: number): ValidatorFn {
    return maxValidator(max);
  }

  static exactLength(exactLength: number|string): ValidatorFn {
    return exactLengthValidator(exactLength);
  }

  static equals(propName: string): ValidatorFn {
    return equalsValidator(propName);
  }

  static cardNumber(): ValidatorFn {
    return cardNumberValidator();
  }

  static alphanumeric(params: {whiteSpace: boolean} = {whiteSpace: false}): ValidatorFn {
    return alphanumericValidator(params);
  }
}
