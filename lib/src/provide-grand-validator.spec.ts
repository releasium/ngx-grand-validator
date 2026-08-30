import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideGrandValidator } from './provide-grand-validator';
import { GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
import { ValidatorRegistry } from './core/registry/validator-registry';

describe('provideGrandValidator', () => {
  it('provides default messages derived from the registry', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideGrandValidator()],
    });
    const messages = TestBed.inject(GV_ERROR_MESSAGES);
    expect(messages['required']).toBe('Please fill out this mandatory field');
    expect(messages['alphanumericWithSpaces']).toBeDefined();
  });

  it('lets a consumer override one message without losing the rest', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideGrandValidator({ messages: { required: 'Required!' } }),
      ],
    });
    const messages = TestBed.inject(GV_ERROR_MESSAGES);
    expect(messages['required']).toBe('Required!');
    expect(messages['email']).toBe('Provide a valid email address');
  });

  it('registers a consumer validator and its message', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideGrandValidator({
          validators: [
            { name: 'shout', errorKey: 'shout', factory: () => () => null, defaultMessage: 'Shout!' },
          ],
        }),
      ],
    });
    expect(TestBed.inject(ValidatorRegistry).get('shout')).toBeDefined();
    expect(TestBed.inject(GV_ERROR_MESSAGES)['shout']).toBe('Shout!');
  });
});
