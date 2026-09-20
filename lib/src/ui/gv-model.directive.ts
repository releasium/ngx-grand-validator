import { Directive, Signal, computed, inject, input } from '@angular/core';
import { GVModelStatic } from '../decorators/gv-model';
import { FormMessage } from '../core/builders/form-message.type';

@Directive({
  selector: '[gvModel]',
})
export class GvModelDirective {
  /** Omit only when nesting under a parent [gvModel] with gvGroupName set. */
  readonly gvModel = input<GVModelStatic | undefined>(undefined);
  /** Key into the parent directive's message tree, for nested groups. */
  readonly gvGroupName = input('');

  private readonly parent = inject(GvModelDirective, {
    optional: true,
    host: true,
    skipSelf: true,
  });

  readonly messages: Signal<FormMessage> = computed<FormMessage>(() => {
    const model = this.gvModel();
    if (model) {
      return model.messages();
    }

    const parentMessages = this.parent?.messages();
    const nested = parentMessages?.[this.gvGroupName()];
    return typeof nested === 'object' && nested !== null ? nested : {};
  });

  /** Error-key order per control, top-most decorator first. */
  readonly order: Signal<Record<string, string[]>> = computed<Record<string, string[]>>(
    () => this.gvModel()?.order() ?? {},
  );

  messagesFor(name: string): FormMessage {
    const entry = this.messages()[name];
    return typeof entry === 'object' && entry !== null ? entry : {};
  }

  orderFor(name: string): string[] {
    return this.order()[name] ?? [];
  }
}
