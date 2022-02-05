import { ValidatorFn } from '@angular/forms';
import { requiredValidator } from './required/required.validator';

export class GVDefaultValidators {
  static required(): ValidatorFn {
    return requiredValidator();
  }
}
