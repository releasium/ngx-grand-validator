import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { isPresent } from '../../utils/is-present';

export const exactLengthValidator = (exactLength: number|string) => {
	return (control: AbstractControl): ValidationErrors | null => {
		if(isPresent(Validators.required(control))) {
			return null;
		}

		const value: string = control.value + '';
		const valueLength: number = value.length;
		return (valueLength !== exactLength) ? {
			'exactLength': {
				'requiredValue': exactLength,
				'actualValue': valueLength
			}
		} : null;
	};
};
