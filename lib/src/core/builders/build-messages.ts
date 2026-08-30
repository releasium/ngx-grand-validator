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
    result[name] = buildMessages(resolveMetadata(modelCtor));
  });

  metadata.arrays.forEach((modelCtors, name) => {
    const first = modelCtors[0];
    result[name] = first ? buildMessages(resolveMetadata(first)) : {};
  });

  return result;
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
