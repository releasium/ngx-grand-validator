# ngx-grand-validator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@releasium/ngx-grand-validator` 2.0.0 on Angular 21 LTS — a clean-break major with a restructured decorator-centric core, a signals-based zoneless-correct UI, and Vitest replacing Karma.

**Architecture:** Decorators write into a data-only `ValidationMetadata` record held in a `WeakMap` keyed on the model constructor. Pure functions (`buildForm`, `buildMessages`) turn that metadata into Angular artifacts. A `ValidatorRegistry` owns each validator's name, factory, and default message as one record, making key drift structurally impossible. The two Angular-facing pieces become standalone, `OnPush`, and driven by `AbstractControl.events` through signals.

**Tech Stack:** Angular 21.2.22, TypeScript 5.9, ng-packagr 21, Vitest via `@angular/build:unit-test`, ESLint (angular-eslint 21) + Prettier.

**Design spec:** `docs/superpowers/specs/2026-08-30-ngx-grand-validator-v2-design.md`

## Global Constraints

- Branch `feat/v2-angular-21` is already checked out. Do not commit to `master`.
- Angular pinned to `21.2.22`; TypeScript `~5.9.0`; ng-packagr `^21.1.0`.
- `engines.node` is `^20.19.0 || ^22.12.0 || >=24.0.0`.
- Package version is `2.0.0` in **both** `package.json` and `lib/package.json`.
- `experimentalDecorators: true` MUST remain in every tsconfig. Removing it breaks every consumer. This is not negotiable — see spec §3.2.
- Peer dependencies are `^21.0.0` for `@angular/common`, `@angular/core`, `@angular/forms`.
- A validator's registry `name` MUST equal the error key its `ValidatorFn` emits. This invariant is the whole point of the registry.
- No `@ts-ignore` may remain anywhere in `lib/src` when the plan completes.
- Every commit message ends with a trailing line: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- Never use `git commit --no-verify` or skip hooks.
- Indentation is **2 spaces** everywhere (per `.editorconfig`). Do not preserve the legacy tabs.
- **Run the whole suite: `npm test`.** `ng test` rejects positional filter arguments, so `npm test -- some-spec` fails rather than filtering. The suite is fast (~2s of actual test time) and running all of it every time is the point — it catches the regression a filtered run would hide.
- A `ValidatorDefinition` literal requires all four fields — `name`, `errorKey`, `factory`, `defaultMessage`. Test fixtures included; `errorKey` being mandatory and independent of `name` is the invariant that makes message-key drift unrepresentable.
- **Metadata writes go through `ownMetadata` + `ensureControl` only.** `resolveMetadata` is read-only by contract and always returns a fresh container. Never mutate its result.
- **Tasks 8–12 are purely additive. Task 13 does every v1 deletion.** The v1 barrel chain is `lib/src/index.ts` → `core/index.ts` → `core/gv.ts`, `core/gv-core.ts`, `core/directive/`, `core/schema/`, plus `gv.module.ts` → `components/`. Deleting any one of those while a later task still has to rewrite its consumer breaks the build for several tasks running and destroys `npm run build` as a gate. So v1 and v2 implementations coexist from Task 8 through Task 12 — two `GVModel`s, two `GVService`s, two error components. That is expected and harmless: nothing imports the v2 tree until Task 13 rewrites the barrel, and the package is not published mid-plan.

---

## Phase 0 — De-risk

### Task 1: Spike the Vitest builder against a library target

The `@angular/build:unit-test` builder defaults `buildTarget` to the current project's `build` target. For this repo that target is `ng-packagr`, not an application builder. Nothing else in this plan is safe to start until we know whether that works.

**Files:**
- Modify: `angular.json` (test target only)
- Modify: `package.json` (dependencies)
- Create: `docs/superpowers/plans/spike-result.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a decision recorded in `spike-result.md` — either `BUILDER` or `STANDALONE`. Task 3 reads this and takes one of two documented branches.

- [ ] **Step 1: Replace the dependency block in `package.json`**

Replace the entire `dependencies` and `devDependencies` objects with:

```json
  "dependencies": {
    "@angular/common": "21.2.22",
    "@angular/compiler": "21.2.22",
    "@angular/core": "21.2.22",
    "@angular/forms": "21.2.22",
    "@angular/platform-browser": "21.2.22",
    "rxjs": "~7.8.0",
    "tslib": "^2.8.0"
  },
  "devDependencies": {
    "@angular/build": "21.2.22",
    "@angular/cli": "21.2.22",
    "@angular/compiler-cli": "21.2.22",
    "@types/node": "^20.19.0",
    "jsdom": "^26.0.0",
    "ng-packagr": "^21.1.0",
    "typescript": "~5.9.0",
    "vitest": "^4.1.0"
  }
```

Note what left: `@angular/router`, `@angular/animations`, `@angular/platform-browser-dynamic`, `path`, `zone.js`, and every `karma-*` / `jasmine-*` package. None are needed. `path` was a Node-polyfill package that was never imported.

**Vitest must be `^4.1.0`, not 3.x.** `@angular/build@21.2.22` declares `vitest@^4.0.8` as an optional peer; pinning 3.x makes `npm install` fail with `ERESOLVE` before anything else runs. Vitest 4.1.11 supports Node 20, so this is compatible with the environment.

**jsdom must be `^26.0.0`, not 28/30.** jsdom 30 requires Node `^22.22.3 || ^24.15.0 || >=26`, and on Node 20 every jsdom-backed test dies with `webidl.util.markAsUncloneable is not a function`. That failure is silent about its cause and easy to misread as an Angular problem. jsdom 26 declares `>=18` and is verified green on this project's Node 20.20.0 — 13 files, 85 tests. Since the whole reason this project targets Angular 21 rather than 22 is to keep Node 20 working, a jsdom that needs Node 22 defeats the point.

- [ ] **Step 2: Point the test target at the new builder**

In `angular.json`, replace the whole `"test"` block under `architect` with:

```json
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "tsconfig.spec.json",
            "runner": "vitest",
            "include": ["**/*.spec.ts"]
          }
        }
```

Two details that cost the spike a detour, verified against the real builder schema: **omit `browsers`** — passing `[]` fails schema validation in this version — and `include` globs resolve relative to `projectSourceRoot` (`lib/src`), not the workspace root, so `lib/**/*.spec.ts` matches nothing.

Also change the `build` builder from `@angular-devkit/build-angular:ng-packagr` to `@angular/build:ng-packagr`.

- [ ] **Step 3: Install**

Run: `npm install`
Expected: completes without `EBADENGINE` errors. If it fails, stop and report — do not proceed.

- [ ] **Step 4: Run the spike**

Run: `npm test`

There are 13 existing Jasmine specs. They may fail on assertion syntax — that is fine and expected. What matters is a single question: **does the builder start and collect tests, or does it reject the project outright?**

- Builder runs and reports test results (pass or fail) → outcome is `BUILDER`.
- Builder errors with a message about the build target, the application builder, or an unsupported project type → outcome is `STANDALONE`.

- [ ] **Step 5: Record the outcome**

Create `docs/superpowers/plans/spike-result.md` with exactly one of:

```markdown
# Spike result: BUILDER

`@angular/build:unit-test` accepts the ng-packagr library target.
Task 3 follows branch A.

Command output:
<paste the relevant output here>
```

or

```markdown
# Spike result: STANDALONE

`@angular/build:unit-test` rejects the ng-packagr library target.
Task 3 follows branch B (standalone Vitest + @analogjs/vite-plugin-angular).

Error:
<paste the exact error here>
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json angular.json docs/superpowers/plans/spike-result.md
git commit -m "build: move to Angular 21 deps and spike the Vitest builder"
```

---

## Phase 1 — Toolchain

### Task 2: Bring tsconfigs and workspace config to Angular 21

**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.spec.json`
- Modify: `lib/tsconfig.lib.json`
- Modify: `lib/tsconfig.lib.prod.json`
- Delete: `polyfills.ts`, `karma.conf.js`, `lib/package-lock.json`

**Interfaces:**
- Consumes: the dependency set from Task 1.
- Produces: a workspace where `npm run build` succeeds against the **existing v1 source**. No library source changes in this task.

- [ ] **Step 0: Make `npm test` runnable on Windows**

This is pulled forward from Task 15 because every task from here on runs `npm test`, and it currently does not run at all on Windows: the `./node_modules/.bin/` prefix makes cmd.exe report `'.' is not recognized as an internal or external command`. npm already puts `node_modules/.bin` on PATH, so the prefix is pure liability.

In `package.json`, replace the `scripts` block with:

```json
  "scripts": {
    "ng": "ng",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test --watch=false",
    "publish": "npm run build && cd ./dist && npm publish --access public"
  }
```

`start` is dropped — there is no application to serve in this workspace. `publish` is left alone here; Task 15 replaces it wholesale.

Verify before continuing:

Run: `npm test`
Expected: the Vitest builder starts. It will still report TypeScript errors from the stale `tsconfig.spec.json` — that is this task's Step 2. What must NOT happen is the cmd.exe `'.' is not recognized` error.

- [ ] **Step 1: Replace `tsconfig.json` entirely**

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "outDir": "./dist/out-tsc",
    "target": "ES2022",
    "module": "preserve",
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  },
  "files": []
}
```

Gone from v1: `baseUrl`, the `paths` mapping to `dist/` (a library must never resolve itself through its own build output), `downlevelIteration` (unnecessary at ES2022), `sourceMap`, `declaration: false`, `moduleResolution: node` (superseded by `module: preserve`), and `forceConsistentCasingInFileNames` (TypeScript 5 defaults it to `true`, so stating it is noise). Also note this task's file list touches `package.json` for Step 0.

- [ ] **Step 2: Replace `tsconfig.spec.json` entirely**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals", "node"]
  },
  "include": ["lib/**/*.spec.ts", "lib/**/*.d.ts"]
}
```

The `files` array referencing `test.ts` and `polyfills.ts` is gone — Vitest needs neither.

- [ ] **Step 3: Replace `lib/tsconfig.lib.json` entirely**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../out-tsc/lib",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "types": []
  },
  "exclude": ["**/*.spec.ts"]
}
```

Two v1 bugs fixed here: `outDir` was `../../out-tsc/lib`, which wrote **outside the repository**; and `exclude` referenced `../projects/lib/src/test.ts`, a path that has never existed in this workspace. Note `strictPropertyInitialization: false` is deliberately **not** carried over — v2 uses definite-assignment (`!`) explicitly where needed, so the blanket relaxation is no longer warranted.

- [ ] **Step 4: Replace `lib/tsconfig.lib.prod.json` entirely**

```json
{
  "extends": "./tsconfig.lib.json",
  "compilerOptions": {
    "declarationMap": false
  },
  "angularCompilerOptions": {
    "compilationMode": "partial"
  }
}
```

- [ ] **Step 5: Delete dead files**

```bash
git rm polyfills.ts karma.conf.js lib/package-lock.json
```

`test.ts` is deliberately kept until Task 3, because branch B may still need a setup file.

- [ ] **Step 5b: Bridge the v1 declarations past Angular's standalone default**

Angular 19 flipped the default for an unset `standalone` flag from `false` to `true`. v1's directive and component set it nowhere, so under Angular 21 they are implicitly standalone and `GVModule` cannot declare or export them:

```
lib/src/gv.module.ts:14:5 - error NG6008: Directive GVDirective is standalone, and cannot be declared in an NgModule.
lib/src/gv.module.ts:18:5 - error NG6004: Can't be exported from this NgModule, as it must be imported first
```

Add `standalone: false` to both decorators — one line each, nothing else:

In `lib/src/core/directive/gv.directive.ts`:

```ts
@Directive({
  selector: '[GV]',
  standalone: false,
})
```

In `lib/src/components/error-message/error-message.component.ts`:

```ts
@Component({
  selector: 'gv-error-message',
  templateUrl: './error-message.html',
  standalone: false,
})
```

This is a deliberate throwaway bridge, not a design decision. Both files are deleted outright in Tasks 11 and 12, and `gv.module.ts` goes in Task 13. Its only job is to keep `npm run build` green as a working gate for Tasks 3–10; without it the build stays red for ten tasks and stops being a signal. Do **not** instead convert these to real standalone components here — that is Tasks 11 and 12's work, and doing it now would mix a rewrite into a toolchain task.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: PASS. The v1 source compiles under Angular 21.

If `strictPropertyInitialization` now trips on `private form!: UntypedFormGroup` in `gv-core.ts` or `@Input() GV!` in `gv.directive.ts` — it should not, both already use `!` — add `!` rather than relaxing the flag.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "build: modernize tsconfigs for Angular 21 and drop Karma scaffolding"
```

---

### Task 3: Land the Vitest harness and port the 13 existing specs

**Files:**
- Branch B only — Create: `vitest.config.ts`
- Branch B only — Modify: `package.json`, `angular.json`
- Modify: all 13 `lib/src/validators/**/*.spec.ts`
- Delete: `test.ts`

**Interfaces:**
- Consumes: `docs/superpowers/plans/spike-result.md` from Task 1.
- Produces: a green `npm test`. Every later task depends on this working, because every later task is TDD.

- [ ] **Step 1: Read the spike result**

Run: `cat docs/superpowers/plans/spike-result.md`

If it says `BUILDER`, skip to Step 3. If it says `STANDALONE`, do Step 2 first.

- [ ] **Step 2: Branch B only — configure standalone Vitest**

Install the Angular Vite plugin:

```bash
npm i -D @analogjs/vite-plugin-angular @analogjs/vitest-angular
```

Create `vitest.config.ts`:

```ts
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['lib/**/*.spec.ts'],
    setupFiles: ['test.ts'],
    reporters: ['default'],
  },
});
```

Replace `test.ts` with:

```ts
import '@analogjs/vitest-angular/setup-zoneless';
```

In `package.json`, change the test script to `"test": "vitest run"`. In `angular.json`, delete the `test` target entirely.

- [ ] **Step 3: Port the spec files**

All 13 spec files follow one shape. Jasmine and Vitest share `describe`, `it`, `expect`, `beforeEach`, `toEqual`, and `toBeNull`, so the edits are small. In each of:

```
lib/src/validators/alphanumeric/alphanumeric.spec.ts
lib/src/validators/card-number/card-number.spec.ts
lib/src/validators/digit/digit.spec.ts
lib/src/validators/email/email.spec.ts
lib/src/validators/equals/equals.spec.ts
lib/src/validators/exact-length/exact-length.spec.ts
lib/src/validators/integer/integer.spec.ts
lib/src/validators/max/max.spec.ts
lib/src/validators/max-length/max-length.spec.ts
lib/src/validators/min/min.spec.ts
lib/src/validators/min-length/min-length.spec.ts
lib/src/validators/pattern/pattern.spec.ts
lib/src/validators/required/required.spec.ts
```

apply these three edits:

1. Add an explicit import at the top so the specs do not depend on globals:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
```

2. Replace any `jasmine.createSpy(...)` with `vi.fn()` (add `vi` to the import above if used).
3. Delete every `console.log({ result })` line. `email.spec.ts` has two; they are debug leftovers that pollute test output.

Also replace the loose `let validatorFn: any;` with the real type in each file:

```ts
import { ValidatorFn } from '@angular/forms';
let validatorFn: ValidatorFn;
```

- [ ] **Step 4: Run the suite**

Run: `npm test`
Expected: PASS, 13 files, all green.

If `card-number.spec.ts` fails, read it carefully before changing the validator — `cardNumberValidator` returns `{ 'cardNumber': null }` with a **null** payload, unlike every other validator. Task 4 normalizes that to `{}`; until then the existing spec is the source of truth.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: migrate the validator suite from Karma/Jasmine to Vitest"
```

---

## Phase 2 — Core

### Task 4: ValidatorRegistry and the built-in definitions

This is the keystone. One record per validator, owning name + factory + default message, so the three cannot drift apart.

**Files:**
- Create: `lib/src/core/registry/validator-definition.ts`
- Create: `lib/src/core/registry/validator-registry.ts`
- Create: `lib/src/core/registry/built-in-validators.ts`
- Create: `lib/src/core/registry/validator-registry.spec.ts`
- Modify: `lib/src/validators/card-number/card-number.validator.ts`
- Modify: `lib/src/validators/card-number/card-number.spec.ts`

**Interfaces:**
- Consumes: the 13 existing validator factory functions in `lib/src/validators/**`.
- Produces:
  - `interface ValidatorDefinition { readonly name: string; readonly factory: (...args: never[]) => ValidatorFn; readonly defaultMessage: string; }`
  - `class ValidatorRegistry` with `register(def): void`, `get(name): ValidatorDefinition | undefined`, `create(name, args: unknown[]): ValidatorFn | null`, `messages(): Record<string, string>`
  - `const BUILT_IN_VALIDATORS: readonly ValidatorDefinition[]`
  - Named exports for each definition: `REQUIRED`, `MIN_LENGTH`, `MAX_LENGTH`, `EXACT_LENGTH`, `MIN`, `MAX`, `DIGIT`, `EMAIL`, `INTEGER`, `PATTERN`, `EQUALS`, `CARD_NUMBER`, `ALPHANUMERIC`, `ALPHANUMERIC_WITH_SPACES`

- [ ] **Step 1: Write the failing test**

Create `lib/src/core/registry/validator-registry.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FormControl, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { ValidatorRegistry } from './validator-registry';
import { BUILT_IN_VALIDATORS } from './built-in-validators';

describe('ValidatorRegistry', () => {
  it('exposes every built-in validator by name', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    expect(registry.get('required')).toBeDefined();
    expect(registry.get('cardNumber')).toBeDefined();
    expect(registry.get('alphanumericWithSpaces')).toBeDefined();
  });

  it('creates a working ValidatorFn from a name and args', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    const fn = registry.create('minLength', [5]) as ValidatorFn;
    expect(fn(new FormControl('abc'))).toEqual({
      minlength: { requiredValue: 5, actualValue: 3 },
    });
  });

  it('returns null for an unknown name instead of throwing', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    expect(registry.create('noSuchValidator', [])).toBeNull();
  });

  it('accepts a consumer-supplied validator', () => {
    const shout: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
      c.value === String(c.value).toUpperCase() ? null : { shout: {} };
    const registry = new ValidatorRegistry([
      ...BUILT_IN_VALIDATORS,
      { name: 'shout', factory: () => shout, defaultMessage: 'Must be uppercase' },
    ]);
    expect(registry.create('shout', [])!(new FormControl('hi'))).toEqual({ shout: {} });
    expect(registry.messages()['shout']).toBe('Must be uppercase');
  });

  it('every definition name matches the error key its validator emits', () => {
    const registry = new ValidatorRegistry(BUILT_IN_VALIDATORS);
    const probes: Record<string, [unknown[], unknown]> = {
      required: [[], ''],
      minLength: [[5], 'ab'],
      maxLength: [[2], 'abcdef'],
      exactLength: [[4], 'ab'],
      min: [[10], 1],
      max: [[10], 99],
      digit: [[], 'abc'],
      email: [[], 'nope'],
      integer: [[], '1.5'],
      pattern: [[/^z+$/], 'aaa'],
      cardNumber: [[], '1234567812345678'],
      alphanumeric: [[{ whiteSpace: false }], '!!!'],
      alphanumericWithSpaces: [[{ whiteSpace: true }], '!!!'],
    };

    for (const [name, [args, value]] of Object.entries(probes)) {
      const errors = registry.create(name, args)!(new FormControl(value));
      const expectedKey = registry.get(name)!.errorKey;
      expect(Object.keys(errors ?? {})).toContain(expectedKey);
    }
  });
});
```

Note the last test introduces `errorKey`. Most validators emit their own name, but three do not: `minLength` emits `minlength`, `maxLength` emits `maxlength`, and `alphanumericWithSpaces` is produced by the `alphanumeric` factory with a flag. So `ValidatorDefinition` needs `errorKey` distinct from `name` — `name` is the schema/decorator-facing identifier, `errorKey` is what Angular puts in `control.errors`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — cannot resolve `./validator-registry`.

- [ ] **Step 3: Create `validator-definition.ts`**

```ts
import { ValidatorFn } from '@angular/forms';

/**
 * One record per validator, owning its identity, its factory and its default
 * message together. Keeping these in a single record is what prevents the
 * decorator key, the emitted error key and the message key from drifting apart.
 */
export interface ValidatorDefinition {
  /** Identifier used by decorators and by schema rule keys. Unique. */
  readonly name: string;
  /** The key this validator puts into `control.errors`. Often equal to `name`. */
  readonly errorKey: string;
  /** Builds the ValidatorFn from the decorator/schema arguments. */
  readonly factory: (...args: never[]) => ValidatorFn;
  /** Message shown when the consumer supplies none. */
  readonly defaultMessage: string;
}
```

- [ ] **Step 4: Create `validator-registry.ts`**

```ts
import { ValidatorFn } from '@angular/forms';
import { ValidatorDefinition } from './validator-definition';

export class ValidatorRegistry {
  private readonly definitions = new Map<string, ValidatorDefinition>();

  constructor(definitions: readonly ValidatorDefinition[] = []) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: ValidatorDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  get(name: string): ValidatorDefinition | undefined {
    return this.definitions.get(name);
  }

  /** Builds a ValidatorFn, or null when the name is not registered. */
  create(name: string, args: readonly unknown[]): ValidatorFn | null {
    const definition = this.definitions.get(name);
    if (!definition) {
      return null;
    }

    return (definition.factory as (...a: readonly unknown[]) => ValidatorFn)(...args);
  }

  /** Default messages keyed by error key, ready to merge with consumer overrides. */
  messages(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const definition of this.definitions.values()) {
      result[definition.errorKey] = definition.defaultMessage;
    }
    return result;
  }
}
```

- [ ] **Step 5: Create `built-in-validators.ts`**

```ts
import { requiredValidator } from '../../validators/required/required.validator';
import { patternValidator } from '../../validators/pattern/pattern.validator';
import { digitValidator } from '../../validators/digit/digit.validator';
import { emailValidator } from '../../validators/email/email.validator';
import { integerValidator } from '../../validators/integer/integer.validator';
import { minLengthValidator } from '../../validators/min-length/min-length.validator';
import { maxLengthValidator } from '../../validators/max-length/max-length.validator';
import { minValidator } from '../../validators/min/min.validator';
import { maxValidator } from '../../validators/max/max.validator';
import { exactLengthValidator } from '../../validators/exact-length/exact-length.validator';
import { equalsValidator } from '../../validators/equals/equals.validator';
import { cardNumberValidator } from '../../validators/card-number/card-number.validator';
import { alphanumericValidator } from '../../validators/alphanumeric/alphanumeric.validator';
import { ValidatorDefinition } from './validator-definition';

export const REQUIRED: ValidatorDefinition = {
  name: 'required',
  errorKey: 'required',
  factory: requiredValidator,
  defaultMessage: 'Please fill out this mandatory field',
};

export const MIN_LENGTH: ValidatorDefinition = {
  name: 'minLength',
  errorKey: 'minlength',
  factory: minLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Input length is too short',
};

export const MAX_LENGTH: ValidatorDefinition = {
  name: 'maxLength',
  errorKey: 'maxlength',
  factory: maxLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Input length is too long',
};

export const EXACT_LENGTH: ValidatorDefinition = {
  name: 'exactLength',
  errorKey: 'exactLength',
  factory: exactLengthValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Length must match the specified requirement',
};

export const MIN: ValidatorDefinition = {
  name: 'min',
  errorKey: 'min',
  factory: minValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Value should not be less than the minimum allowed',
};

export const MAX: ValidatorDefinition = {
  name: 'max',
  errorKey: 'max',
  factory: maxValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Value should not exceed the maximum allowed',
};

export const DIGIT: ValidatorDefinition = {
  name: 'digit',
  errorKey: 'digit',
  factory: digitValidator,
  defaultMessage: 'Only digits (0-9) allowed here',
};

export const EMAIL: ValidatorDefinition = {
  name: 'email',
  errorKey: 'email',
  factory: emailValidator,
  defaultMessage: 'Provide a valid email address',
};

export const INTEGER: ValidatorDefinition = {
  name: 'integer',
  errorKey: 'integer',
  factory: integerValidator,
  defaultMessage: 'Enter a whole number (integer)',
};

export const PATTERN: ValidatorDefinition = {
  name: 'pattern',
  errorKey: 'pattern',
  factory: patternValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Input does not match the required pattern',
};

export const EQUALS: ValidatorDefinition = {
  name: 'equals',
  errorKey: 'equals',
  factory: equalsValidator as ValidatorDefinition['factory'],
  defaultMessage: 'Values must match',
};

export const CARD_NUMBER: ValidatorDefinition = {
  name: 'cardNumber',
  errorKey: 'cardNumber',
  factory: cardNumberValidator,
  defaultMessage: 'Enter a valid card number',
};

export const ALPHANUMERIC: ValidatorDefinition = {
  name: 'alphanumeric',
  errorKey: 'alphanumeric',
  factory: (() => alphanumericValidator({ whiteSpace: false })) as ValidatorDefinition['factory'],
  defaultMessage: 'Use only letters and numbers in this field',
};

export const ALPHANUMERIC_WITH_SPACES: ValidatorDefinition = {
  name: 'alphanumericWithSpaces',
  errorKey: 'alphanumericWithSpaces',
  factory: (() => alphanumericValidator({ whiteSpace: true })) as ValidatorDefinition['factory'],
  defaultMessage: 'Use only letters, numbers and spaces in this field',
};

export const BUILT_IN_VALIDATORS: readonly ValidatorDefinition[] = [
  REQUIRED,
  MIN_LENGTH,
  MAX_LENGTH,
  EXACT_LENGTH,
  MIN,
  MAX,
  DIGIT,
  EMAIL,
  INTEGER,
  PATTERN,
  EQUALS,
  CARD_NUMBER,
  ALPHANUMERIC,
  ALPHANUMERIC_WITH_SPACES,
];
```

Three v1 bugs are fixed by construction here: `cardNumber` is no longer keyed `'card'`; `alphanumericWithSpaces` now has a message; and `equals` no longer carries the email message copy-pasted into it.

The `alphanumeric` factories ignore their args and hard-code the flag, so the two variants become two independent registry names — which is what lets the schema path address them separately.

- [ ] **Step 6: Normalize the card-number error payload**

In `lib/src/validators/card-number/card-number.validator.ts`, change:

```ts
			return { 'cardNumber': null };
```

to:

```ts
    return { cardNumber: {} };
```

Every other validator uses `{}`; a null payload breaks the message interpolation path, which does `Object.keys(data)`.

Then update the corresponding assertion in `lib/src/validators/card-number/card-number.spec.ts` from `{ cardNumber: null }` to `{ cardNumber: {} }`.

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: PASS, including the five new registry tests.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(core): add ValidatorRegistry as the single source of validator identity"
```

---

### Task 5: ValidationMetadata and MetadataStore

**Files:**
- Create: `lib/src/core/metadata/validation-metadata.ts`
- Create: `lib/src/core/metadata/metadata-store.ts`
- Create: `lib/src/core/metadata/metadata-store.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type ModelCtor = abstract new (...args: never[]) => object`
  - `interface ControlMetadata { validators: ValidatorFn[]; asyncValidators: AsyncValidatorFn[]; messages: Map<string, string>; order: string[]; }`
  - `interface ValidationMetadata { controls: Map<string, ControlMetadata>; groups: Map<string, ModelCtor>; arrays: Map<string, ModelCtor[]>; }`
  - `function ownMetadata(ctor: ModelCtor): ValidationMetadata`
  - `function resolveMetadata(ctor: ModelCtor): ValidationMetadata`
  - `function ensureControl(meta: ValidationMetadata, name: string): ControlMetadata`

- [ ] **Step 1: Write the failing test**

Create `lib/src/core/metadata/metadata-store.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Validators } from '@angular/forms';
import { ownMetadata, resolveMetadata, ensureControl } from './metadata-store';

class Base {}
class Derived extends Base {}
class Unrelated {}

describe('MetadataStore', () => {
  it('creates metadata lazily and returns the same instance twice', () => {
    const first = ownMetadata(Base);
    const second = ownMetadata(Base);
    expect(first).toBe(second);
  });

  it('keeps metadata separate per class', () => {
    ensureControl(ownMetadata(Base), 'a');
    expect(resolveMetadata(Unrelated).controls.has('a')).toBe(false);
  });

  it('resolves a parent class metadata through the prototype chain', () => {
    ensureControl(ownMetadata(Base), 'inherited');
    expect(resolveMetadata(Derived).controls.has('inherited')).toBe(true);
  });

  it('lets a subclass add controls without mutating the parent', () => {
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

  it('lets a subclass override a control the parent declared', () => {
    class Base {}
    class Derived extends Base {}
    ensureControl(ownMetadata(Base), 'shared').order.push('fromBase');
    ensureControl(ownMetadata(Derived), 'shared').order.push('fromDerived');

    expect(resolveMetadata(Derived).controls.get('shared')!.order).toEqual(['fromDerived']);
    expect(resolveMetadata(Base).controls.get('shared')!.order).toEqual(['fromBase']);
  });

  it('never returns a live reference into the store', () => {
    class Solo {}
    ensureControl(ownMetadata(Solo), 'a');

    // Single-ancestor chains once took a fast path that returned the stored
    // object itself, so mutating the result corrupted the store.
    ensureControl(resolveMetadata(Solo), 'injected');

    expect(resolveMetadata(Solo).controls.has('injected')).toBe(false);
    expect(ownMetadata(Solo).controls.has('injected')).toBe(false);
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — cannot resolve `./metadata-store`.

- [ ] **Step 3: Create `validation-metadata.ts`**

```ts
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

/** Any model class usable as a nested group or array item. */
export type ModelCtor = abstract new (...args: never[]) => object;

export interface ControlMetadata {
  readonly validators: ValidatorFn[];
  readonly asyncValidators: AsyncValidatorFn[];
  /** Error key -> message, for keys the consumer overrode. */
  readonly messages: Map<string, string>;
  /**
   * Error keys in source order, top-most decorator first.
   * Drives which message wins when a control has several errors.
   */
  readonly order: string[];
}

export interface ValidationMetadata {
  readonly controls: Map<string, ControlMetadata>;
  readonly groups: Map<string, ModelCtor>;
  readonly arrays: Map<string, ModelCtor[]>;
}

export function emptyMetadata(): ValidationMetadata {
  return { controls: new Map(), groups: new Map(), arrays: new Map() };
}

export function emptyControl(): ControlMetadata {
  return { validators: [], asyncValidators: [], messages: new Map(), order: [] };
}
```

- [ ] **Step 4: Create `metadata-store.ts`**

```ts
import {
  ControlMetadata,
  ModelCtor,
  ValidationMetadata,
  emptyControl,
  emptyMetadata,
} from './validation-metadata';

/**
 * Metadata lives here rather than on the class itself. v1 wrote it onto the
 * constructor and the prototype, which polluted consumer classes and — because
 * the read used getOwnPropertyDescriptor — silently broke inheritance.
 */
const STORE = new WeakMap<ModelCtor, ValidationMetadata>();

/** Metadata declared directly on `ctor`, created on first access. */
export function ownMetadata(ctor: ModelCtor): ValidationMetadata {
  let metadata = STORE.get(ctor);
  if (!metadata) {
    metadata = emptyMetadata();
    STORE.set(ctor, metadata);
  }
  return metadata;
}

/**
 * Metadata for `ctor` merged with every ancestor's. Subclass entries win.
 *
 * READ-ONLY BY CONTRACT. Always returns a fresh container, never a live
 * reference into STORE, so a caller cannot corrupt a class's stored metadata
 * — or its parent's — by mutating what it got back. Writes go through
 * `ownMetadata` + `ensureControl` exclusively.
 */
export function resolveMetadata(ctor: ModelCtor): ValidationMetadata {
  const chain: ValidationMetadata[] = [];

  for (let current: unknown = ctor; typeof current === 'function'; current = Object.getPrototypeOf(current)) {
    const metadata = STORE.get(current as ModelCtor);
    if (metadata) {
      chain.unshift(metadata);
    }
  }

  const merged = emptyMetadata();
  for (const metadata of chain) {
    metadata.controls.forEach((value, key) => merged.controls.set(key, value));
    metadata.groups.forEach((value, key) => merged.groups.set(key, value));
    metadata.arrays.forEach((value, key) => merged.arrays.set(key, value));
  }
  return merged;
}

export function ensureControl(metadata: ValidationMetadata, name: string): ControlMetadata {
  let control = metadata.controls.get(name);
  if (!control) {
    control = emptyControl();
    metadata.controls.set(name, control);
  }
  return control;
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): store validation metadata in a WeakMap with inheritance support"
```

---

### Task 6: buildForm

**Files:**
- Create: `lib/src/core/builders/build-form.ts`
- Create: `lib/src/core/builders/build-form.spec.ts`

**Interfaces:**
- Consumes: `ValidationMetadata`, `resolveMetadata`, `ensureControl` from Task 5.
- Produces: `function buildForm(metadata: ValidationMetadata): UntypedFormGroup`

- [ ] **Step 1: Write the failing test**

Create `lib/src/core/builders/build-form.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — cannot resolve `./build-form`.

- [ ] **Step 3: Implement `build-form.ts`**

```ts
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { ValidationMetadata } from '../metadata/validation-metadata';
import { resolveMetadata } from '../metadata/metadata-store';

/**
 * Turns metadata into a reactive form. Pure: same metadata in, equivalent
 * form out, no reflection on model instances and no DI.
 *
 * Controls are seeded with null. v1 tried to seed them from the model's field
 * initializer, but read the prototype — where instance fields never live — so
 * every control was seeded undefined regardless. The feature is dropped rather
 * than fixed; consumers use patchValue.
 */
export function buildForm(metadata: ValidationMetadata): UntypedFormGroup {
  const controls: Record<string, AbstractControl> = {};

  metadata.controls.forEach((control, name) => {
    controls[name] = new UntypedFormControl(null, control.validators, control.asyncValidators);
  });

  metadata.groups.forEach((modelCtor, name) => {
    controls[name] = buildForm(resolveMetadata(modelCtor));
  });

  metadata.arrays.forEach((modelCtors, name) => {
    // An array name may also carry control-level validators; reuse them here.
    const arrayValidators = metadata.controls.get(name)?.validators ?? [];
    const items = modelCtors.map((modelCtor) => buildForm(resolveMetadata(modelCtor)));
    controls[name] = new UntypedFormArray(items, arrayValidators);
  });

  return new UntypedFormGroup(controls);
}
```

Note this replaces `UntypedFormBuilder` with direct construction. `FormBuilder` is a DI service, and requiring DI to build a form from static metadata was an unnecessary coupling — this is what makes `buildForm` a pure function.

- [ ] **Step 4: Run the tests**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(core): add buildForm as a pure metadata-to-FormGroup function"
```

---

### Task 7: buildMessages and error selection

**Files:**
- Create: `lib/src/core/builders/build-messages.ts`
- Create: `lib/src/core/builders/select-error.ts`
- Create: `lib/src/core/builders/build-messages.spec.ts`
- Create: `lib/src/core/builders/select-error.spec.ts`
- Modify: `lib/src/components/error-message/form-msg.type.ts` → moved to `lib/src/core/builders/form-message.type.ts`

**Interfaces:**
- Consumes: `ValidationMetadata`, `resolveMetadata` from Task 5.
- Produces:
  - `interface FormMessage { [key: string]: string | FormMessage }`
  - `function buildMessages(metadata: ValidationMetadata): FormMessage`
  - `function buildOrder(metadata: ValidationMetadata): Record<string, string[]>`
  - `function selectError(errors: ValidationErrors, order: readonly string[]): string | null`

- [ ] **Step 1: Write the failing tests**

Create `lib/src/core/builders/select-error.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectError } from './select-error';

describe('selectError', () => {
  it('prefers required over everything else', () => {
    expect(selectError({ minlength: {}, required: {} }, ['minlength', 'required'])).toBe('required');
  });

  it('picks the first key in declared source order', () => {
    expect(selectError({ maxlength: {}, minlength: {} }, ['minlength', 'maxlength'])).toBe('minlength');
  });

  it('ignores ordered keys that are not currently in error', () => {
    expect(selectError({ maxlength: {} }, ['minlength', 'maxlength'])).toBe('maxlength');
  });

  it('falls back to the first error key when order does not cover it', () => {
    expect(selectError({ custom: {} }, ['minlength'])).toBe('custom');
  });

  it('returns null when there are no errors', () => {
    expect(selectError({}, ['minlength'])).toBeNull();
  });
});
```

Create `lib/src/core/builders/build-messages.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ownMetadata, ensureControl } from '../metadata/metadata-store';
import { buildMessages } from './build-messages';

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
    ownMetadata(Holder).arrays.set('items', [Item, Item]);

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
```

Add `buildOrder` to this file's imports alongside `buildMessages`.

`buildOrder` exists because the order list must reach the error component **independently of custom messages**. Deriving order from message keys — as an earlier draft of this plan did — yields `[]` for any field the consumer did not customize, which silently reinstates v1's arbitrary error selection.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `form-message.type.ts`**

```ts
export interface FormMessage {
  [key: string]: string | FormMessage;
}
```

This tightens v1's `string | Object`, which forced casts at every consumer.

Then delete `lib/src/components/error-message/form-msg.type.ts` and update the imports in `lib/src/core/gv-core.ts`, `lib/src/core/gv.ts`, `lib/src/core/directive/gv.directive.ts`, and `lib/src/components/error-message/error-message.component.ts` to point at the new path. Those files are removed or rewritten later; this keeps the build green in between.

- [ ] **Step 4: Create `select-error.ts`**

```ts
import { ValidationErrors } from '@angular/forms';

/**
 * Chooses which of a control's errors to show.
 *
 * v1 showed `Object.keys(errors)` last element, which made the visible message
 * depend on decorator stacking order — decorators apply bottom-up, so the
 * bottom-most decorator won. v2 shows the first error in source order, with
 * `required` always winning, so the top-most decorator wins instead.
 */
export function selectError(errors: ValidationErrors, order: readonly string[]): string | null {
  const keys = Object.keys(errors);
  if (keys.length === 0) {
    return null;
  }

  if (keys.includes('required')) {
    return 'required';
  }

  for (const key of order) {
    if (keys.includes(key)) {
      return key;
    }
  }

  return keys[0];
}
```

- [ ] **Step 5: Create `build-messages.ts`**

```ts
import { ValidationMetadata } from '../metadata/validation-metadata';
import { resolveMetadata } from '../metadata/metadata-store';
import { FormMessage } from './form-message.type';

/** Turns metadata into the nested message tree the error component reads. */
export function buildMessages(metadata: ValidationMetadata): FormMessage {
  const result: FormMessage = {};

  metadata.controls.forEach((control, name) => {
    const messages: FormMessage = {};
    control.messages.forEach((text, errorKey) => {
      messages[errorKey] = text;
    });
    result[name] = messages;
  });

  metadata.groups.forEach((modelCtor, name) => {
    result[name] = buildMessages(resolveMetadata(modelCtor));
  });

  metadata.arrays.forEach((modelCtors, name) => {
    const first = modelCtors[0];
    result[name] = first ? buildMessages(resolveMetadata(first)) : {};
  });

  return result;
}
```

v1 looped over every array model and overwrote the same key each time, so only the last won — identical output for identical models, wasted work otherwise. Taking the first model makes that explicit.

- [ ] **Step 5b: Add `buildOrder` to `build-messages.ts`**

```ts
/**
 * Per-control error-key order, top-most decorator first. Kept separate from
 * buildMessages because order must be known even for controls the consumer
 * never wrote a custom message for.
 */
export function buildOrder(metadata: ValidationMetadata): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  metadata.controls.forEach((control, name) => {
    result[name] = [...control.order];
  });
  return result;
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(core): add buildMessages and deterministic error selection"
```

---

### Task 8: Rewrite the decorators and GVModel on the new core

**Files:**
- Create: `lib/src/decorators/gv.ts`
- Create: `lib/src/decorators/gv-model.ts`
- Create: `lib/src/decorators/gv.spec.ts`

**This task is purely additive — delete nothing.** The v1 `core/gv.ts` and `core/gv-core.ts` stay in place until Task 13. `core/directive/gv.directive.ts` imports `GVModel` and `IGVModelStatic` from `../gv`, and `core/schema/gv.service.ts` imports `GVModel` and calls `getUiForm()` on it; neither is rewritten until Tasks 12 and 9. Deleting the v1 core here would break the build for four consecutive tasks and destroy its value as a gate. The v1 and v2 cores coexist harmlessly in the meantime — nothing imports `decorators/` yet, and the package is not published mid-plan.

**Interfaces:**
- Consumes: `ownMetadata`, `ensureControl`, `resolveMetadata` (Task 5); `buildForm` (Task 6); `buildMessages` (Task 7); the definition constants from Task 4.
- Produces:
  - `class GV` with statics: `control()`, `group(model)`, `array(model, count)`, `required(msg?)`, `minLength(v, msg?)`, `maxLength(v, msg?)`, `exactLength(v, msg?)`, `min(v, msg?)`, `max(v, msg?)`, `digit(msg?)`, `email(msg?)`, `integer(msg?)`, `pattern(re, msg?)`, `equals(prop, msg?)`, `cardNumber(msg?)`, `alphanumeric(msg?)`, `alphanumericWithSpaces(msg?)`
  - `class GVModel` with statics `createForm(): UntypedFormGroup`, `messages(): FormMessage`, `order(): Record<string, string[]>`
  - `interface GVModelStatic { createForm(): UntypedFormGroup; messages(): FormMessage; order(): Record<string, string[]> }`

**No `markAllTouched`.** An earlier draft added one backed by a module-level "last created form" WeakMap. Angular's `FormGroup.markAllAsTouched()` already does exactly that job, recursively, with no hidden state — the wrapper existed only to mirror v1's `showUIErrors()`. `MIGRATION.md` (Task 16) points v1 users at Angular's method instead.

- [ ] **Step 1: Write the failing test**

Create `lib/src/decorators/gv.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — cannot resolve `./gv`.

- [ ] **Step 3: Create `gv.ts`**

```ts
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  ALPHANUMERIC,
  ALPHANUMERIC_WITH_SPACES,
  CARD_NUMBER,
  DIGIT,
  EMAIL,
  EQUALS,
  EXACT_LENGTH,
  INTEGER,
  MAX,
  MAX_LENGTH,
  MIN,
  MIN_LENGTH,
  PATTERN,
  REQUIRED,
} from '../core/registry/built-in-validators';
import { ValidatorDefinition } from '../core/registry/validator-definition';
import { ModelCtor } from '../core/metadata/validation-metadata';
import { ensureControl, ownMetadata } from '../core/metadata/metadata-store';

/** The prototype a property decorator receives. */
type DecoratorTarget = { constructor: ModelCtor };

function metadataFor(target: DecoratorTarget) {
  return ownMetadata(target.constructor);
}

/**
 * Registers a validator against a field.
 *
 * Decorators apply bottom-up, so `order` is unshifted: after the whole class
 * is evaluated, order[0] is the top-most decorator in the source.
 */
function register(
  definition: ValidatorDefinition,
  args: readonly unknown[],
  message: string | undefined,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const control = ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
    const factory = definition.factory as (...a: readonly unknown[]) => ValidatorFn;

    control.validators.unshift(factory(...args));
    control.order.unshift(definition.errorKey);

    if (message !== undefined) {
      control.messages.set(definition.errorKey, message);
    }
  };
}

export class GV {
  /** A field with no validators, present in the form. */
  static control(): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
    };
  }

  static group(model: ModelCtor): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      metadataFor(target as DecoratorTarget).groups.set(String(propertyKey), model);
    };
  }

  static array(model: ModelCtor, count = 0): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      const models = Array.from({ length: count }, () => model);
      metadataFor(target as DecoratorTarget).arrays.set(String(propertyKey), models);
    };
  }

  static asyncControl(validator: AsyncValidatorFn, errorKey: string, msg?: string): PropertyDecorator {
    return (target: object, propertyKey: string | symbol): void => {
      const control = ensureControl(metadataFor(target as DecoratorTarget), String(propertyKey));
      control.asyncValidators.unshift(validator);
      control.order.unshift(errorKey);
      if (msg !== undefined) {
        control.messages.set(errorKey, msg);
      }
    };
  }

  static required(msg?: string): PropertyDecorator {
    return register(REQUIRED, [], msg);
  }

  static minLength(value: number, msg?: string): PropertyDecorator {
    return register(MIN_LENGTH, [value], msg);
  }

  static maxLength(value: number, msg?: string): PropertyDecorator {
    return register(MAX_LENGTH, [value], msg);
  }

  static exactLength(value: number | string, msg?: string): PropertyDecorator {
    return register(EXACT_LENGTH, [value], msg);
  }

  static min(value: number | string, msg?: string): PropertyDecorator {
    return register(MIN, [Number(value)], msg);
  }

  static max(value: number | string, msg?: string): PropertyDecorator {
    return register(MAX, [Number(value)], msg);
  }

  static digit(msg?: string): PropertyDecorator {
    return register(DIGIT, [], msg);
  }

  static email(msg?: string): PropertyDecorator {
    return register(EMAIL, [], msg);
  }

  static integer(msg?: string): PropertyDecorator {
    return register(INTEGER, [], msg);
  }

  static pattern(value: RegExp, msg?: string): PropertyDecorator {
    return register(PATTERN, [value], msg);
  }

  static equals(propName: string, msg?: string): PropertyDecorator {
    return register(EQUALS, [propName], msg);
  }

  static cardNumber(msg?: string): PropertyDecorator {
    return register(CARD_NUMBER, [], msg);
  }

  static alphanumeric(msg?: string): PropertyDecorator {
    return register(ALPHANUMERIC, [], msg);
  }

  static alphanumericWithSpaces(msg?: string): PropertyDecorator {
    return register(ALPHANUMERIC_WITH_SPACES, [], msg);
  }
}
```

Two API changes worth noting. `GV.alphanumeric({ whiteSpace: true })` becomes `GV.alphanumericWithSpaces()` — an options object whose only field selects between two behaviours is worse than two named methods, and it was the reason the with-spaces variant had no message. And `GV.min` drops v1's third `ignoreValues` parameter, which was accepted and silently ignored.

The `register` helper is what resolves the `// TODO fix validators duplications`. Per-validator signatures stay explicit rather than collapsing to a variadic, because explicit signatures are what give consumers real IDE completion and arity checking — the duplication worth removing was the repeated message-key string literal, and that is now gone.

- [ ] **Step 4: Create `gv-model.ts`**

```ts
import { UntypedFormGroup } from '@angular/forms';
import { resolveMetadata } from '../core/metadata/metadata-store';
import { ModelCtor } from '../core/metadata/validation-metadata';
import { buildForm } from '../core/builders/build-form';
import { buildMessages, buildOrder } from '../core/builders/build-messages';
import { FormMessage } from '../core/builders/form-message.type';

/** The static shape the [gvModel] directive requires. */
export interface GVModelStatic {
  createForm(): UntypedFormGroup;
  messages(): FormMessage;
  order(): Record<string, string[]>;
}

export abstract class GVModel {
  static createForm(this: ModelCtor): UntypedFormGroup {
    return buildForm(resolveMetadata(this));
  }

  static messages(this: ModelCtor): FormMessage {
    return buildMessages(resolveMetadata(this));
  }

  /** Per-control error-key order, top-most decorator first. */
  static order(this: ModelCtor): Record<string, string[]> {
    return buildOrder(resolveMetadata(this));
  }
}
```

Every static is a pure function of the class's metadata — no instance state, nothing cached, nothing to invalidate. v1's `showUIErrors()` has no replacement here: Angular's `form.markAllAsTouched()` already marks nested groups recursively, which v1's version did not.

- [ ] **Step 5: Delete nothing**

Deliberately empty. `lib/src/core/gv.ts`, `lib/src/core/gv-core.ts`, and `lib/src/core/index.ts` are untouched — see this task's Files note. Task 13 removes them once their last consumer is gone.

- [ ] **Step 6: Run the tests**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: PASS, 7 tests. In particular the `cardNumber` custom-message test and the subclass-inheritance test both pass — these are the two v1 bugs this task fixes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(core): rebuild GV decorators and GVModel on metadata store"
```

---

### Task 9: Move the schema applier onto the registry

**Files:**
- Create: `lib/src/schema/gv.service.ts`
- Create: `lib/src/schema/control-validation.interface.ts`
- Create: `lib/src/schema/controls.enum.ts`
- Create: `lib/src/schema/gv.service.spec.ts`
- Delete: nothing (see Global Constraints — Task 13 removes `lib/src/core/schema/`)

**Interfaces:**
- Consumes: `ValidatorRegistry` (Task 4); `GVModelStatic` (Task 8).
- Produces: `@Injectable() class GVService` with `createForm(model: GVModelStatic, schema: GVItemConfig[]): UntypedFormGroup`, `applySchema(...)`, `isControlAvailable(name, schema): boolean`. The `GVItemConfig`, `GVRuleItems`, `GVRules`, `GVRule`, `GVData` interfaces and `FormControlType` enum move unchanged.

- [ ] **Step 1: Write the failing test**

Create `lib/src/schema/gv.service.spec.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { GV } from '../decorators/gv';
import { GVModel } from '../decorators/gv-model';
import { ValidatorRegistry } from '../core/registry/validator-registry';
import { BUILT_IN_VALIDATORS } from '../core/registry/built-in-validators';
import { GVService } from './gv.service';
import { FormControlType } from './controls.enum';
import { GVItemConfig } from './control-validation.interface';

class Signup extends GVModel {
  @GV.control()
  nickname!: string;

  @GV.control()
  rows!: unknown[];
}

describe('GVService', () => {
  let service: GVService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ValidatorRegistry, useValue: new ValidatorRegistry(BUILT_IN_VALIDATORS) },
        GVService,
      ],
    });
    service = TestBed.inject(GVService);
  });

  it('applies an available rule set to a control', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { minLength: 4 } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.hasError('minlength')).toBe(true);
  });

  it('skips a rule set that is not available', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: false, rules: { minLength: 4 } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.valid).toBe(true);
  });

  it('ignores a disabled rule', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { minLength: { value: 4, disabled: true } } }],
      },
    ];

    const form = service.createForm(Signup, schema);
    form.get('nickname')!.setValue('ab');
    expect(form.get('nickname')!.valid).toBe(true);
  });

  it('drops an unknown rule key without throwing', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'nickname',
        type: FormControlType.CONTROL,
        validation: [{ available: true, rules: { noSuchRule: 1 } }],
      },
    ];

    expect(() => service.createForm(Signup, schema)).not.toThrow();
  });

  it('populates a FormArray to the declared length', () => {
    const schema: GVItemConfig[] = [
      {
        name: 'rows',
        type: FormControlType.ARRAY,
        arrayLength: 2,
        arrayFormGroup: [{ name: 'label', type: FormControlType.CONTROL }],
      },
    ];

    const form = service.createForm(Signup, schema);
    expect((form.get('rows') as UntypedFormArray).length).toBe(2);
  });

  it('reuses a FormArray the model already declared, keeping its validators', () => {
    class Row extends GVModel {
      @GV.control()
      label!: string;
    }

    class Declared extends GVModel {
      @GV.minLength(2)
      @GV.array(Row, 0)
      items!: unknown[];
    }

    const schema: GVItemConfig[] = [
      {
        name: 'items',
        type: FormControlType.ARRAY,
        arrayLength: 2,
        arrayFormGroup: [{ name: 'label', type: FormControlType.CONTROL }],
      },
    ];

    const form = Declared.createForm();
    const before = form.get('items') as UntypedFormArray;
    expect(before).toBeInstanceOf(UntypedFormArray);
    expect(before.validator).not.toBeNull();

    service.applySchema(schema, form);

    const after = form.get('items') as UntypedFormArray;
    expect(after).toBe(before);
    expect(after.length).toBe(2);
    expect(after.validator).not.toBeNull();
  });

  it('reports control availability', () => {
    const schema: GVItemConfig[] = [
      { name: 'nickname', type: FormControlType.CONTROL, validation: [{ available: true, rules: {} }] },
    ];
    expect(service.isControlAvailable('nickname', schema)).toBe(true);
    expect(service.isControlAvailable('missing', schema)).toBe(false);
  });
});
```

Note the `rows` field must be declared `@GV.control()` on the model so `createForm` produces a control the schema can replace with a `FormArray`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — cannot resolve `./gv.service`.

- [ ] **Step 3: Move the unchanged schema types**

Copy `lib/src/core/schema/controls.enum.ts` to `lib/src/schema/controls.enum.ts` verbatim, and `lib/src/core/schema/control-validation.interface.ts` to `lib/src/schema/control-validation.interface.ts` verbatim except reindented to 2 spaces.

- [ ] **Step 4: Create `gv.service.ts`**

```ts
import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
} from '@angular/forms';

import { FormControlType } from './controls.enum';
import { GVData, GVItemConfig, GVRule, GVRules } from './control-validation.interface';
import { GVModelStatic } from '../decorators/gv-model';
import { ValidatorRegistry } from '../core/registry/validator-registry';

@Injectable()
export class GVService {
  private readonly registry = inject(ValidatorRegistry);

  createForm(model: GVModelStatic, schema: GVItemConfig[]): UntypedFormGroup {
    const form = model.createForm();
    this.applySchema(schema, form);
    return form;
  }

  isControlAvailable(name: string, schema: GVItemConfig[]): boolean {
    return !!schema.find((c) => c.name === name)?.validation?.some((v) => v.available);
  }

  applySchema<T>(schema: GVItemConfig[], form: UntypedFormGroup, data: GVData<T> = {}): void {
    for (const item of schema) {
      const available = item.validation?.find((v) => v.available);
      const control = form.get(item.name);

      if (!control) {
        continue;
      }

      if (FormControlType.isControl(item.type)) {
        if (available?.rules) {
          this.applyRules(control, available.rules);
        } else {
          control.clearValidators();
          control.reset();
        }
        continue;
      }

      if (FormControlType.isArray(item.type)) {
        this.initFormArray(this.asFormArray(form, item.name, control), item, data[item.name]);
      }
    }
  }

  /**
   * A schema ARRAY entry may target a property the model declared with
   * `@GV.array()` — already a FormArray, possibly carrying validators that
   * `buildForm` attached — or one declared with `@GV.control()`, which is a
   * plain FormControl. Reuse the former; replace the latter. Replacing
   * unconditionally would silently discard the array's validators.
   */
  private asFormArray(form: UntypedFormGroup, name: string, control: AbstractControl): UntypedFormArray {
    if (control instanceof UntypedFormArray) {
      return control;
    }

    const array = new UntypedFormArray([], control.validator ? [control.validator] : []);
    form.setControl(name, array);
    return array;
  }

  private initFormArray<T>(array: UntypedFormArray, item: GVItemConfig, data?: T[]): void {
    const length = data?.length ?? item.arrayLength ?? 0;
    if (!length || !item.arrayFormGroup) {
      return;
    }

    array.clear();

    for (let index = 0; index < length; index++) {
      const group = this.createFormGroup(item.arrayFormGroup);
      if (data?.[index]) {
        group.patchValue(data[index] as object);
      }
      array.push(group);
    }
  }

  private createFormGroup(schema: GVItemConfig[]): UntypedFormGroup {
    const controls: Record<string, AbstractControl> = {};

    for (const item of schema) {
      const control = new UntypedFormControl(null);
      const available = item.validation?.find((v) => v.available);
      if (available?.rules) {
        this.applyRules(control, available.rules);
      }
      controls[item.name] = control;
    }

    return new UntypedFormGroup(controls);
  }

  private applyRules(control: AbstractControl, rules: GVRules): void {
    const validators = Object.entries(rules)
      .map(([key, value]) => this.toValidator(key, value))
      .filter((fn): fn is ValidatorFn => fn !== null);

    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private toValidator(key: string, value: GVRule | unknown): ValidatorFn | null {
    if (!this.isRule(value)) {
      return this.registry.create(key, value === undefined ? [] : [value]);
    }

    if (value.disabled) {
      return null;
    }

    return this.registry.create(key, value.value === undefined ? [] : [value.value]);
  }

  private isRule(rule: unknown): rule is GVRule {
    return typeof rule === 'object' && rule !== null && 'value' in rule;
  }
}
```

Four v1 problems are gone: the `@ts-ignore` dynamic lookup on `GVDefaultValidators`; `applyRules` returning `undefined` on the falsy-rules path while callers assigned its result; the `getControlMsgs` path that read messages and then discarded them, since messages now flow through `buildMessages`; and the unused `arrayFormGroupModel` parameter that was threaded through three methods and never read.

`setValidators` deliberately replaces rather than merges — that is v1's behaviour, and schema rules are meant to override the model's declaration.

- [ ] **Step 5: Delete nothing**

Deliberately empty. `lib/src/core/schema/` stays until Task 13 — `core/index.ts` re-exports all three of its files and `gv.module.ts` reaches `GVService` through that barrel. Two `GVService` classes coexist meanwhile; only the v1 one is reachable from the barrel, and nothing constructs it.

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(schema): resolve schema rules through the validator registry"
```

---

## Phase 3 — Angular surface

### Task 10: provideGrandValidator and the public barrels

**Files:**
- Create: `lib/src/provide-grand-validator.ts`
- Create: `lib/src/core/registry/error-messages.token.ts`
- Create: `lib/src/provide-grand-validator.spec.ts`
- Barrels are NOT touched here; Task 13 rewrites `lib/src/index.ts` and deletes `lib/src/core/index.ts`
- Delete: nothing (see Global Constraints — Task 13 removes `lib/src/components/`)

**Interfaces:**
- Consumes: `ValidatorRegistry`, `BUILT_IN_VALIDATORS` (Task 4); `GVService` (Task 9).
- Produces:
  - `type ErrorMessages = Record<string, string>`
  - `const GV_ERROR_MESSAGES: InjectionToken<ErrorMessages>`
  - `interface GrandValidatorConfig { messages?: Partial<ErrorMessages>; validators?: ValidatorDefinition[] }`
  - `function provideGrandValidator(config?: GrandValidatorConfig): EnvironmentProviders`

- [ ] **Step 1: Write the failing test**

Create `lib/src/provide-grand-validator.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideGrandValidator } from './provide-grand-validator';
import { GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
import { ValidatorRegistry } from './core/registry/validator-registry';

describe('provideGrandValidator', () => {
  it('provides default messages derived from the registry', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideGrandValidator()],
    });
    const messages = TestBed.inject(GV_ERROR_MESSAGES);
    expect(messages['required']).toBe('Please fill out this mandatory field');
    expect(messages['alphanumericWithSpaces']).toBeDefined();
  });

  it('lets a consumer override one message without losing the rest', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideGrandValidator({ messages: { required: 'Required!' } }),
      ],
    });
    const messages = TestBed.inject(GV_ERROR_MESSAGES);
    expect(messages['required']).toBe('Required!');
    expect(messages['email']).toBe('Provide a valid email address');
  });

  it('registers a consumer validator and its message', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideGrandValidator({
          validators: [
            { name: 'shout', errorKey: 'shout', factory: () => () => null, defaultMessage: 'Shout!' },
          ],
        }),
      ],
    });
    expect(TestBed.inject(ValidatorRegistry).get('shout')).toBeDefined();
    expect(TestBed.inject(GV_ERROR_MESSAGES)['shout']).toBe('Shout!');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — module not found.

- [ ] **Step 3: Create `error-messages.token.ts`**

```ts
import { InjectionToken } from '@angular/core';

export type ErrorMessages = Record<string, string>;

export const GV_ERROR_MESSAGES = new InjectionToken<ErrorMessages>('GV_ERROR_MESSAGES');
```

Leave `lib/src/components/error-message/default-msgs.ts` in place — `gv.module.ts` and the v1 error component both import `GV_DEFAULT_ERROR_MESSAGES` from it, and Task 13 deletes the lot together. For v2, `GV_DEFAULT_ERROR_MESSAGES` is gone: defaults come from `ValidatorRegistry.messages()`, which is what makes drift impossible.

Note the old and new files declare tokens with the same debug NAME but they are distinct `InjectionToken` instances. That is harmless while the v1 tree is unreachable from v2, but it means you must import `GV_ERROR_MESSAGES` from the new path in every v2 file — an import from the old path would compile and then silently fail to resolve at runtime.

- [ ] **Step 4: Create `provide-grand-validator.ts`**

```ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ValidatorRegistry } from './core/registry/validator-registry';
import { ValidatorDefinition } from './core/registry/validator-definition';
import { BUILT_IN_VALIDATORS } from './core/registry/built-in-validators';
import { ErrorMessages, GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
import { GVService } from './schema/gv.service';

export interface GrandValidatorConfig {
  /** Overrides for individual default messages, keyed by error key. */
  readonly messages?: Partial<ErrorMessages>;
  /** Extra validators, usable from both decorators and schema rules. */
  readonly validators?: readonly ValidatorDefinition[];
}

export function provideGrandValidator(config: GrandValidatorConfig = {}): EnvironmentProviders {
  const registry = new ValidatorRegistry([...BUILT_IN_VALIDATORS, ...(config.validators ?? [])]);

  return makeEnvironmentProviders([
    { provide: ValidatorRegistry, useValue: registry },
    { provide: GV_ERROR_MESSAGES, useValue: { ...registry.messages(), ...config.messages } },
    GVService,
  ]);
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add provideGrandValidator replacing GVModule.forRoot"
```

---

### Task 11: Rewrite the error component with signals

**Files:**
- Create: `lib/src/ui/gv-model.directive.ts`
- Create: `lib/src/ui/error-message/error-message.component.ts`
- Create: `lib/src/ui/error-message/error-message.component.spec.ts`
- Delete: nothing (see Global Constraints — Task 13 removes `lib/src/components/`)

**Both implementation files land in this task.** The component injects `GvModelDirective`, so the directive must exist for the component to compile. Task 12 then adds the directive's own spec — the integration test that needs both. Splitting the two implementations across tasks would leave neither buildable alone.

**Interfaces:**
- Consumes: `GV_ERROR_MESSAGES` (Task 10); `selectError` (Task 7); `GvModelDirective` (Task 12 — import it, since the two are mutually referential through DI only).
- Produces: `class GVErrorMessageComponent` (standalone, selector `gv-error-message`) with inputs `name: string` and `control?: AbstractControl`.

**Ordering:** create `gv-model.directive.ts` first (Step 0 below), then the component. The dependency is one-directional — the component injects the directive, never the reverse — so there is no runtime cycle.

- [ ] **Step 0: Create the directive**

Its full source is in Task 12, Step 3. Write that file exactly as given there, then return here. Task 12 adds its spec.

- [ ] **Step 1: Write the failing test**

Create `lib/src/ui/error-message/error-message.component.spec.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GVErrorMessageComponent } from './error-message.component';
import { provideGrandValidator } from '../../provide-grand-validator';
import { minLengthValidator } from '../../validators/min-length/min-length.validator';

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
    // Must be THIS library's validator, not Angular's. Angular's Validators.minLength
    // emits { requiredLength, actualLength }; ours emits { requiredValue, actualValue },
    // and the default message interpolates ours.
    fixture.componentInstance.control.setValidators([minLengthValidator(5)]);
    fixture.componentInstance.control.setValue('ab');
    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(text()).toContain('5');
  });
});
```

The second test is the regression guard the spec calls for: `markAsTouched()` fires no `statusChanges`, so under `OnPush` this only passes if the component listens to `AbstractControl.events`. If it fails, the `events` wiring is wrong — do not paper over it by calling `detectChanges` differently.

For the fourth test to pass, `GV_ERROR_MESSAGES['minlength']` must contain a `{{requiredValue}}` token. Update the `MIN_LENGTH` and `MAX_LENGTH` default messages in `built-in-validators.ts` to `'Must be at least {{requiredValue}} characters'` and `'Must be at most {{requiredValue}} characters'` respectively.

**The token must be `{{requiredValue}}`, matching this library's own validators** (`minLengthValidator` and `maxLengthValidator` both emit `{ requiredValue, actualValue }`). Angular's stock `Validators.minLength` emits `{ requiredLength, actualLength }` instead — a different shape entirely. Writing the default message against Angular's key would leave a literal, un-interpolated `{{requiredLength}}` in front of any consumer using `@GV.minLength()` with the default message, which is why the test must exercise the library's validator rather than Angular's.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlContainer } from '@angular/forms';
import { Observable, of, startWith, switchMap } from 'rxjs';

import { GV_ERROR_MESSAGES } from '../../core/registry/error-messages.token';
import { selectError } from '../../core/builders/select-error';
import { FormMessage } from '../../core/builders/form-message.type';
import { GvModelDirective } from '../gv-model.directive';

interface ControlState {
  readonly errors: Record<string, unknown> | null;
  readonly touched: boolean;
}

@Component({
  selector: 'gv-error-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasControl()) {
      @if (message(); as text) {
        <span class="text-danger">{{ text }}</span>
      }
    } @else {
      <span class="text-danger"><ng-content /></span>
    }
  `,
})
export class GVErrorMessageComponent {
  readonly name = input('');
  readonly control = input<AbstractControl | undefined>(undefined);

  private readonly parent = inject(ControlContainer, { optional: true, host: true, skipSelf: true });
  private readonly group = inject(GvModelDirective, { optional: true, host: true, skipSelf: true });
  private readonly defaults = inject(GV_ERROR_MESSAGES);

  private readonly resolved = computed<AbstractControl | null>(() => {
    const explicit = this.control();
    if (explicit) {
      return explicit;
    }

    const parentControl = this.parent?.control ?? null;
    if (!parentControl) {
      return null;
    }

    const name = this.name();
    return name ? parentControl.get(name) : parentControl;
  });

  /**
   * Driven by AbstractControl.events rather than statusChanges, because the
   * template gates on `touched` and statusChanges never fires on a touch.
   * Under OnPush that difference is the whole ballgame.
   */
  private readonly state = toSignal<ControlState | null>(
    toObservable(this.resolved).pipe(
      switchMap((control): Observable<ControlState | null> => {
        if (!control) {
          return of(null);
        }
        return control.events.pipe(
          startWith(null),
          switchMap(() => of({ errors: control.errors, touched: control.touched })),
        );
      }),
    ),
    { initialValue: null },
  );

  readonly hasControl = computed(() => this.resolved() !== null);

  readonly message = computed<string>(() => {
    const state = this.state();
    if (!state?.touched || !state.errors) {
      return '';
    }

    const overrides = (this.group?.messagesFor(this.name()) ?? {}) as FormMessage;
    const order = this.group?.orderFor(this.name()) ?? [];
    const key = selectError(state.errors, order);
    if (!key) {
      return '';
    }

    const template = (overrides[key] as string | undefined) ?? this.defaults[key] ?? '';
    return interpolate(template, state.errors[key]);
  });
}

function interpolate(template: string, payload: unknown): string {
  if (!template || typeof payload !== 'object' || payload === null) {
    return template;
  }

  return Object.entries(payload as Record<string, unknown>).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}
```

`toSignal` owns the subscription, so v1's manual `Subscription`, `ngOnDestroy`, and `resetSubscription` are all gone. `replaceAll` replaces v1's `replace`, which only substituted the first occurrence of a token.

- [ ] **Step 4: Delete nothing**

Deliberately empty. `lib/src/components/` stays until Task 13 — `lib/src/index.ts` and `gv.module.ts` both import from it. The v1 and v2 error components coexist and share the `gv-error-message` selector, which is safe only because the v1 one is declared in the v1 NgModule and the v2 one is standalone and imported explicitly. Do not import both into the same component.

- [ ] **Step 5: Run the tests**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): rebuild the error component on signals with OnPush"
```

---

### Task 12: Rewrite the directive

**Files:**
- Create: `lib/src/ui/gv-model.directive.spec.ts`
- `lib/src/ui/gv-model.directive.ts` was already created in Task 11 Step 0 — verify it matches Step 3's source below and change it only if it does not
- Delete: nothing (see Global Constraints — Task 13 removes `lib/src/core/directive/`)

**Interfaces:**
- Consumes: `GVModelStatic` (Task 8); `FormMessage` (Task 7).
- Produces: `class GvModelDirective` (standalone, selector `[gvModel]`) with inputs `gvModel?: GVModelStatic` and `gvGroupName: string`, and methods `messagesFor(name: string): FormMessage`, `orderFor(name: string): string[]` (always an array, `[]` when unknown — never `undefined`, since the error component feeds it straight into `selectError`).

- [ ] **Step 1: Write the failing test**

Create `lib/src/ui/gv-model.directive.spec.ts`:

```ts
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
    const directive = fixture.debugElement
      .querySelector('form')!
      .injector.get(GvModelDirective);
    expect(directive.messagesFor('nope')).toEqual({});
  });
});
```

If `fixture.debugElement.querySelector` is unavailable in this Angular version, use `fixture.debugElement.children[0].injector.get(GvModelDirective)` instead.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — module not found.

- [ ] **Step 3: Verify the directive matches this source**

Task 11 Step 0 already created this file from the listing below. Read it and confirm it matches; correct it only if it does not.

```ts
import { Directive, computed, inject, input } from '@angular/core';
import { GVModelStatic } from '../decorators/gv-model';
import { FormMessage } from '../core/builders/form-message.type';

@Directive({
  selector: '[gvModel]',
})
export class GvModelDirective {
  /** Omit only when nesting under a parent [gvModel] with gvGroupName set. */
  readonly gvModel = input<GVModelStatic | undefined>(undefined);
  /** Key into the parent directive's message tree, for nested groups. */
  readonly gvGroupName = input('');

  private readonly parent = inject(GvModelDirective, {
    optional: true,
    host: true,
    skipSelf: true,
  });

  readonly messages = computed<FormMessage>(() => {
    const model = this.gvModel();
    if (model) {
      return model.messages();
    }

    const parentMessages = this.parent?.messages();
    const nested = parentMessages?.[this.gvGroupName()];
    return typeof nested === 'object' && nested !== null ? nested : {};
  });

  /** Error-key order per control, top-most decorator first. */
  readonly order = computed<Record<string, string[]>>(() => this.gvModel()?.order() ?? {});

  messagesFor(name: string): FormMessage {
    const entry = this.messages()[name];
    return typeof entry === 'object' && entry !== null ? entry : {};
  }

  orderFor(name: string): string[] {
    return this.order()[name] ?? [];
  }
}
```

v1 threw from `ngOnInit` when `[GV]` was missing. v2 drops the throw: a missing model now degrades to registry default messages, which is the useful behaviour, and the nested-group fallback — dead code in v1, because `formMsgGroup` was always assigned before the fallback was tested — is now reachable.

- [ ] **Step 4: Delete nothing**

Deliberately empty. `lib/src/core/directive/` stays until Task 13 — `core/index.ts` re-exports it and `gv.module.ts` declares it. The v1 `[GV]` and v2 `[gvModel]` directives have different selectors, so they cannot collide.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, every suite.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): replace [GV] with a signals-based [gvModel] directive"
```

---

## Phase 4 — Surface, tooling, docs

### Task 13: Lock the public API and remove the NgModule

**Files:**
- Rewrite: `lib/src/index.ts`
- Delete: the whole v1 tree — `lib/src/gv.module.ts`, `lib/src/core/index.ts`, `lib/src/core/gv.ts`, `lib/src/core/gv-core.ts`, `lib/src/core/schema/`, `lib/src/core/directive/`, `lib/src/components/`, `lib/src/validators/gv-default-validators.ts`, `lib/src/validators/gv-err-message.ts`
- Create: `lib/src/public-api.spec.ts`

**Interfaces:**
- Consumes: every symbol produced by Tasks 4–12.
- Produces: the final export surface. Nothing after this task adds exports.

- [ ] **Step 1: Write the failing test**

Create `lib/src/public-api.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import * as api from './index';

const EXPECTED = [
  'GV',
  'GVModel',
  'GVService',
  'GVErrorMessageComponent',
  'GvModelDirective',
  'ValidatorRegistry',
  'BUILT_IN_VALIDATORS',
  'GV_ERROR_MESSAGES',
  'provideGrandValidator',
  'FormControlType',
].sort();

describe('public API', () => {
  it('exports exactly the intended surface', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED);
  });

  it('no longer exports the removed v1 symbols', () => {
    for (const removed of ['GVModule', 'GVDefaultValidators', 'GVCore', 'GV_DEFAULT_ERROR_MESSAGES']) {
      expect(removed in api).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` (see Global Constraints: the Angular builder rejects positional filter args)
Expected: FAIL — `GVModule` still exported.

- [ ] **Step 3: Rewrite `lib/src/index.ts`**

```ts
// Decorators and model base
export { GV } from './decorators/gv';
export { GVModel } from './decorators/gv-model';
export type { GVModelStatic } from './decorators/gv-model';

// Bootstrap
export { provideGrandValidator } from './provide-grand-validator';
export type { GrandValidatorConfig } from './provide-grand-validator';

// UI
export { GvModelDirective } from './ui/gv-model.directive';
export { GVErrorMessageComponent } from './ui/error-message/error-message.component';

// Schema
export { GVService } from './schema/gv.service';
export { FormControlType } from './schema/controls.enum';
export type {
  GVItemConfig,
  GVRuleItems,
  GVRules,
  GVRule,
  GVData,
} from './schema/control-validation.interface';

// Extension points
export { ValidatorRegistry } from './core/registry/validator-registry';
export { BUILT_IN_VALIDATORS } from './core/registry/built-in-validators';
export type { ValidatorDefinition } from './core/registry/validator-definition';
export { GV_ERROR_MESSAGES } from './core/registry/error-messages.token';
export type { ErrorMessages } from './core/registry/error-messages.token';
export type { FormMessage } from './core/builders/form-message.type';
```

`export type` is required for the interfaces because `isolatedModules` is on.

- [ ] **Step 4: Delete the entire v1 tree**

Tasks 8–12 were deliberately additive so `npm run build` stayed green while each v1 consumer was replaced one at a time. This step collects every deletion they deferred. After Step 3's barrel rewrite, nothing reaches any of it.

```bash
git rm -r lib/src/core/schema lib/src/core/directive lib/src/components
git rm lib/src/gv.module.ts lib/src/core/index.ts lib/src/core/gv.ts lib/src/core/gv-core.ts
git rm lib/src/validators/gv-default-validators.ts lib/src/validators/gv-err-message.ts
```

`gv-default-validators.ts` is the pass-through layer the `ValidatorRegistry` replaced; `gv-err-message.ts` is the `GVErrMessage` interface only v1's `GV`/`GVCore` used.

Verify nothing dangles before you delete, and again after:

Run: `grep -rn "core/index\|core/gv\|core/schema\|core/directive\|components/\|gv\.module\|GVCore\|IGVModelStatic\|GVDefaultValidators\|GVErrMessage\|GV_DEFAULT_ERROR_MESSAGES" lib/src`
Expected after deletion: no output. If a reference survives, find the consumer that was missed rather than deleting anyway — a dangling import will fail the build, but a stale re-export would silently ship v1 code.

Then confirm the v1 directories are actually gone:

Run: `ls lib/src`
Expected: exactly `core`, `decorators`, `schema`, `ui`, `utils`, `validators`, `index.ts`, `provide-grand-validator.ts`, `public-api.spec.ts` — no `components`, no `gv.module.ts`.

- [ ] **Step 5: Verify nothing dangles**

Run: `npm run build`
Expected: PASS. Then run `npm test` — expected PASS including the two new public-API tests.

Run: `grep -rn "@ts-ignore" lib/src`
Expected: no output. If any remain, fix the underlying type rather than the comment.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat!: remove GVModule and lock the v2 public API"
```

---

### Task 14: ESLint, Prettier, and the formatting pass

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.git-blame-ignore-revs`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Consumes: the finished source tree.
- Produces: `npm run lint` and `npm run format` scripts.

- [ ] **Step 1: Install the tooling**

```bash
npm i -D eslint angular-eslint typescript-eslint prettier
```

- [ ] **Step 2: Create `eslint.config.js`**

```js
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'gv', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'gv', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
```

- [ ] **Step 3: Create `.prettierrc.json`**

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false
}
```

Create `.prettierignore`:

```
dist
coverage
package-lock.json
```

- [ ] **Step 4: Add the scripts**

In `package.json`, add to `scripts`:

```json
    "lint": "eslint .",
    "format": "prettier --write \"lib/**/*.ts\" \"*.{json,js,md}\"",
    "format:check": "prettier --check \"lib/**/*.ts\" \"*.{json,js,md}\""
```

- [ ] **Step 5: Run the linter and fix what it finds**

Run: `npm run lint`
Expected: some findings. Fix them in source. Do not add blanket `eslint-disable` comments; if a rule is genuinely wrong for this codebase, turn it off in `eslint.config.js` with a comment explaining why.

- [ ] **Step 6: Commit the lint setup and fixes separately from formatting**

```bash
git add eslint.config.js .prettierrc.json .prettierignore package.json package-lock.json
git add lib/
git commit -m "chore: add ESLint and Prettier"
```

- [ ] **Step 7: Run the formatting pass as its own commit**

```bash
npm run format
npm test
git add -A
git commit -m "style: normalize formatting to 2-space indentation

Mechanical reformat only. No behaviour change."
```

Run `npm test` before committing — expected PASS.

- [ ] **Step 8: Record the formatting commit for blame**

```bash
git rev-parse HEAD > .git-blame-ignore-revs
git config blame.ignoreRevsFile .git-blame-ignore-revs
git add .git-blame-ignore-revs
git commit -m "chore: ignore the reformat commit in git blame"
```

---

### Task 15: Packaging hygiene

**Files:**
- Modify: `package.json`
- Modify: `lib/package.json`
- Modify: `lib/ng-package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: a publishable `2.0.0` package.

- [ ] **Step 1: Update `lib/package.json`**

Replace it entirely:

```json
{
  "name": "@releasium/ngx-grand-validator",
  "description": "Reactive form validation for Angular, declared with decorators on your models.",
  "version": "2.0.0",
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0"
  },
  "dependencies": {
    "tslib": "^2.8.0"
  },
  "sideEffects": false,
  "engines": {
    "node": "^20.19.0 || ^22.12.0 || >=24.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/releasium/ngx-grand-validator.git"
  },
  "homepage": "https://github.com/releasium/ngx-grand-validator#readme",
  "bugs": {
    "url": "https://github.com/releasium/ngx-grand-validator/issues"
  },
  "license": "MIT",
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "keywords": [
    "angular",
    "validation",
    "reactive forms",
    "form validation",
    "model validation",
    "decorator validation",
    "angular forms",
    "angular reactive forms",
    "form validation decorators",
    "ngx validator"
  ]
}
```

`sideEffects: false` lets bundlers drop unused validators. The keyword list loses its four duplicate and near-duplicate entries (`angular form validation` appeared twice). `provenance: true` requires publishing from a workflow with an OIDC token; since CI is out of scope, **if `npm publish` fails with a provenance error, remove that line** — do not disable other checks to work around it.

- [ ] **Step 2: Update the root `package.json`**

Set `"version": "2.0.0"`. Replace the `scripts` block with:

```json
  "scripts": {
    "ng": "ng",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test --watch=false",
    "lint": "eslint .",
    "format": "prettier --write \"lib/**/*.ts\" \"*.{json,js,md}\"",
    "format:check": "prettier --check \"lib/**/*.ts\" \"*.{json,js,md}\"",
    "prepublishOnly": "npm run lint && npm test && npm run build",
    "release": "npm run build && npm publish ./dist/ngx-grand-validator"
  }
```

Two fixes remain here (the `./node_modules/.bin/` prefix removal already landed in Task 2 Step 0): `publish` is renamed to `release`, because a script literally named `publish` shadows `npm publish` in confusing ways; and it now points at `./dist/ngx-grand-validator`, matching ng-package's actual `dest`. That path bug is why the v1 script published the wrong directory.

Also add:

```json
  "engines": {
    "node": "^20.19.0 || ^22.12.0 || >=24.0.0"
  }
```

If branch B was taken in Task 3, `"test"` stays `"vitest run"`.

- [ ] **Step 3: Verify the packed output**

```bash
npm run build
npm pack ./dist/ngx-grand-validator --dry-run
```

Expected: the listing shows `fesm2022/`, `index.d.ts`, `package.json`, and `README.md`, and **no** `.spec.` files. If specs appear, `lib/tsconfig.lib.json`'s `exclude` is wrong.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "build: correct packaging metadata and the release script for 2.0.0"
```

---

### Task 16: README and MIGRATION.md

**Files:**
- Rewrite: `README.md`
- Create: `MIGRATION.md`
- Modify: `lib/README.md` (make it a copy of the root README so npm shows the right page)

**Interfaces:**
- Consumes: the final public API from Task 13.
- Produces: documentation with no example that fails to compile.

- [ ] **Step 1: Rewrite `README.md`**

Write it against the shipped API. It must contain, in order:

1. Title, one-paragraph description, and the existing banner image link.
2. A compatibility table:

   | @releasium/ngx-grand-validator | Angular |
   |---|---|
   | 2.x | 21 |
   | 1.16.x | 16 |
   | 0.15.x | 15 |
   | 0.14.x | 14 |

3. Install: `npm i @releasium/ngx-grand-validator`
4. A **Requirements** section stating that consumers must have `experimentalDecorators: true` in `tsconfig.json` — Angular's default template sets it, but consumers who removed it will get silent runtime failures.
5. Bootstrap, using the real `provideGrandValidator` signature from Task 10.
6. A model example. **Do not copy v1's example** — it contains `@GV.lastName(5)`, which is not a validator. Use the `User`/`Admin` classes from Task 8's spec, which are known to compile.
7. A template example using `[gvModel]` and `<gv-error-message name="..." />`.
8. A table of every `GV.*` decorator with its signature and default message, generated from `built-in-validators.ts`. Include `alphanumericWithSpaces` as its own row.
9. A "Custom validators" section showing a `ValidatorDefinition` passed through `provideGrandValidator({ validators: [...] })`.
10. A "Schema validation" section covering `GVService`.
11. Contributing and License, carried over from v1.

- [ ] **Step 2: Write `MIGRATION.md`**

It must cover every breaking change, each with a before/after snippet:

- `GVModule.forRoot()` → `provideGrandValidator()`; the module is gone and the directive and component are standalone.
- `[GV]="Model"` → `[gvModel]="Model"`; `formGroupName` input → `gvGroupName`.
- `Model.genUIMsg()` → `Model.messages()`.
- `Model.showUIErrors()` → **removed with no replacement**; call Angular's own `form.markAllAsTouched()`. Unlike v1's version, Angular's marks nested groups recursively, so this is a behaviour improvement as well as a rename.
- `GV.alphanumeric({ whiteSpace: true })` → `GV.alphanumericWithSpaces()`.
- `GV.min(v, msg, ignoreValues)` → `GV.min(v, msg)`; the third parameter was never used.
- `GVDefaultValidators` removed → use `ValidatorRegistry` / `BUILT_IN_VALIDATORS`.
- `GV_DEFAULT_ERROR_MESSAGES` removed → defaults come from the registry; override via `provideGrandValidator({ messages })`.
- `GVCore` and `Model.getUiForm()` removed with no replacement; they were internals.
- **Behaviour change:** the displayed error is now the first in source order with `required` winning, not the last key of `control.errors`. Some fields will show a different message than before. This is the fix for a real bug, not a regression.
- **Behaviour change:** `@GV.cardNumber('custom')` now works. In v1 the message was registered under the wrong key and silently ignored.
- **Behaviour change:** `cardNumber` errors now carry `{}` rather than `null`.
- **Behaviour change:** subclassed models now inherit their parent's validation. v1 silently dropped it, so a subclass that appeared to work was building an incomplete form.
- **Removed feature:** controls are seeded `null`, never from the model's field initializer. That never worked in any v1 release — the decorator read the prototype, where instance fields do not exist — so no working code depends on it. Use `form.patchValue()`.

- [ ] **Step 3: Mirror the README for npm**

```bash
cp README.md lib/README.md
```

ng-packagr copies `lib/README.md` into the published package; without this, npm shows v1 documentation for a v2 package.

- [ ] **Step 4: Verify every code block compiles**

Extract each TypeScript snippet from both documents into a scratch file and typecheck it:

```bash
npx tsc --noEmit --experimentalDecorators --strict --target ES2022 --moduleResolution bundler <scratch-file>
```

Expected: no errors. Fix the docs, not the compiler flags.

- [ ] **Step 5: Final full verification**

```bash
npm run lint
npm test
npm run build
```

Expected: all three PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: rewrite README for v2 and add a migration guide"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: §2 targets → Tasks 1–2; §2.1 versioning → Task 15; §4.3 the five changes → Tasks 4–8; §4.4 registry drift → Task 4; §4.5 latent default-value bug → Task 6 Step 3 and Task 16 Step 2; §5.1 bootstrap → Task 10; §5.4 renames → Tasks 8, 12, 13; §5.5 error priority → Task 7; §6.1 component → Task 11; §6.2 OnPush prerequisite → Task 11 Step 1 (test 2); §6.3 directive → Task 12; §7 testing → Tasks 1, 3, and per-task specs; §8.1–8.2 packaging → Task 15; §8.3 lint → Task 14; §8.4 docs → Task 16; §10 definition of done → Task 13 Step 5 and Task 16 Step 5.

**Known gap.** The spec's §9 risk 3 (Node 20 EOL) is advisory and has no task, correctly — it is a recommendation to the maintainer, not work.

**Type consistency.** `ValidatorDefinition` gained `errorKey` in Task 4 and is used with that field in Tasks 8, 10, and 15. `ModelCtor`, `ControlMetadata`, and `ValidationMetadata` are defined in Task 5 and consumed unchanged in 6, 7, and 8. `FormMessage` moves in Task 7 and is imported from `core/builders/form-message.type` thereafter. `GVModelStatic` is defined in Task 8 and consumed in 9 and 12. `GvModelDirective` exposes `messagesFor` and `orderFor`, both called by the component in Task 11.

**Verification caveat.** Dependencies are not installed in this repository, so no code in this plan has been executed. Signature-level details most likely to need adjustment on first run: the `inject(..., { host: true })` option shape, `AbstractControl.events` emission timing, and whether `angular.configs.tsRecommended` is spelled that way in angular-eslint 21. Treat compiler errors in these three places as expected friction, not as plan failures.
