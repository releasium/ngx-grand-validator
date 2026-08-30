import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ValidatorRegistry } from './core/registry/validator-registry';
import { ValidatorDefinition } from './core/registry/validator-definition';
import { BUILT_IN_VALIDATORS } from './core/registry/built-in-validators';
import { ErrorMessages, GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
import { GVService } from './schema/gv.service';

export interface GrandValidatorConfig {
  /** Overrides for individual default messages, keyed by error key. */
  readonly messages?: Partial<ErrorMessages>;
  /** Extra validators, usable from both decorators and schema rules. */
  readonly validators?: readonly ValidatorDefinition[];
}

export function provideGrandValidator(config: GrandValidatorConfig = {}): EnvironmentProviders {
  const registry = new ValidatorRegistry([...BUILT_IN_VALIDATORS, ...(config.validators ?? [])]);

  return makeEnvironmentProviders([
    { provide: ValidatorRegistry, useValue: registry },
    { provide: GV_ERROR_MESSAGES, useValue: { ...registry.messages(), ...config.messages } },
    GVService,
  ]);
}
