import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const maxLengthValidator = (max: number): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const v: number = (control.value + '').length;
		return v > max ? {
			'maxlength': {
				'requiredValue': max,
				'actualValue': v
			}
		} : null;
	};
};
