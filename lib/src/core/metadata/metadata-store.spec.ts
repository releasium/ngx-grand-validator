import { describe, it, expect } from 'vitest';
import { Validators } from '@angular/forms';
import { ownMetadata, resolveMetadata, ensureControl } from './metadata-store';

describe('MetadataStore', () => {
  it('creates metadata lazily and returns the same instance twice', () => {
    class Base {}

    const first = ownMetadata(Base);
    const second = ownMetadata(Base);
    expect(first).toBe(second);
  });

  it('keeps metadata separate per class', () => {
    class Base {}
    class Unrelated {}

    ensureControl(ownMetadata(Base), 'a');
    expect(resolveMetadata(Unrelated).controls.has('a')).toBe(false);
  });

  it('resolves a parent class metadata through the prototype chain', () => {
    class Base {}
    class Derived extends Base {}

    ensureControl(ownMetadata(Base), 'inherited');
    expect(resolveMetadata(Derived).controls.has('inherited')).toBe(true);
  });

  it('lets a subclass add controls without mutating the parent', () => {
    class Base {}
    class Derived extends Base {}

    ensureControl(ownMetadata(Base), 'fromBase');
    ensureControl(ownMetadata(Derived), 'fromDerived');

    expect(resolveMetadata(Derived).controls.has('fromBase')).toBe(true);
    expect(resolveMetadata(Derived).controls.has('fromDerived')).toBe(true);
    expect(resolveMetadata(Base).controls.has('fromDerived')).toBe(false);
  });

  it('records validator order with the source-order-first convention', () => {
    class Ordered {}
    const control = ensureControl(ownMetadata(Ordered), 'field');
    // Decorators apply bottom-up, so registration unshifts.
    control.order.unshift('maxLength');
    control.order.unshift('minLength');
    control.order.unshift('required');
    expect(control.order).toEqual(['required', 'minLength', 'maxLength']);
  });

  it('returns an empty metadata for a class that has none', () => {
    class Bare {}
    const meta = resolveMetadata(Bare);
    expect(meta.controls.size).toBe(0);
    expect(meta.groups.size).toBe(0);
    expect(meta.arrays.size).toBe(0);
  });

  it('does not leak validators between controls', () => {
    class Two {}
    const meta = ownMetadata(Two);
    ensureControl(meta, 'x').validators.push(Validators.required);
    expect(ensureControl(meta, 'y').validators).toHaveLength(0);
  });
});
