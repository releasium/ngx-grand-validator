import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

/** Any model class usable as a nested group or array item. */
export type ModelCtor = abstract new (...args: never[]) => object;

export interface ControlMetadata {
  readonly validators: ValidatorFn[];
  readonly asyncValidators: AsyncValidatorFn[];
  /** Error key -> message, for keys the consumer overrode. */
  readonly messages: Map<string, string>;
  /**
   * Error keys in source order, top-most decorator first.
   * Drives which message wins when a control has several errors.
   */
  readonly order: string[];
}

export interface ValidationMetadata {
  readonly controls: Map<string, ControlMetadata>;
  readonly groups: Map<string, ModelCtor>;
  readonly arrays: Map<string, ModelCtor[]>;
}

export function emptyMetadata(): ValidationMetadata {
  return { controls: new Map(), groups: new Map(), arrays: new Map() };
}

export function emptyControl(): ControlMetadata {
  return { validators: [], asyncValidators: [], messages: new Map(), order: [] };
}
