import { describe, it, expect } from 'vitest';
import { selectError } from './select-error';

describe('selectError', () => {
  it('prefers required over everything else', () => {
    expect(selectError({ minlength: {}, required: {} }, ['minlength', 'required'])).toBe(
      'required',
    );
  });

  it('picks the first key in declared source order', () => {
    expect(selectError({ maxlength: {}, minlength: {} }, ['minlength', 'maxlength'])).toBe(
      'minlength',
    );
  });

  it('ignores ordered keys that are not currently in error', () => {
    expect(selectError({ maxlength: {} }, ['minlength', 'maxlength'])).toBe('maxlength');
  });

  it('falls back to the first error key when order does not cover it', () => {
    expect(selectError({ custom: {} }, ['minlength'])).toBe('custom');
  });

  it('returns null when there are no errors', () => {
    expect(selectError({}, ['minlength'])).toBeNull();
  });
});
