import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const alphanumericValidator = (params: {whiteSpace: boolean} = {whiteSpace: false}): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if (isPresent(Validators.required(control))) {
			return null;
		}

		const error: {[key: string]: any} = {};
		const key = params.whiteSpace ? 'alphanumericWithSpaces' : 'alphanumeric';
		const alphanumericWithSpaces = /^[a-zA-Z0-9 ]+$/;
		const alphanumeric = /^[a-zA-Z0-9]+$/;
		const valid = params.whiteSpace ? alphanumericWithSpaces.test(control.value) : alphanumeric.test(control.value);
		error[key] = {};

		return valid ? null : error;
	};
};
