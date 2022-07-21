import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const emailValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const error = { 'email': {} };
		const valid = /^[A-Za-z0-9][A-Za-z0-9.%+\-\_]*@[A-Za-z0-9.\-\_]+\.[A-Za-z]{2,16}$/.test(control.value);
		return valid ? null : error;
	};
};
