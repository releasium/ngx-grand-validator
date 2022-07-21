import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const integerValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const error = { 'integer': {} };
		const valid =  /^[0-9]*$/.test(control.value);
		return valid ? null : error;
	};
};
