import { requiredValidator } from '../../validators/required/required.validator';
import { patternValidator } from '../../validators/pattern/pattern.validator';
import { digitValidator } from '../../validators/digit/digit.validator';
import { emailValidator } from '../../validators/email/email.validator';
import { integerValidator } from '../../validators/integer/integer.validator';
import { minLengthValidator } from '../../validators/min-length/min-length.validator';
import { maxLengthValidator } from '../../validators/max-length/max-length.validator';
import { minValidator } from '../../validators/min/min.validator';
import { maxValidator } from '../../validators/max/max.validator';
import { exactLengthValidator } from '../../validators/exact-length/exact-length.validator';
import { equalsValidator } from '../../validators/equals/equals.validator';
import { cardNumberValidator } from '../../validators/card-number/card-number.validator';
import { alphanumericValidator } from '../../validators/alphanumeric/alphanumeric.validator';
import { ValidatorDefinition } from './validator-definition';

export const REQUIRED: ValidatorDefinition = {
  name: 'required',
  errorKey: 'required',
  factory: requiredValidator,
  defaultMessage: 'Please fill out this mandatory field',
};

export const MIN_LENGTH: ValidatorDefinition = {
  name: 'minLength',
  errorKey: 'minlength',
  factory: minLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Must be at least {{requiredLength}} characters',
};

export const MAX_LENGTH: ValidatorDefinition = {
  name: 'maxLength',
  errorKey: 'maxlength',
  factory: maxLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Must be at most {{requiredLength}} characters',
};

export const EXACT_LENGTH: ValidatorDefinition = {
  name: 'exactLength',
  errorKey: 'exactLength',
  factory: exactLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Length must match the specified requirement',
};

export const MIN: ValidatorDefinition = {
  name: 'min',
  errorKey: 'min',
  factory: minValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Value should not be less than the minimum allowed',
};

export const MAX: ValidatorDefinition = {
  name: 'max',
  errorKey: 'max',
  factory: maxValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Value should not exceed the maximum allowed',
};

export const DIGIT: ValidatorDefinition = {
  name: 'digit',
  errorKey: 'digit',
  factory: digitValidator,
  defaultMessage: 'Only digits (0-9) allowed here',
};

export const EMAIL: ValidatorDefinition = {
  name: 'email',
  errorKey: 'email',
  factory: emailValidator,
  defaultMessage: 'Provide a valid email address',
};

export const INTEGER: ValidatorDefinition = {
  name: 'integer',
  errorKey: 'integer',
  factory: integerValidator,
  defaultMessage: 'Enter a whole number (integer)',
};

export const PATTERN: ValidatorDefinition = {
  name: 'pattern',
  errorKey: 'pattern',
  factory: patternValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Input does not match the required pattern',
};

export const EQUALS: ValidatorDefinition = {
  name: 'equals',
  errorKey: 'equals',
  factory: equalsValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Values must match',
};

export const CARD_NUMBER: ValidatorDefinition = {
  name: 'cardNumber',
  errorKey: 'cardNumber',
  factory: cardNumberValidator,
  defaultMessage: 'Enter a valid card number',
};

export const ALPHANUMERIC: ValidatorDefinition = {
  name: 'alphanumeric',
  errorKey: 'alphanumeric',
  factory: (() => alphanumericValidator({ whiteSpace: false })) as ValidatorDefinition['factory'],
  defaultMessage: 'Use only letters and numbers in this field',
};

export const ALPHANUMERIC_WITH_SPACES: ValidatorDefinition = {
  name: 'alphanumericWithSpaces',
  errorKey: 'alphanumericWithSpaces',
  factory: (() => alphanumericValidator({ whiteSpace: true })) as ValidatorDefinition['factory'],
  defaultMessage: 'Use only letters, numbers and spaces in this field',
};

export const BUILT_IN_VALIDATORS: readonly ValidatorDefinition[] = [
  REQUIRED,
  MIN_LENGTH,
  MAX_LENGTH,
  EXACT_LENGTH,
  MIN,
  MAX,
  DIGIT,
  EMAIL,
  INTEGER,
  PATTERN,
  EQUALS,
  CARD_NUMBER,
  ALPHANUMERIC,
  ALPHANUMERIC_WITH_SPACES,
];
