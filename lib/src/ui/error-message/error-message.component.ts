import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlContainer } from '@angular/forms';
import { Observable, of, startWith, switchMap } from 'rxjs';

import { GV_ERROR_MESSAGES } from '../../core/registry/error-messages.token';
import { selectError } from '../../core/builders/select-error';
import { FormMessage } from '../../core/builders/form-message.type';
import { GvModelDirective } from '../gv-model.directive';

interface ControlState {
  readonly errors: Record<string, unknown> | null;
  readonly touched: boolean;
}

@Component({
  selector: 'gv-error-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasControl()) {
      @if (message(); as text) {
        <span class="text-danger">{{ text }}</span>
      }
    } @else {
      <span class="text-danger"><ng-content /></span>
    }
  `,
})
export class GVErrorMessageComponent {
  readonly name = input('');
  readonly control = input<AbstractControl | undefined>(undefined);

  private readonly parent = inject(ControlContainer, {
    optional: true,
    host: true,
    skipSelf: true,
  });
  private readonly group = inject(GvModelDirective, { optional: true, host: true, skipSelf: true });
  private readonly defaults = inject(GV_ERROR_MESSAGES);

  private readonly resolved = computed<AbstractControl | null>(() => {
    const explicit = this.control();
    if (explicit) {
      return explicit;
    }

    const parentControl = this.parent?.control ?? null;
    if (!parentControl) {
      return null;
    }

    const name = this.name();
    return name ? parentControl.get(name) : parentControl;
  });

  /**
   * Driven by AbstractControl.events rather than statusChanges, because the
   * template gates on `touched` and statusChanges never fires on a touch.
   * Under OnPush that difference is the whole ballgame.
   */
  private readonly state = toSignal<ControlState | null>(
    toObservable(this.resolved).pipe(
      switchMap((control): Observable<ControlState | null> => {
        if (!control) {
          return of(null);
        }
        return control.events.pipe(
          startWith(null),
          switchMap(() => of({ errors: control.errors, touched: control.touched })),
        );
      }),
    ),
    { initialValue: null },
  );

  readonly hasControl = computed(() => this.resolved() !== null);

  readonly message = computed<string>(() => {
    const state = this.state();
    if (!state?.touched || !state.errors) {
      return '';
    }

    const overrides = (this.group?.messagesFor(this.name()) ?? {}) as FormMessage;
    const order = this.group?.orderFor(this.name()) ?? [];
    const key = selectError(state.errors, order);
    if (!key) {
      return '';
    }

    const template = (overrides[key] as string | undefined) ?? this.defaults[key] ?? '';
    return interpolate(template, state.errors[key]);
  });
}

function interpolate(template: string, payload: unknown): string {
  if (!template || typeof payload !== 'object' || payload === null) {
    return template;
  }

  return Object.entries(payload as Record<string, unknown>).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}
