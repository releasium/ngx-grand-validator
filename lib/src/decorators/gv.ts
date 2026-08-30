import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  ALPHANUMERIC,
  ALPHANUMERIC_WITH_SPACES,
  CARD_NUMBER,
  DIGIT,
  EMAIL,
  EQUALS,
  EXACT_LENGTH,
  INTEGER,
  MAX,
  MAX_LENGTH,
  MIN,
  MIN_LENGTH,
  PATTERN,
  REQUIRED,
} from '../core/registry/built-in-validators';
import { ValidatorDefinition } from '../core/registry/validator-definition';
import { ModelCtor } from '../core/metadata/validation-metadata';
import { ensureControl, ownMetadata } from '../core/metadata/metadata-store';

/** The prototype a property decorator receives. */
type DecoratorTarget = { constructor: ModelCtor };

function metadataFor(target: DecoratorTarget) {
  return ownMetadata(target.constructor);
}

/**
 * Registers a validator against a field.
 *
 * Decorators apply bottom-up, so `order` is unshifted: after the whole class
 * is evaluated, order[0] is the top-most decorator in the source.
 */
function register(
  definition: ValidatorDefinition,
  args: readonly unknown[],
  message: string | undefined,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const control = ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
    const factory = definition.factory as (...a: readonly unknown[]) => ValidatorFn;

    control.validators.unshift(factory(...args));
    control.order.unshift(definition.errorKey);

    if (message !== undefined) {
      control.messages.set(definition.errorKey, message);
    }
  };
}

export class GV {
  /** A field with no validators, present in the form. */
  static control(): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
    };
  }

  static group(model: ModelCtor): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      metadataFor(target as DecoratorTarget).groups.set(String(propertyKey), model);
    };
  }

  static array(model: ModelCtor, count = 0): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      const models = Array.from({ length: count }, () => model);
      metadataFor(target as DecoratorTarget).arrays.set(String(propertyKey), models);
    };
  }

  static asyncControl(validator: AsyncValidatorFn, errorKey: string, msg?: string): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      const control = ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
      control.asyncValidators.unshift(validator);
      control.order.unshift(errorKey);
      if (msg !== undefined) {
        control.messages.set(errorKey, msg);
      }
    };
  }

  static required(msg?: string): PropertyDecorator {
    return register(REQUIRED, [], msg);
  }

  static minLength(value: number, msg?: string): PropertyDecorator {
    return register(MIN_LENGTH, [value], msg);
  }

  static maxLength(value: number, msg?: string): PropertyDecorator {
    return register(MAX_LENGTH, [value], msg);
  }

  static exactLength(value: number | string, msg?: string): PropertyDecorator {
    return register(EXACT_LENGTH, [value], msg);
  }

  static min(value: number | string, msg?: string): PropertyDecorator {
    return register(MIN, [Number(value)], msg);
  }

  static max(value: number | string, msg?: string): PropertyDecorator {
    return register(MAX, [Number(value)], msg);
  }

  static digit(msg?: string): PropertyDecorator {
    return register(DIGIT, [], msg);
  }

  static email(msg?: string): PropertyDecorator {
    return register(EMAIL, [], msg);
  }

  static integer(msg?: string): PropertyDecorator {
    return register(INTEGER, [], msg);
  }

  static pattern(value: RegExp, msg?: string): PropertyDecorator {
    return register(PATTERN, [value], msg);
  }

  static equals(propName: string, msg?: string): PropertyDecorator {
    return register(EQUALS, [propName], msg);
  }

  static cardNumber(msg?: string): PropertyDecorator {
    return register(CARD_NUMBER, [], msg);
  }

  static alphanumeric(msg?: string): PropertyDecorator {
    return register(ALPHANUMERIC, [], msg);
  }

  static alphanumericWithSpaces(msg?: string): PropertyDecorator {
    return register(ALPHANUMERIC_WITH_SPACES, [], msg);
  }
}
