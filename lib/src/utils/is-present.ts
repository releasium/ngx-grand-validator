import { ValidationErrors } from '@angular/forms';

export function isPresent(obj: ValidationErrors|null) {
	return obj != null;
}
