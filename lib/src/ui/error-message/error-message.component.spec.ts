import { describe, it, expect, beforeEach } from 'vitest';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GVErrorMessageComponent } from './error-message.component';
import { provideGrandValidator } from '../../provide-grand-validator';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, GVErrorMessageComponent],
  template: `<gv-error-message [control]="control" />`,
})
class Host {
  control = new FormControl('', [Validators.required]);
}

describe('GVErrorMessageComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideGrandValidator()],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';

  it('shows nothing while the control is untouched', () => {
    expect(text()).toBe('');
  });

  it('renders the default message once the control is touched', async () => {
    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text()).toBe('Please fill out this mandatory field');
  });

  it('clears the message when the control becomes valid', async () => {
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.setValue('ok');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text()).toBe('');
  });

  it('interpolates the error payload into the message', async () => {
    fixture.componentInstance.control.setValidators([Validators.minLength(5)]);
    fixture.componentInstance.control.setValue('ab');
    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text()).toContain('5');
  });
});
