import { InjectionToken } from '@angular/core';

export interface ErrorMessages { [key: string]: string; }

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('GV_ERROR_MESSAGES');

export const GV_DEFAULT_ERROR_MESSAGES = {
	'required': 'Please fill out this mandatory field',
  'alphanumeric': 'Use only letters and numbers in this field',
  'cardNumber': ' Enter a valid card number',
  'digit': 'Only digits (0-9) allowed here',
  'email': 'Provide a valid email address',
  'equals': 'Provide a valid email address',
  'exactLength': 'Length must match the specified requirement',
  'integer': 'Enter a whole number (integer)',
  'max': 'Value should not exceed the maximum allowed',
  'maxlength': 'Input length is too long',
  'min': 'Value should not be less than the minimum allowed',
  'minlength': ' Input length is too short',
  'pattern': ' Input does not match the required pattern',
};
