import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const patternValidator = (pattern: RegExp): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const error = { 'pattern': {} };
		const valid =  pattern.test(control.value);

		return valid ? null : error;
	};
};
