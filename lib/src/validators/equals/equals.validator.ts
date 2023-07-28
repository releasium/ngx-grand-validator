import { AbstractControl, UntypedFormGroup, ValidationErrors } from '@angular/forms';

export const equalsValidator = (propName: string) => {
	return (control: AbstractControl): ValidationErrors | null => {
		const hasForm = (control.root instanceof UntypedFormGroup);
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
