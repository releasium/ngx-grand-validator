import { describe, it, expect, beforeEach } from 'vitest';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { GV } from '../decorators/gv';
import { GVModel } from '../decorators/gv-model';
import { GvModelDirective } from './gv-model.directive';
import { GVErrorMessageComponent } from './error-message/error-message.component';
import { provideGrandValidator } from '../provide-grand-validator';

class Person extends GVModel {
  @GV.required('Name is required')
  name!: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, GvModelDirective, GVErrorMessageComponent],
  template: `
    <form [gvModel]="model" [formGroup]="form">
      <input formControlName="name" />
      <gv-error-message name="name" />
    </form>
  `,
})
class Host {
  model = Person;
  form: UntypedFormGroup = Person.createForm();
}

describe('GvModelDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideGrandValidator()],
    });
  });

  it('feeds the model custom message to a child error component', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.form.get('name')!.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Name is required');
  });

  it('renders immediately for a control already touched and invalid at init', async () => {
    // Closes a gap in Task 11's four tests, which all start from an untouched,
    // valid control. This exercises the startWith(null) path: without it the
    // component stays blank until some later, unrelated event arrives.
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.form.get('name')!.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Name is required');
  });

  it('returns an empty message map for an unknown control name', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GvModelDirective);
    expect(directive.messagesFor('nope')).toEqual({});
  });
});
