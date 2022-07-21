import { InjectionToken } from '@angular/core';

export interface ErrorMessages { [key: string]: string; }

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('GV_ERROR_MESSAGES');

export const GV_DEFAULT_ERROR_MESSAGES = {
	'required': 'gv.validation.error.required',
  'alphanumeric': 'gv.validation.error.alphanumeric',
  'cardNumber': 'gv.validation.error.cardNumber',
  'digit': 'gv.validation.error.digit',
  'email': 'gv.validation.error.email',
  'equals': 'gv.validation.error.equals',
  'exactLength': 'gv.validation.error.exactLength',
  'integer': 'gv.validation.error.integer',
  'max': 'gv.validation.error.max',
  'maxlength': 'gv.validation.error.maxlength',
  'min': 'gv.validation.error.min',
  'minlength': 'gv.validation.error.minlength',
  'pattern': 'gv.validation.error.pattern',
};
