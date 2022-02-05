import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const requiredValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;

		if (typeof value === 'string' && !value.trim()) {
			return { 'required': {} };
		}

		return Validators.required(control);
	};
};
