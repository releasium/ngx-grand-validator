# ngx-grand-validator v2 — Design

**Date:** 2026-08-30
**Status:** Approved
**Scope:** Modernize `@releasium/ngx-grand-validator` from Angular 16 to Angular 21 LTS as a clean-break `2.0.0`, restructure the internals along SOLID lines, and bring packaging and docs up to current npm-library practice.

---

## 1. Goals

1. Run on the newest Angular the current environment supports, with a modern build and test pipeline.
2. Restructure internals so each unit has one responsibility, is testable in isolation, and is open to extension without modification.
3. Remove the runtime cost and zone.js coupling in the Angular-facing components.
4. Correct packaging, linting, and documentation to current library-authoring practice.

### Non-goals

- Continuous integration. Explicitly scoped out (see §9).
- A decorator-free functional public API. Considered and rejected; see §3.3.
- Migrating to TC39 standard decorators. Technically non-viable; see §3.2.
- Typed reactive forms for the generated `FormGroup`. Not applicable; see §5.4.
- Any refactor not serving the above goals.

---

## 2. Environment and version targets

| Item | Value | Rationale |
|---|---|---|
| Angular | **21.2.22** (v21 LTS) | Latest is 22.1.4, but it requires Node `^22.22.3 \|\| ^24.15.0 \|\| >=26` and TypeScript 6.0. The development machine runs Node 20.20.0. Angular 21 requires Node `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` and TypeScript 5.9–6.0, so it builds today with no environment change. |
| TypeScript | 5.9.x | Angular 21 peer range is `>=5.9 <6.1`. |
| Node (engines) | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | Mirrors Angular 21. |
| Package version | **2.0.0** | See §2.1. |
| Test runner | Vitest via `@angular/build:unit-test`, with standalone Vitest as a fallback | Pending the spike in §7. |

### 2.1 Versioning scheme change

v1 tracked the Angular major (`1.16.0` = Angular 16). A clean-break release on Angular 21 makes that scheme ambiguous — semver demands a major bump, but the scheme would imply `1.21.0`.

**Decision:** ship `2.0.0` and retire the Angular-tracking scheme. Compatibility is communicated by the README table instead, which already exists. Semver majors must mean "this breaks", not "Angular shipped again".

---

## 3. Decisions made during design, with rationale

These are recorded because each closed off an alternative that a future reader would otherwise reasonably re-propose.

### 3.1 Angular 21 rather than 22

Angular 22 is the true latest but cannot install on Node 20. Choosing 21 costs almost nothing: standalone components, signals, the new control flow, `AbstractControl.events`, zoneless change detection, and the Vitest builder are all present in 21. Moving to 22 later is a routine version bump once the machine is on Node 22+.

### 3.2 Decorators stay legacy (`experimentalDecorators`)

TC39 standard decorators were evaluated and rejected on a hard technical constraint: **decorator lowering happens at the call site**, in consumer code, compiled with the consumer's `tsconfig.json`. Angular 21's `ng new` template still sets `experimentalDecorators: true`. A consumer with that flag compiles *every* decorator in their code — including ours — with legacy semantics, passing `(target, propertyKey)`.

A library shipping TC39 decorators expecting `(value, context)` would therefore fail at runtime for every default-configured Angular consumer. Dual-convention runtime detection was considered and rejected as unjustified complexity.

This decision is externally imposed and should be revisited only if Angular removes `experimentalDecorators` from its default template.

### 3.3 Decorator-centric core, not a functional core

A functional core with decorators as a thin adapter was proposed and rejected in favour of a smaller, lower-risk diff. The decorator model remains the architectural centre; the cleanup is structural rather than a re-architecture.

Consequence to accept knowingly: the core remains coupled to class and prototype reflection. The mitigations in §4 (data-only metadata, pure builder functions) recover most of the testability benefit without the larger change.

### 3.4 Clean break, no compatibility layer

No deprecated adapters for `GVModule.forRoot()` or `GVDefaultValidators`. This makes `MIGRATION.md` load-bearing rather than optional.

---

## 4. Internal architecture

### 4.1 Problems in v1

- **`GVCore` holds four responsibilities:** metadata registry, form factory, message factory, and UI error triggering.
- **`GV` is fourteen near-duplicate static factories** — the existing `// TODO fix validators duplications`.
- **`GVDefaultValidators` is pass-through duplication.** It exists only so `GVService` can look validators up by string key, and that lookup is closed to extension: consumers cannot register a custom validator for the schema path without editing the class. It also forces a `@ts-ignore`.
- **Metadata storage is fragile.** It dual-writes `Reflect.defineProperty(target.constructor, 'validation')` and `target.uiForm`; `addGroup` writes a third, misspelled key (`grandValidationFrom`). `getUiForm()` reads via `getOwnPropertyDescriptor`, which is own-property only — **model inheritance silently does not work today**.
- **Error keys drift across four files.** `GV.cardNumber()` registers its message under `'card'` while the validator emits `'cardNumber'`, so custom messages there never resolve. `alphanumericWithSpaces` has no default-message entry. `GV_DEFAULT_ERROR_MESSAGES.equals` contains the email text.

### 4.2 Target structure

```
lib/src/
  core/
    metadata/     ValidationMetadata (data only), MetadataStore
    builders/     buildForm(metadata), buildMessages(metadata)   — pure functions
    registry/     ValidatorRegistry + DI token
  decorators/     GV.*, GVModel
  validators/     the 13 validator functions (shape unchanged)
  schema/         schema applier (was GVService)
  ui/             gvModel directive, error-message component
```

### 4.3 The five changes

1. **`ValidationMetadata`** — a plain data object (controls, groups, arrays) replacing `GVCore`'s mutable state. No behaviour.

2. **`MetadataStore`** — a `WeakMap<Function, ValidationMetadata>` keyed on the constructor, replacing the prototype dual-write. Lookup walks the prototype chain and merges, so **subclassed models begin working**. Removes prototype pollution and the `grandValidationFrom` typo.

3. **`buildForm(metadata)` / `buildMessages(metadata)`** — pure functions taking metadata and returning a `FormGroup` / `FormMessage`. Unit-testable with no classes, no decorators, and no DI.

4. **`ValidatorRegistry`** — replaces `GVDefaultValidators` entirely. Maps validator name to a record of `{ factory, defaultMessage }`, and is extensible through a DI token so consumers can register custom validators usable from both the decorator and schema paths. Removes the `@ts-ignore` dynamic lookup and closes the Open/Closed violation.

5. **`createValidatorDecorator(name)`** — a single helper; all fourteen `GV.*` factories collapse to one-liners, resolving the existing TODO.

### 4.4 Why the registry matters beyond deduplication

A registry entry owns the validator's name, its factory, and its default message as one record. The decorator's message key, the validator's emitted error key, and the default-message key therefore become structurally incapable of drifting.

The `cardNumber` / `'card'` mismatch and the missing `alphanumericWithSpaces` message stop being bugs that get fixed and become states that cannot be represented. This is the primary SOLID justification for the restructure.

### 4.5 Latent bug found during design

`GVCore.addControl(propertyKey, target[propertyKey])` reads the **prototype**. Instance field initializers never live on the prototype, so this expression is always `undefined` and every generated control is seeded with `undefined`. The "default value taken from the model field" behaviour has never worked in any released version.

**Decision:** drop the feature rather than implement it. Consumers use `patchValue`. Documented in `MIGRATION.md` so anyone who believed it worked is told plainly that it did not.

---

## 5. Public API

### 5.1 Bootstrap

`GVModule` is deleted. The directive and component become standalone, with a provider function:

```ts
bootstrapApplication(App, {
  providers: [
    provideGrandValidator({
      messages: { required: 'This field is required' },  // partial override
      validators: [myCustomValidator],                   // extends the registry
    }),
  ],
});
```

### 5.2 Model

Decorator usage is unchanged — the point of staying decorator-centric.

```ts
export class UserModel extends GVModel {
  @GV.required()
  @GV.minLength(5)
  @GV.maxLength(120)
  firstName!: string;
}

const form = UserModel.createForm();
UserModel.messages();
UserModel.markAllTouched();
```

### 5.3 Template

```html
<form [gvModel]="UserModel" [formGroup]="form">
  <input formControlName="firstName">
  <gv-error-message name="firstName" />
</form>
```

### 5.4 Renames and removals

| v1 | v2 | Reason |
|---|---|---|
| `[GV]` (selector and input) | `[gvModel]` | A screaming-caps selector doubling as its own input name is hostile to read. The README already documented `[gvModel]`; the code never matched it. |
| `genUIMsg()` | `messages()` | Abbreviating three words to no benefit. |
| `showUIErrors()` | `markAllTouched()` | It does not show anything; it marks controls touched. Matches Angular's own vocabulary. |

**Removed from the public surface:** `GVModule`, `GVDefaultValidators`, `GVCore`, `getUiForm()`.

**Internals remain `Untyped*`.** Forms are built by reflection from metadata, so typed reactive forms do not apply. `createForm()` returns `FormGroup`. A generic signature here would be a lie about what the library knows.

### 5.5 Error-priority behaviour change

v1 displays the **last** key of `control.errors`, which is arbitrary and makes the visible message depend on decorator stacking order (decorators evaluate bottom-up).

v2 selects the **first error in source order as written**, with `required` always winning. Metadata records declaration order and normalizes for bottom-up application, so the top-most decorator on a field is the message a user sees. This removes a footgun instead of documenting it.

---

## 6. Angular-facing runtime

### 6.1 Error component

Standalone, `ChangeDetectionStrategy.OnPush`, native control flow (drops the `CommonModule` import):

```ts
@Component({
  selector: 'gv-error-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <span class="text-danger">{{ msg }}</span>
    } @else {
      <span class="text-danger"><ng-content /></span>
    }
  `,
})
```

The `@else` branch preserves v1's static-content mode, where `<gv-error-message>` projects its own content when no control is bound.

### 6.2 The OnPush correctness requirement

The template gates on `control.touched`, but v1 subscribes only to `statusChanges`, which never fires on a touch. v1 renders correctly *only* because zone.js plus default change detection re-checks everything regardless.

**Adopting OnPush without addressing this would break the component.** v2 therefore drives off `AbstractControl.events` (Angular 18+), which emits `TouchedChangeEvent` alongside status and value events, fed through `toSignal` into a `computed` message. This is what makes the component genuinely zoneless-correct rather than merely zoneless-shaped, and it is a prerequisite of the change, not an enhancement.

`toSignal` owns teardown, so the manual `Subscription` and `ngOnDestroy` are deleted.

### 6.3 Directive

`input.required<GVModelStatic>()` plus a `computed` message tree. The nested-group parent-directive fallback moves into that computed; in v1 it is unreachable code, because `formMsgGroup` is assigned from `genUIMsg()` immediately before the fallback is tested.

---

## 7. Testing

**Step one of implementation is a spike**, because it can force a plan change: does `@angular/build:unit-test` accept a library project whose `build` target is `ng-packagr` rather than an application builder? The builder's `buildTarget` defaults to the current project's `build` target, and no schema field is required, but library compatibility is unverified.

- **If it works:** `ng test` with the Vitest runner (the builder's default).
- **If it does not:** fall back to standalone Vitest with `@analogjs/vite-plugin-angular`.

No other work proceeds until this is settled.

**Porting.** The 13 existing specs move over with minimal edits — Jasmine and Vitest share `describe` / `it` / `expect`, with `jasmine.createSpy` becoming `vi.fn()`. Eleven are pure functions with no Angular DI.

**New coverage** for the machinery this design introduces:

- `MetadataStore` inheritance resolution across a subclass chain
- `ValidatorRegistry` extension with a consumer-supplied validator
- `buildForm` and `buildMessages` as pure functions
- error-priority ordering (§5.5)
- the error component under `provideZonelessChangeDetection()`, asserting that a **touch** re-renders — the regression guard for §6.2

**Deleted:** `karma.conf.js`, `test.ts`, `polyfills.ts`.

---

## 8. Packaging, tooling, docs

### 8.1 Dependencies

Remove from root `package.json`: `@angular/router`, `@angular/animations`, and `path` — none are used. Remove **`zone.js`**, since going zoneless removes the last reason to carry it.

`lib/package.json`: peer dependencies to `^21.0.0`, add `sideEffects: false` and `engines`. Retain `tslib`.

### 8.2 Fixes

- `npm run publish` currently runs `cd ./dist`, but ng-packagr's `dest` is `../dist/ngx-grand-validator`. Correct the target.
- Delete `lib/package-lock.json`. A lockfile in the library source directory does nothing; ng-packagr generates the published manifest.

### 8.3 Lint and format

`angular-eslint` v21 flat config plus `typescript-eslint` and Prettier, wired to `npm run lint`.

The repo currently mixes indentation: `validators/`, `utils/`, and `components/error-message/` use tabs; `core/` and all specs use two spaces, despite `.editorconfig` specifying spaces. Normalization lands as **its own commit**, recorded in `.git-blame-ignore-revs` so `git blame` stays usable.

### 8.4 Documentation

- **README rewrite** against the real v2 API. The current one documents `forRoot`, which is being removed, and contains a broken example (`@GV.lastName(5)`, which is not a validator).
- **`MIGRATION.md`** covering v1 to v2: the provider function, the renames, the removed exports, the error-priority change, and the never-worked default-value behaviour from §4.5.

---

## 9. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `@angular/build:unit-test` may not accept an ng-packagr `build` target. It is marked `[EXPERIMENTAL]` in Angular 21. | **High** — could force a plan change | Spike first, before any other work. Known fallback: standalone Vitest + AnalogJS. |
| 2 | Experimental builder API may shift within the 21.x line. | Medium | Pin the Angular devkit version; the fallback remains available. |
| 3 | Development machine runs Node 20.20.0, which reached end-of-life in April 2026. | Medium — unsupported runtime, not a blocker | Angular 21 supports it, so nothing blocks this work. Recommend moving to Node 22 LTS, which additionally unlocks Angular 22. |
| 4 | Clean break with no compatibility layer strands consumers who upgrade blindly. | Medium | `MIGRATION.md` is load-bearing and in scope. |
| 5 | No CI, so nothing mechanically prevents publishing a broken build. | Medium | Accepted by explicit scoping decision. Re-raise after v2 ships. |
| 6 | Repo-wide reformatting damages `git blame`. | Low | Isolated commit plus `.git-blame-ignore-revs`. |

---

## 9a. Amendments (2026-08-30, during plan pre-flight)

Approved by the maintainer after the plan's pre-flight conflict scan. These override the sections they name.

1. **§5.2 / §5.4 — `markAllTouched()` is removed, not renamed.** The plan's draft backed it with a module-level "most recently created form" WeakMap, which is hidden state with a two-forms footgun. Angular's `FormGroup.markAllAsTouched()` already does the job recursively. `showUIErrors()` therefore has **no** v2 replacement; `MIGRATION.md` points users at Angular's method.

2. **§5.5 — source order needs its own carrier.** `buildMessages` only emits error keys the consumer overrode, so deriving order from it yields `[]` for any uncustomized field and silently restores v1's arbitrary selection. A sibling `buildOrder(metadata): Record<string, string[]>` is added, surfaced as `GVModel.order()` and `GvModelDirective.orderFor(name)`.

3. **`GVModelStatic` gains `order()`** and loses `markAllTouched()`, following from the two above.

---

## 10. Definition of done

- `npm run build` produces a publishable package on Angular 21.
- `npm test` runs the full suite on Vitest, including the new zoneless component regression test.
- `npm run lint` passes clean.
- No `@ts-ignore` remains anywhere in `lib/src`. There are two today: the dynamic validator lookup in `gv.service.ts` and the `statusChanges` subscription in `error-message.component.ts`. The registry removes the first; the `toSignal` rewrite removes the second.
- A subclassed `GVModel` inherits its parent's validation metadata, covered by a test.
- `@GV.cardNumber('custom message')` renders that custom message, covered by a test.
- README and `MIGRATION.md` describe the shipped API, with no example that fails to compile.
