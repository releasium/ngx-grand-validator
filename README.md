# @releasium/ngx-grand-validator

**@releasium/ngx-grand-validator** is a powerful and easy-to-use Angular library that simplifies the process of
implementing reactive form validation in your Angular applications. Define your data models as plain TypeScript
classes, decorate their fields with validation decorators, and let the library generate the `FormGroup` and the
error messages for you.

![ngx-grand-validator](https://user-images.githubusercontent.com/3638763/254584144-159a0bac-3824-429b-8ad7-c26f894fc657.png)

## Compatibility

| @releasium/ngx-grand-validator | Angular |
| ------------------------------- | ------- |
| 2.x                              | 21      |
| 1.16.x                           | 16      |
| 0.15.x                           | 15      |
| 0.14.x                           | 14      |

> **v2 is a clean-break major.** There is no compatibility layer with v1 — see [MIGRATION.md](./MIGRATION.md)
> if you are upgrading from a 0.x or 1.x release.

## Installation

```bash
npm i @releasium/ngx-grand-validator
```

## Requirements

The validation decorators (`@GV.required()`, `@GV.minLength()`, and so on) require
`"experimentalDecorators": true` in your `tsconfig.json`. Angular's own project template sets this by default,
but if your project has removed it, the decorators will silently do nothing at runtime — no error, no form
control, no validation. Double-check it if fields you decorate are missing from the generated form.

## Getting started

### 1. Provide the validator

`provideGrandValidator()` is an environment provider. Add it to your application's providers — there is no
`NgModule` to import.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideGrandValidator } from '@releasium/ngx-grand-validator';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideGrandValidator()],
});
```

### 2. Define a model

```ts
import { GV, GVModel } from '@releasium/ngx-grand-validator';

export class User extends GVModel {
  @GV.required()
  @GV.minLength(2)
  @GV.maxLength(50)
  firstName!: string;

  @GV.required()
  @GV.email()
  email!: string;

  @GV.cardNumber('Enter a valid card number')
  paymentCard!: string;
}

// Subclasses inherit their parent's validation.
export class Admin extends User {
  @GV.required()
  accessLevel!: number;
}
```

`User.createForm()` returns an Angular `UntypedFormGroup` with one control per decorated field, seeded to `null`
— populate it with `form.patchValue(...)` when editing existing data.

### 3. Bind it to a template

```ts
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { GvModelDirective, GVErrorMessageComponent } from '@releasium/ngx-grand-validator';
import { User } from './user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, GvModelDirective, GVErrorMessageComponent],
  template: `
    <form [gvModel]="User" [formGroup]="form">
      <input formControlName="firstName" />
      <gv-error-message name="firstName" />

      <input formControlName="email" />
      <gv-error-message name="email" />

      <button type="submit" (click)="form.markAllAsTouched()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly User = User;
  protected form = User.createForm();
}
```

`[gvModel]` feeds each `<gv-error-message>` its model's custom messages; `<gv-error-message>` shows a message
only once its control is `touched` and invalid. To reveal every error at once (e.g. on a failed submit), call
Angular's own `form.markAllAsTouched()` — it marks nested groups recursively.

## Built-in validators

Every decorator below is registered in `BUILT_IN_VALIDATORS` and can be overridden per-call with a custom
message, or globally via `provideGrandValidator({ messages: { ... } })`.

| Decorator | Default message |
| --- | --- |
| `@GV.required(msg?)` | Please fill out this mandatory field |
| `@GV.minLength(value, msg?)` | Must be at least {{requiredValue}} characters |
| `@GV.maxLength(value, msg?)` | Must be at most {{requiredValue}} characters |
| `@GV.exactLength(value, msg?)` | Length must match the specified requirement |
| `@GV.min(value, msg?)` | Value should not be less than the minimum allowed |
| `@GV.max(value, msg?)` | Value should not exceed the maximum allowed |
| `@GV.digit(msg?)` | Only digits (0-9) allowed here |
| `@GV.email(msg?)` | Provide a valid email address |
| `@GV.integer(msg?)` | Enter a whole number (integer) |
| `@GV.pattern(regExp, msg?)` | Input does not match the required pattern |
| `@GV.equals(propName, msg?)` | Values must match |
| `@GV.cardNumber(msg?)` | Enter a valid card number |
| `@GV.alphanumeric(msg?)` | Use only letters and numbers in this field |
| `@GV.alphanumericWithSpaces(msg?)` | Use only letters, numbers and spaces in this field |

`GV` also has a handful of structural decorators with no message of their own:

- `@GV.control()` — declares a plain control with no validators (useful with schema validation, below).
- `@GV.group(model)` — nests another `GVModel` as a `FormGroup`.
- `@GV.array(model, count?)` — nests a `FormArray` of `count` instances of `model`.
- `@GV.asyncControl(validator, errorKey, msg?)` — registers an `AsyncValidatorFn` under `errorKey`.

When several decorators on the same field fail at once, the displayed message is the first one in source order
(top-most decorator wins), with `@GV.required()` always taking priority regardless of where it's declared.

## Custom validators

Pass extra `ValidatorDefinition`s to `provideGrandValidator()` to make them available to the schema validator
(below) alongside the built-ins. `GV` itself only exposes the decorators listed above — a custom validator is
consumed through `GVService`, not through a new `GV.*` decorator.

```ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ValidatorDefinition, provideGrandValidator } from '@releasium/ngx-grand-validator';

const shout: ValidatorDefinition = {
  name: 'shout',
  errorKey: 'shout',
  factory: (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string | null;
      return value && value === value.toUpperCase() ? null : { shout: true };
    };
  },
  defaultMessage: 'Please SHOUT your answer',
};

provideGrandValidator({ validators: [shout] });
```

## Schema validation

For forms whose validation rules are data-driven (e.g. they come from a backend-supplied schema rather than a
fixed model), use `GVService`. It is provided automatically by `provideGrandValidator()`.

```ts
import { Component, inject } from '@angular/core';
import {
  GV,
  GVModel,
  GVService,
  FormControlType,
  GVItemConfig,
} from '@releasium/ngx-grand-validator';

class Signup extends GVModel {
  @GV.control()
  nickname!: string;
}

@Component({ selector: 'app-signup', template: '' })
export class SignupComponent {
  private readonly gv = inject(GVService);

  private readonly schema: GVItemConfig[] = [
    {
      name: 'nickname',
      type: FormControlType.CONTROL,
      validation: [{ available: true, rules: { minLength: 4 } }],
    },
  ];

  protected form = this.gv.createForm(Signup, this.schema);
}
```

`GVService.createForm()` builds the model's form and then layers the schema's rules on top of it. Rule keys
resolve through the same `ValidatorRegistry` as the decorators, so custom validators registered via
`provideGrandValidator({ validators: [...] })` work here too.

## Contributing

We welcome contributions from the open-source community. If you have found a bug or have a feature request,
please submit an issue or a pull request on our GitHub repository.

## License

This library is distributed under the MIT License. Feel free to use it in your commercial and non-commercial
projects.
