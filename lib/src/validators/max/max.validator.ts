import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const maxValidator = (max: number): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const v: number = control.value;
		return v > max ? {
			'max': {
				'requiredValue': max,
				'actualValue': v
			}
		} : null;
	};
};
