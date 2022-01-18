import { InjectionToken } from '@angular/core';

export interface ErrorMessages { [key: string]: string; }

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('default_error_messages');

export const GV_DEFAULT_ERROR_MESSAGES = {
	'required': 'mp.common.validation.error.required',
};
