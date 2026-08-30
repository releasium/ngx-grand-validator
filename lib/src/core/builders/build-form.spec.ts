import { describe, it, expect } from 'vitest';
import { UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { ownMetadata, ensureControl } from '../metadata/metadata-store';
import { buildForm } from './build-form';

describe('buildForm', () => {
  it('creates a control per metadata entry, seeded null', () => {
    class M {}
    const meta = ownMetadata(M);
    ensureControl(meta, 'firstName');
    ensureControl(meta, 'lastName');

    const form = buildForm(meta);
    expect(Object.keys(form.controls).sort()).toEqual(['firstName', 'lastName']);
    expect(form.get('firstName')!.value).toBeNull();
  });

  it('attaches the recorded validators', () => {
    class M {}
    const meta = ownMetadata(M);
    ensureControl(meta, 'name').validators.push(Validators.required);

    const form = buildForm(meta);
    form.get('name')!.setValue('');
    expect(form.get('name')!.hasError('required')).toBe(true);
  });

  it('builds a nested FormGroup for a group entry', () => {
    class Child {}
    class Parent {}
    ensureControl(ownMetadata(Child), 'street');
    ownMetadata(Parent).groups.set('address', Child);

    const form = buildForm(ownMetadata(Parent));
    expect(form.get('address')).toBeInstanceOf(UntypedFormGroup);
    expect(form.get('address.street')).not.toBeNull();
  });

  it('builds a FormArray with one group per declared model', () => {
    class Item {}
    class Holder {}
    ensureControl(ownMetadata(Item), 'label');
    ownMetadata(Holder).arrays.set('items', [Item, Item, Item]);

    const array = buildForm(ownMetadata(Holder)).get('items') as UntypedFormArray;
    expect(array).toBeInstanceOf(UntypedFormArray);
    expect(array.length).toBe(3);
    expect(array.at(0).get('label')).not.toBeNull();
  });

  it('creates an empty FormArray when no models are declared', () => {
    class Holder {}
    ownMetadata(Holder).arrays.set('items', []);
    const array = buildForm(ownMetadata(Holder)).get('items') as UntypedFormArray;
    expect(array.length).toBe(0);
  });
});
