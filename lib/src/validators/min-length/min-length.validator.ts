import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const minLengthValidator = (min: number) => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const v: number = (control.value + '').length;
		return v < min ? {
			'minlength': {
				'requiredValue': min,
				'actualValue': v
			}
		} : null;
	};
};
