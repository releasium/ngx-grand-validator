import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const minValidator = (min: number): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const v: number = control.value;
		return v < min ? {
			'min': {
				'requiredValue': min,
				'actualValue': v
			}
		} : null;
	};
};
