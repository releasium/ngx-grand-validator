import { InjectionToken } from '@angular/core';

export interface ErrorMessages { [key: string]: string; }

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('GV_ERROR_MESSAGES');

export const GV_DEFAULT_ERROR_MESSAGES = {
	'required': 'gv.validation.error.required',
};
