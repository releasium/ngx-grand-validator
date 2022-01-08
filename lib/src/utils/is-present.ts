import { ValidationErrors } from '@angular/forms';

export function isPresent(obj: ValidationErrors) {
	return obj != null;
}