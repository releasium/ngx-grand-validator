import { ValidatorFn } from '@angular/forms';

/**
 * One record per validator, owning its identity, its factory and its default
 * message together. Keeping these in a single record is what prevents the
 * decorator key, the emitted error key and the message key from drifting apart.
 */
export interface ValidatorDefinition {
  /** Identifier used by decorators and by schema rule keys. Unique. */
  readonly name: string;
  /** The key this validator puts into `control.errors`. Often equal to `name`. */
  readonly errorKey: string;
  /** Builds the ValidatorFn from the decorator/schema arguments. */
  readonly factory: (...args: never[]) => ValidatorFn;
  /** Message shown when the consumer supplies none. */
  readonly defaultMessage: string;
}
