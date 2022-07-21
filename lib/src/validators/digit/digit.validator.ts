import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const digitValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;
		const err = { 'digit': {} };

		return !Number.isNaN(+value) ? null : err;
	};
};
