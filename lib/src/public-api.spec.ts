import { describe, it, expect } from 'vitest';
import * as api from './index';

const EXPECTED = [
  'GV',
  'GVModel',
  'GVService',
  'GVErrorMessageComponent',
  'GvModelDirective',
  'ValidatorRegistry',
  'BUILT_IN_VALIDATORS',
  'GV_ERROR_MESSAGES',
  'provideGrandValidator',
  'FormControlType',
].sort();

describe('public API', () => {
  it('exports exactly the intended surface', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED);
  });

  it('no longer exports the removed v1 symbols', () => {
    for (const removed of ['GVModule', 'GVDefaultValidators', 'GVCore', 'GV_DEFAULT_ERROR_MESSAGES']) {
      expect(removed in api).toBe(false);
    }
  });
});
