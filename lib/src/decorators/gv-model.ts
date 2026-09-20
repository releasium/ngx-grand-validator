import { UntypedFormGroup } from '@angular/forms';
import { resolveMetadata } from '../core/metadata/metadata-store';
import { ModelCtor } from '../core/metadata/validation-metadata';
import { buildForm } from '../core/builders/build-form';
import { buildMessages, buildOrder } from '../core/builders/build-messages';
import { FormMessage } from '../core/builders/form-message.type';

/** The static shape the [gvModel] directive requires. */
export interface GVModelStatic {
  createForm(): UntypedFormGroup;
  messages(): FormMessage;
  order(): Record<string, string[]>;
}

export abstract class GVModel {
  static createForm(this: ModelCtor): UntypedFormGroup {
    return buildForm(resolveMetadata(this));
  }

  static messages(this: ModelCtor): FormMessage {
    return buildMessages(resolveMetadata(this));
  }

  /** Per-control error-key order, top-most decorator first. */
  static order(this: ModelCtor): Record<string, string[]> {
    return buildOrder(resolveMetadata(this));
  }
}
