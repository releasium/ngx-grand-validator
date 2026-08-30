import { InjectionToken } from '@angular/core';

export type ErrorMessages = Record<string, string>;

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('GV_ERROR_MESSAGES');
