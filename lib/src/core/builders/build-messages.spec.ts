import { describe, it, expect } from 'vitest';
import { ownMetadata, ensureControl } from '../metadata/metadata-store';
import { buildMessages, buildOrder } from './build-messages';

describe('buildMessages', () => {
  it('returns per-control override messages keyed by error key', () => {
    class M {}
    const control = ensureControl(ownMetadata(M), 'email');
    control.messages.set('email', 'Bad email');

    expect(buildMessages(ownMetadata(M))).toEqual({ email: { email: 'Bad email' } });
  });

  it('emits an empty object for a control with no overrides', () => {
    class M {}
    ensureControl(ownMetadata(M), 'name');
    expect(buildMessages(ownMetadata(M))).toEqual({ name: {} });
  });

  it('nests group messages under the group name', () => {
    class Child {}
    class Parent {}
    ensureControl(ownMetadata(Child), 'street').messages.set('required', 'Street required');
    ownMetadata(Parent).groups.set('address', Child);

    expect(buildMessages(ownMetadata(Parent))).toEqual({
      address: { street: { required: 'Street required' } },
    });
  });

  it('nests array item messages under the array name', () => {
    class Item {}
    class Holder {}
    ensureControl(ownMetadata(Item), 'label').messages.set('required', 'Label required');
    ownMetadata(Holder).arrays.set('items', { model: Item, count: 2 });

    expect(buildMessages(ownMetadata(Holder))).toEqual({
      items: { label: { required: 'Label required' } },
    });
  });

  it('nests array item messages even when count is 0 — the normal dynamic-array case', () => {
    class Item {}
    class Holder {}
    ensureControl(ownMetadata(Item), 'label').messages.set('required', 'Label required');
    ownMetadata(Holder).arrays.set('items', { model: Item, count: 0 });

    expect(buildMessages(ownMetadata(Holder))).toEqual({
      items: { label: { required: 'Label required' } },
    });
  });
});

describe('buildOrder', () => {
  it('exposes each control source order, independent of custom messages', () => {
    class M {}
    const control = ensureControl(ownMetadata(M), 'field');
    control.order.push('pattern', 'minlength');

    expect(buildOrder(ownMetadata(M))).toEqual({ field: ['pattern', 'minlength'] });
  });

  it('returns an entry for a control with no custom messages at all', () => {
    class M {}
    ensureControl(ownMetadata(M), 'bare').order.push('required');
    expect(buildOrder(ownMetadata(M))['bare']).toEqual(['required']);
  });

  it('returns an empty record for metadata with no controls', () => {
    class Bare {}
    expect(buildOrder(ownMetadata(Bare))).toEqual({});
  });
});
