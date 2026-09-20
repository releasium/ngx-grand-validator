import { ValidationErrors } from '@angular/forms';

/**
 * Chooses which of a control's errors to show.
 *
 * v1 showed `Object.keys(errors)` last element, which made the visible message
 * depend on decorator stacking order — decorators apply bottom-up, so the
 * bottom-most decorator won. v2 shows the first error in source order, with
 * `required` always winning, so the top-most decorator wins instead.
 */
export function selectError(errors: ValidationErrors, order: readonly string[]): string | null {
  const keys = Object.keys(errors);
  if (keys.length === 0) {
    return null;
  }

  if (keys.includes('required')) {
    return 'required';
  }

  for (const key of order) {
    if (keys.includes(key)) {
      return key;
    }
  }

  return keys[0];
}
