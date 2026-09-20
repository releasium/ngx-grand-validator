# Migrating from v1 (and earlier) to v2

`@releasium/ngx-grand-validator` v2 is a clean-break major release, rebuilt for Angular 21. There is no
compatibility layer: the `NgModule`, the `[GV]` directive, and every v1-only symbol are gone. This guide covers
every rename you need to make, and — more importantly — four behaviour changes that can alter what your app
does even after the renames compile cleanly.

## Renames

### `GVModule.forRoot()` → `provideGrandValidator()`

The module is gone; the directive and error component are now standalone, and registration is an environment
provider.

```ts
// Before
@NgModule({
  imports: [GVModule.forRoot()],
})
export class AppModule {}
```

```ts
// After
import { bootstrapApplication } from '@angular/platform-browser';
import { provideGrandValidator } from '@releasium/ngx-grand-validator';

bootstrapApplication(AppComponent, {
  providers: [provideGrandValidator()],
});
```

### `[GV]="Model"` → `[gvModel]="Model"`; `formGroupName` → `gvGroupName`

```html
<!-- Before -->
<form [GV]="UserModel" [formGroup]="form">
  <div formGroupName="address" GV>
    <input formControlName="street" />
  </div>
</form>
```

```html
<!-- After -->
<form [gvModel]="UserModel" [formGroup]="form">
  <div formGroupName="address" [gvModel]="undefined" [gvGroupName]="'address'">
    <input formControlName="street" />
  </div>
</form>
```

Angular's own `formGroupName` directive (from `ReactiveFormsModule`) is unchanged and still selects the nested
`FormGroup`; `gvGroupName` is this library's own input, renamed from v1's overloaded `formGroupName` so the two
no longer share a name on the same element.

### `Model.genUIMsg()` → `Model.messages()`

```ts
// Before
const messages = UserModel.genUIMsg();
```

```ts
// After
const messages = UserModel.messages();
```

### `Model.showUIErrors()` → removed, no replacement

Call Angular's own `form.markAllAsTouched()` instead.

```ts
// Before
UserModel.showUIErrors();
```

```ts
// After
form.markAllAsTouched();
```

This is also a small behaviour improvement: v1's `showUIErrors()` walked the reflected model tree and touched
matching controls, but did not recurse into every nested `FormGroup` the way Angular's own method does.
`markAllAsTouched()` marks nested groups and arrays recursively.

`GVModel` now has exactly three statics: `createForm()`, `messages()`, and `order()`. There is no
`markAllTouched` replacement bundled with the library — Angular's method already does the job.

### `GV.alphanumeric({ whiteSpace: true })` → `GV.alphanumericWithSpaces()`

`alphanumeric` no longer takes an options object. The whitespace-tolerant variant is its own decorator.

```ts
// Before
@GV.alphanumeric({ whiteSpace: true })
username!: string;
```

```ts
// After
@GV.alphanumericWithSpaces()
username!: string;
```

`@GV.alphanumeric()` (no arguments) still rejects whitespace, same as `{ whiteSpace: false }` did in v1.

### `GV.min(value, msg, ignoreValues)` → `GV.min(value, msg)`

The third parameter never did anything in v1 — it was accepted but never read. `GV.max` never had it in the
first place.

```ts
// Before
@GV.min(18, 'Too young', [0])
age!: number;
```

```ts
// After
@GV.min(18, 'Too young')
age!: number;
```

### `GVDefaultValidators` → `ValidatorRegistry` / `BUILT_IN_VALIDATORS`

`GVDefaultValidators` was a static pass-through class exposing raw `ValidatorFn`s. If you called it directly
(rather than through a `@GV.*` decorator), use the registered `ValidatorDefinition`s instead.

```ts
// Before
import { GVDefaultValidators } from '@releasium/ngx-grand-validator';
const fn = GVDefaultValidators.required();
```

```ts
// After
import { BUILT_IN_VALIDATORS } from '@releasium/ngx-grand-validator';
const fn = BUILT_IN_VALIDATORS.find((v) => v.name === 'required')!.factory();
```

Most consumers should not need this at all — use the `@GV.*` decorators, or `GVService` for schema-driven
forms.

### `GV_DEFAULT_ERROR_MESSAGES` → removed; override via `provideGrandValidator({ messages })`

```ts
// Before
providers: [
  { provide: GV_ERROR_MESSAGES, useValue: { ...GV_DEFAULT_ERROR_MESSAGES, required: 'Required!' } },
],
```

```ts
// After
providers: [provideGrandValidator({ messages: { required: 'Required!' } })],
```

Defaults now live on each validator's `ValidatorDefinition.defaultMessage` and are assembled by
`ValidatorRegistry.messages()`; `provideGrandValidator` merges your `messages` override on top.

### `GVCore` and `Model.getUiForm()` → removed, no replacement

Both were internal implementation details of v1's reflection-based form builder. Nothing in the public API
replaces them directly; `GVModel.createForm()` covers the only thing consumers actually used them for.

## Behaviour changes

These four changes can alter what your application does even if every call site above already compiles.

### The displayed error is now the first in source order, not the last key of `control.errors`

v1's error component picked `Object.keys(control.errors)[length - 1]` — the *last* key JavaScript happened to
enumerate on the errors object. Because decorators apply bottom-up, that made the message you saw depend on
which decorator was written closest to the bottom of the field, which is an easy thing to get backwards by
accident.

v2 tracks each field's decorators in source order (top-most first) and shows the first error in that order,
with `@GV.required()` always winning regardless of where it's declared:

```ts
class User extends GVModel {
  @GV.pattern(/^\d+$/, 'Digits only')
  @GV.minLength(5, 'Too short')
  code!: string;
}
```

If `code` is `'ab'`, both `pattern` and `minlength` fail. v1 would show whichever key JavaScript enumerated
last (in practice, often `minlength`, since it was registered after `pattern` in `control.errors`); v2 always
shows `'Digits only'`, because `@GV.pattern` is declared above `@GV.minLength`. **This is a bug fix, not a
regression** — but it means some fields in your app may now show a different message than they did under v1.
Review fields that stack more than one decorator.

### `@GV.cardNumber('custom message')` now actually works

In v1, the custom message was registered under the key `'card'`, but the validator's emitted error — and the
lookup the error component performed — both used the key `'cardNumber'`. The mismatch meant a custom
`cardNumber` message was silently accepted and then silently ignored; v1 always fell back to the built-in
default. v2 registers and looks up the message under the same key the validator emits, so:

```ts
class Payment extends GVModel {
  @GV.cardNumber('Enter a valid card number')
  card!: string;
}
```

now actually shows `'Enter a valid card number'`, where in v1 it silently showed the built-in default instead.
If you were relying on the (broken) v1 default appearing despite passing a custom message, your custom message
will now be the one shown.

### `cardNumber` errors now carry `{}` instead of `null`

v1's `cardNumber` validator returned `{ cardNumber: null }` on failure. v2 returns `{ cardNumber: {} }`.

This matters for two reasons. First, message interpolation reads `Object.keys(payload)` to substitute
`{{token}}` placeholders — that can't work against `null`, so no `cardNumber` message could ever be
interpolated under v1, even though the pattern is used by other validators like `minLength`. Second, if your
code inspects `control.errors['cardNumber']` directly and compares it to `null` — `if (errors.cardNumber ===
null)` — that check will no longer match; check for the key's presence (`'cardNumber' in errors` or
`!!errors?.['cardNumber']`) instead.

### Subclassed models now inherit their parent's validation

```ts
class User extends GVModel {
  @GV.required()
  name!: string;
}

class Admin extends User {
  @GV.required()
  accessLevel!: number;
}
```

In v1, `Admin.createForm()` produced a form with only `accessLevel` — the parent's `@GV.required() name` field
was silently dropped, because v1's metadata lived in a single `validation` property overwritten per class
rather than merged across the prototype chain. If your app has a subclassed model, it was building an
incomplete form and you may not have noticed. In v2, `Admin.createForm()` includes both `name` and
`accessLevel`. Audit any subclassed model in your codebase — the resulting form now has more controls than it
used to, and code that assumed the parent's fields were absent (e.g. a template that didn't render them) needs
updating.

## Removed feature: controls are seeded `null`, never from the model's field initializer

```ts
class User extends GVModel {
  @GV.required()
  role: string = 'member'; // this initializer was never read, in any v1 release
}
```

This never worked in any v1 release. The decorator ran against the class prototype, where instance field
initializers do not exist yet — so every control was seeded `undefined` regardless of what you wrote, in every
published v1 version. Because it never worked, no working v1 code depends on it, and there is nothing to
migrate away from other than a comment or expectation you may have carried over. v2 makes the same fact
explicit by seeding every control with `null`. To populate a form with existing data, use:

```ts
const form = User.createForm();
form.patchValue({ role: 'admin' });
```
