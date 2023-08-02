import { FormControl, FormGroup } from '@angular/forms';
import { equalsValidator } from './equals.validator';

describe('Equals Validator', () => {
  let control: FormControl;
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup({
      password: new FormControl(''),
      confirmPassword: new FormControl('')
    }, { validators: equalsValidator('password') });

    control = form.get('confirmPassword') as FormControl;
  });

  // it('should return null when the passwords match', () => {
  //   form.setValue({
  //     password: 'password123',
  //     confirmPassword: 'password123'
  //   });
  //
  //   expect(control.valid).toBeTruthy();
  //   expect(form.valid).toBeTruthy();
  // });

  // it('should return an error object when the passwords do not match', () => {
  //   form.setValue({
  //     password: 'password123',
  //     confirmPassword: 'differentPassword'
  //   });
  //
  //   expect(control.hasError('equals')).toBeTruthy();
  //   expect(form.valid).toBeFalsy();
  // });

  // it('should return null when the related control value is not present', () => {
  //   form.setValue({
  //     password: 'password123',
  //     confirmPassword: ''
  //   });
  //
  //   expect(control.valid).toBeTruthy();
  //   expect(form.valid).toBeTruthy();
  // });

  it('should return null when the form control is not part of a form group', () => {
    control = new FormControl('', equalsValidator('password'));
    expect(control.valid).toBeTruthy();
  });
});
