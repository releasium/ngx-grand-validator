import { ValidatorFn } from '@angular/forms';
import { requiredValidator } from './required/required.validator';

export class GvDefaultValidators {
  static required(): ValidatorFn {
    return requiredValidator();
  }
}
