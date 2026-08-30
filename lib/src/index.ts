// Decorators and model base
export { GV } from './decorators/gv';
export { GVModel } from './decorators/gv-model';
export type { GVModelStatic } from './decorators/gv-model';

// Bootstrap
export { provideGrandValidator } from './provide-grand-validator';
export type { GrandValidatorConfig } from './provide-grand-validator';

// UI
export { GvModelDirective } from './ui/gv-model.directive';
export { GVErrorMessageComponent } from './ui/error-message/error-message.component';

// Schema
export { GVService } from './schema/gv.service';
export { FormControlType } from './schema/controls.enum';
export type {
  GVItemConfig,
  GVRuleItems,
  GVRules,
  GVRule,
  GVData,
} from './schema/control-validation.interface';

// Extension points
export { ValidatorRegistry } from './core/registry/validator-registry';
export { BUILT_IN_VALIDATORS } from './core/registry/built-in-validators';
export type { ValidatorDefinition } from './core/registry/validator-definition';
export { GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
export type { ErrorMessages } from './core/registry/error-messages.token';
export type { FormMessage } from './core/builders/form-message.type';
