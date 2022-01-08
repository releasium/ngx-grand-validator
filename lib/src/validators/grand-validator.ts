import { ValidatorFn } from '@angular/forms';
import { requiredValidator } from './required/required.validator';

export class GrandValidator {
  static required(): ValidatorFn {
    return requiredValidator();
  }
}
