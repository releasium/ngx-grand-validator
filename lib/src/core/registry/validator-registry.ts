import { ValidatorFn } from '@angular/forms';
import { ValidatorDefinition } from './validator-definition';

export class ValidatorRegistry {
  private readonly definitions = new Map<string, ValidatorDefinition>();

  constructor(definitions: readonly ValidatorDefinition[] = []) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: ValidatorDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  get(name: string): ValidatorDefinition | undefined {
    return this.definitions.get(name);
  }

  /** Builds a ValidatorFn, or null when the name is not registered. */
  create(name: string, args: readonly unknown[]): ValidatorFn | null {
    const definition = this.definitions.get(name);
    if (!definition) {
      return null;
    }

    return (definition.factory as (...a: readonly unknown[]) => ValidatorFn)(...args);
  }

  /** Default messages keyed by error key, ready to merge with consumer overrides. */
  messages(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const definition of this.definitions.values()) {
      result[definition.errorKey] = definition.defaultMessage;
    }
    return result;
  }
}
