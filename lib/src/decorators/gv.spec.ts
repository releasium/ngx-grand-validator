import { describe, it, expect } from 'vitest';
import { GV } from './gv';
import { GVModel } from './gv-model';
import { selectError } from '../core/builders/select-error';

class User extends GVModel {
  @GV.required()
  @GV.minLength(5)
  @GV.maxLength(10)
  name!: string;

  @GV.cardNumber('Bad card')
  card!: string;

  // pattern is declared above minLength, so pattern must win the ordering test.
  @GV.pattern(/^\d+$/)
  @GV.minLength(5)
  code!: string;
}

class Admin extends User {
  @GV.required()
  level!: number;
}

describe('GV decorators', () => {
  it('builds a form with a control per decorated field', () => {
    const form = User.createForm();
    expect(Object.keys(form.controls).sort()).toEqual(['card', 'code', 'name']);
  });

  it('applies the declared validators', () => {
    const form = User.createForm();
    form.get('name')!.setValue('ab');
    expect(form.get('name')!.hasError('minlength')).toBe(true);
  });

  it('resolves a custom cardNumber message — v1 keyed this wrong', () => {
    expect(User.messages()['card']).toEqual({ cardNumber: 'Bad card' });
  });

  it('records source order with the top-most decorator first', () => {
    // `code` declares @GV.pattern above @GV.minLength. Decorators apply
    // bottom-up, so this asserts the unshift convention actually reverses them.
    expect(User.order()['code']).toEqual(['pattern', 'minlength']);
  });

  it('selects the top-most decorator error when several fire at once', () => {
    const form = User.createForm();
    form.get('code')!.setValue('ab'); // violates both pattern and minlength
    const errors = form.get('code')!.errors!;

    expect(Object.keys(errors).sort()).toEqual(['minlength', 'pattern']);
    expect(selectError(errors, User.order()['code'])).toBe('pattern');
  });

  it('inherits parent metadata in a subclass — broken in v1', () => {
    const form = Admin.createForm();
    expect(Object.keys(form.controls).sort()).toEqual(['card', 'code', 'level', 'name']);
  });

  it('does not leak subclass fields back onto the parent', () => {
    expect(Object.keys(User.createForm().controls)).not.toContain('level');
  });
});
