import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { ValidationMetadata } from '../metadata/validation-metadata';
import { resolveMetadata } from '../metadata/metadata-store';

/**
 * Turns metadata into a reactive form. Pure: same metadata in, equivalent
 * form out, no reflection on model instances and no DI.
 *
 * Controls are seeded with null. v1 tried to seed them from the model's field
 * initializer, but read the prototype — where instance fields never live — so
 * every control was seeded undefined regardless. The feature is dropped rather
 * than fixed; consumers use patchValue.
 */
export function buildForm(metadata: ValidationMetadata): UntypedFormGroup {
  const controls: Record<string, AbstractControl> = {};

  metadata.controls.forEach((control, name) => {
    controls[name] = new UntypedFormControl(null, control.validators, control.asyncValidators);
  });

  metadata.groups.forEach((modelCtor, name) => {
    controls[name] = buildForm(resolveMetadata(modelCtor));
  });

  metadata.arrays.forEach((array, name) => {
    // An array name may also carry control-level validators; reuse them here.
    const arrayValidators = metadata.controls.get(name)?.validators ?? [];
    const items = Array.from({ length: array.count }, () => buildForm(resolveMetadata(array.model)));
    controls[name] = new UntypedFormArray(items, arrayValidators);
  });

  return new UntypedFormGroup(controls);
}
