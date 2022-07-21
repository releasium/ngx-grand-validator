import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

export const equalsValidator = (propName: string) => {
	return (control: AbstractControl): ValidationErrors | null => {
		const hasForm = (control.root instanceof FormGroup);
		if(!hasForm) {
			return null;
		}

		const relControl = control.root.get(propName);
		if(!relControl?.value) {
			return null;
		}

		if(control.value === relControl.value) {
			if(!relControl.valid) {
				relControl.updateValueAndValidity();
			}
			return null;
		}

		return {
			'equals': true
		};
	};
};
