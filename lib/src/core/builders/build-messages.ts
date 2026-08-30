import { ValidationMetadata } from '../metadata/validation-metadata';
import { resolveMetadata } from '../metadata/metadata-store';
import { FormMessage } from './form-message.type';

/** Turns metadata into the nested message tree the error component reads. */
export function buildMessages(metadata: ValidationMetadata): FormMessage {
  const result: FormMessage = {};

  metadata.controls.forEach((control, name) => {
    const messages: FormMessage = {};
    control.messages.forEach((text, errorKey) => {
      messages[errorKey] = text;
    });
    result[name] = messages;
  });

  metadata.groups.forEach((modelCtor, name) => {
    result[name] = mergeNested(result[name], buildMessages(resolveMetadata(modelCtor)));
  });

  metadata.arrays.forEach((array, name) => {
    result[name] = mergeNested(result[name], buildMessages(resolveMetadata(array.model)));
  });

  return result;
}

/**
 * A name can be BOTH a control and a group/array. `@GV.required('Add a row')
 * @GV.array(Row)` is legitimate and tested: buildForm attaches the required
 * validator to the FormArray, so that message has to survive alongside the item
 * tree rather than being overwritten by it. Nested entries go in first; the
 * control's own messages win a key collision.
 */
function mergeNested(own: string | FormMessage | undefined, nested: FormMessage): FormMessage {
  return typeof own === 'object' && own !== null ? { ...nested, ...own } : nested;
}

/**
 * Per-control error-key order, top-most decorator first. Kept separate from
 * buildMessages because order must be known even for controls the consumer
 * never wrote a custom message for.
 */
export function buildOrder(metadata: ValidationMetadata): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  metadata.controls.forEach((control, name) => {
    result[name] = [...control.order];
  });
  return result;
}
