import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const cardNumberValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;

		if(!value) {
			return null;
		}

		// Luhn algorithm implementation
		const sum = value
			.toString()
			.split('')
			.reverse()
			.map((item: string, index: number) => {
				const num = parseInt(item);

				if(index % 2) {
					return (num * 2)
						.toString()
						.split('')
						.map((num: string) => parseInt(num))
						.reduce((acc: number, item: number) => acc + item);
				}

				return num;
			})
			.map((num: string) => parseInt(num))
			.reduce((acc: number, item: number) => acc + item);

		if(sum % 10) {
			return { 'cardNumber': null };
		}

		return null;
	};
};
