# Example App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-only Angular 21 application under `example/` that consumes `@releasium/ngx-grand-validator` from the built `dist/` output and mirrors the README's Getting Started and Schema sections.

**Architecture:** A self-contained Angular workspace inside the gitignored `example/` directory — its own `angular.json` and tsconfig, no `package.json`, sharing the root `node_modules` through ordinary Node resolution. The library resolves through a tsconfig `paths` mapping to `../dist/ngx-grand-validator`, so the app exercises the real FESM bundle and `.d.ts`. One standalone root component renders two forms: the README's decorator-driven `Admin` model and its schema-driven `Signup` model.

**Tech Stack:** Angular 21.2.22 (`@angular/build:application`), TypeScript 5.9, zoneless change detection (`zone.js` is not installed), reactive forms.

## Global Constraints

Copied from the spec. Every task's requirements include this section.

- **Nothing outside `example/` may change.** Root `angular.json`, `package.json`, `tsconfig.json`, `.gitignore` are untouched. `/example/` stays in `.gitignore`. After every task, `git status --short` must print nothing.
- **No commits.** `example/` is gitignored, so there is nothing to commit. Each task ends with a build/serve verification and a clean-status check instead of a commit. Reviewers must read the working tree at the listed paths; there is no diff.
- **No `example/package.json` and no `example/node_modules`** unless the Task 1 spike proves the CLI refuses to run without one. The fallback manifest is exactly `{ "name": "example", "private": true }` with no dependencies and no lockfile.
- **Library resolves ONLY via the `paths` mapping** `"@releasium/ngx-grand-validator": ["../dist/ngx-grand-validator"]`. Never import from `../lib/src`.
- **`experimentalDecorators: true`** in `example/tsconfig.json` — a consumer requirement, demonstrated deliberately.
- **Zoneless.** `polyfills: []` in `angular.json`; `provideZonelessChangeDetection()` in `main.ts`. Do not add `zone.js`.
- **Run from inside `example/`:** `npm run build` at the root first (populates `dist/`), then `cd example && npx ng build` / `npx ng serve`. `ng` resolves the nearest `angular.json` upward from the working directory.
- Indentation is 2 spaces; single quotes in TypeScript.
- Environment: Node 20.20.0 (machine default, do not switch), npm 10.8.2, Windows. `npx ng` from `example/` resolves the root-installed CLI.
- Models and templates mirror the README (`README.md`, sections "Getting started" and "Schema validation") verbatim except where this plan says otherwise.

---

## File Structure

```
example/                       gitignored — root untouched
  angular.json                 one application project: build + serve targets
  tsconfig.json                standalone; paths → ../dist; experimentalDecorators
  tsconfig.app.json            files/include for the app build
  src/
    index.html                 <app-root>, <base href="/">
    main.ts                    bootstrapApplication + providers
    styles.css                 red error text, field spacing, two-column layout
    app/
      app.ts                   root standalone component: both forms
      user.model.ts            README's User + Admin (decorator path)
      signup.model.ts          README's Signup + GVItemConfig[] schema (schema path)
```

Task 1 creates the workspace and proves the CLI runs from it (the spike). Task 2 adds library resolution and the decorator form. Task 3 adds the schema form. Each task ends with a passing `npx ng build` and a clean `git status`.

---

### Task 1: Workspace scaffold and CLI spike

**Files:**
- Create: `example/angular.json`
- Create: `example/tsconfig.json`
- Create: `example/tsconfig.app.json`
- Create: `example/src/index.html`
- Create: `example/src/main.ts`
- Create: `example/src/styles.css`
- Create: `example/src/app/app.ts`

**Interfaces:**
- Produces: a buildable Angular workspace at `example/` whose `tsconfig.json` already carries the `paths` mapping and `experimentalDecorators`, so Task 2 only adds source files. Root component class is `App`, selector `app-root`.

This task is the spike from spec §3.1: it establishes whether Angular CLI will run in a directory that has `angular.json` but no `package.json`, resolving `@angular/build` from the parent's `node_modules`. The app it builds is a placeholder with no library import — resolution of the library is Task 2's job, and keeping the two separate means a failure here is unambiguously a workspace problem, not a `paths` problem.

- [ ] **Step 1: Confirm the preconditions**

Run from the repo root:

```bash
git status --short && ls dist/ngx-grand-validator && grep -n "^/example/$" .gitignore
```

Expected: empty status; `README.md fesm2022 package.json types`; `.gitignore` line `47:/example/` (the line number may differ; the entry must exist). If `dist/` is missing, run `npm run build` first.

- [ ] **Step 2: Create `example/angular.json`**

```json
{
  "$schema": "../node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "analytics": false
  },
  "projects": {
    "example": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "polyfills": [],
            "styles": ["src/styles.css"]
          },
          "configurations": {
            "development": {
              "optimization": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "development"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "buildTarget": "example:build"
          }
        }
      }
    }
  }
}
```

`polyfills: []` is explicit even though it is the builder's default: it is the line a reader looks for to confirm there is no `zone.js`. `outputPath: "dist"` lands at `example/dist/`, which is inside the gitignored directory. `defaultConfiguration: "development"` keeps `npx ng build` unminified so a failing build reads clearly.

- [ ] **Step 3: Create `example/tsconfig.json`**

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
    "target": "ES2022",
    "module": "preserve",
    "paths": {
      "@releasium/ngx-grand-validator": ["../dist/ngx-grand-validator"]
    }
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

This is Angular 21's own `ng new` tsconfig plus the `paths` mapping. `module: "preserve"` implies bundler-style resolution, which honours the dist package's `exports` map when resolving the mapped directory — so the mapping tests the same thing `npm install` would. The `paths` entry is present from Task 1 even though nothing imports the library yet; that keeps Task 2 additive.

- [ ] **Step 4: Create `example/tsconfig.app.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

- [ ] **Step 5: Create `example/src/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ngx-grand-validator example</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

- [ ] **Step 6: Create `example/src/styles.css`**

```css
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  color: #222;
}

main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 64rem;
}

label {
  display: block;
  margin: 0.75rem 0 0.25rem;
  font-weight: 600;
}

input {
  padding: 0.4rem;
  width: 100%;
  box-sizing: border-box;
}

gv-error-message {
  display: block;
  min-height: 1.25rem;
  color: #b00020;
  font-size: 0.875rem;
}

pre {
  background: #f4f4f4;
  padding: 0.75rem;
  font-size: 0.8rem;
}
```

`gv-error-message { display: block; min-height }` reserves a line under every field so the layout does not jump when a message appears — which also makes it obvious when a message that *should* appear does not.

- [ ] **Step 7: Create a placeholder `example/src/app/app.ts`**

No library import yet. This exists only to prove the workspace builds.

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<h1>ngx-grand-validator example</h1>`,
})
export class App {}
```

- [ ] **Step 8: Create `example/src/main.ts`**

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
}).catch((err: unknown) => console.error(err));
```

- [ ] **Step 9: Run the spike — build from inside `example/`**

```bash
cd example && npx ng build
```

Expected: the build completes and `example/dist/browser/index.html` exists. Two outcomes are possible and both are acceptable results of the spike:

**Outcome A — it builds.** The CLI ran from a package.json-less workspace. Continue to Step 10.

**Outcome B — the CLI refuses**, typically with a message about not finding a workspace root or `package.json`, or about locating `@angular/build`. Apply the spec's fallback and nothing more:

```bash
printf '{ "name": "example", "private": true }\n' > package.json
npx ng build
```

Do not run `npm install` inside `example/`, do not add dependencies to that manifest, and do not create a lockfile. If the build still fails, STOP and report the exact error rather than working around it — that would mean the shared-`node_modules` design itself does not hold on this toolchain.

Record which outcome occurred; Tasks 2 and 3 do not care, but the spec's §3.1 does.

- [ ] **Step 10: Serve and eyeball it**

```bash
npx ng serve
```

Expected: a URL is printed (default `http://localhost:4200/`), and opening it renders the `<h1>`. Stop the server (Ctrl+C).

- [ ] **Step 11: Verify nothing outside `example/` changed**

Run from the repo root:

```bash
cd .. && git status --short
```

Expected: no output. If `example/` or anything under it appears, the gitignore entry is not matching — stop and investigate; do not add a second ignore rule.

---

### Task 2: Library resolution and the decorator form

**Files:**
- Create: `example/src/app/user.model.ts`
- Modify: `example/src/app/app.ts` (replace the placeholder)
- Modify: `example/src/main.ts` (add `provideGrandValidator`)

**Interfaces:**
- Consumes: from `@releasium/ngx-grand-validator` (resolved via `paths`): `GV`, `GVModel`, `provideGrandValidator`, `GvModelDirective`, `GVErrorMessageComponent`.
- Produces: `App` with a `protected readonly Admin = Admin` and `protected readonly userForm = Admin.createForm()`; template structure that Task 3 extends with a second `<section>`.

This task is the first import of the library through the `paths` mapping, so a failure here is a packaging or resolution failure — the thing the example exists to catch.

- [ ] **Step 1: Create `example/src/app/user.model.ts`**

The README's model verbatim.

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

- [ ] **Step 2: Prove the import resolves before writing any UI**

Temporarily add one line to `example/src/main.ts`, directly under the existing imports:

```ts
import { Admin } from './app/user.model';
console.log('Admin controls:', Object.keys(Admin.createForm().controls));
```

Run from `example/`:

```bash
npx ng build
```

Expected: builds cleanly. This is the moment the `paths` mapping, the dist's `exports` map, its `.d.ts`, and `experimentalDecorators` are all exercised at once. If it fails with a module-resolution error, check `tsconfig.json`'s `paths` and that `../dist/ngx-grand-validator/package.json` exists; do not fall back to importing from `../lib/src`.

Then `npx ng serve`, open the page, and check the browser console. Expected: `Admin controls: ['firstName', 'email', 'paymentCard', 'accessLevel']` (order may vary). All four must be present — `accessLevel` present proves subclass inheritance works through the packaged build.

Remove both temporary lines from `main.ts` before continuing.

- [ ] **Step 3: Update `example/src/main.ts` with the library provider**

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideGrandValidator } from '@releasium/ngx-grand-validator';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    provideGrandValidator({
      // One override, to prove consumer messages merge over registry defaults
      // rather than replacing them.
      messages: { required: 'This field is required' },
    }),
  ],
}).catch((err: unknown) => console.error(err));
```

- [ ] **Step 4: Replace `example/src/app/app.ts` with the decorator form**

```ts
import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GvModelDirective, GVErrorMessageComponent } from '@releasium/ngx-grand-validator';
import { Admin } from './user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, GvModelDirective, GVErrorMessageComponent],
  template: `
    <h1>ngx-grand-validator example</h1>
    <main>
      <section>
        <h2>Decorator model</h2>
        <p>
          Built from <code>Admin.createForm()</code>. <code>Admin</code> extends
          <code>User</code>, so all four fields appear.
        </p>

        <form [gvModel]="Admin" [formGroup]="userForm" (ngSubmit)="userForm.markAllAsTouched()">
          <label for="firstName">First name</label>
          <input id="firstName" formControlName="firstName" />
          <gv-error-message name="firstName" />

          <label for="email">Email</label>
          <input id="email" formControlName="email" />
          <gv-error-message name="email" />

          <label for="paymentCard">Payment card</label>
          <input id="paymentCard" formControlName="paymentCard" />
          <gv-error-message name="paymentCard" />

          <label for="accessLevel">Access level</label>
          <input id="accessLevel" formControlName="accessLevel" type="number" />
          <gv-error-message name="accessLevel" />

          <p><button type="submit">Submit</button></p>
        </form>

        <pre>valid: {{ userForm.valid }}
{{ userForm.value | json }}</pre>
      </section>
    </main>
  `,
})
export class App {
  protected readonly Admin = Admin;
  protected readonly userForm = Admin.createForm();
}
```

Two deliberate departures from the README snippet, both explained here so a reader does not "fix" them back:

- Submit uses `(ngSubmit)` on the form rather than `(click)` on the button. Pressing Enter in a field then also reveals errors, which is how a real form behaves; the README's `(click)` form is shorter for a doc but slightly worse UX.
- The `<pre>` readout is not in the README. It makes `form.valid` and the live value visible, which is what turns this page into a smoke test rather than a static demo.

- [ ] **Step 5: Build**

```bash
npx ng build
```

Expected: clean build.

- [ ] **Step 6: Serve and walk the spec's §4.4 table**

```bash
npx ng serve
```

Open the page and check each row. Every one must hold:

| Do | Expect | Proves |
|---|---|---|
| Click into **First name**, then click out without typing | `This field is required` | consumer override merged over the registry default (the default text is *Please fill out this mandatory field*) |
| Type `a` into First name | `Must be at least 2 characters` | `{{requiredValue}}` interpolation from the built bundle |
| Type `1234` into Payment card and click out | `Enter a valid card number` | custom decorator message — v1 silently ignored this one |
| Clear everything, press **Submit** | First name, Email and Access level show `This field is required`; Payment card shows nothing; `valid: false` | `required` wins the error-priority rule; `markAllAsTouched` reached every control. Payment card carries only `@GV.cardNumber()`, and every validator except `required` passes an empty value by design |
| Count the inputs | four, including **Access level** | subclass inheritance through the packaged build |
| Fill all four validly (`Ann`, `ann@example.com`, `4242424242424242`, `1`) | every message clears; `valid: true` | messages clear on VALID; zoneless change detection re-rendered without zone.js |

If a message fails to appear on blur but appears after another keystroke, the `AbstractControl.events` wiring is not reaching the component through the built bundle — that is a library bug worth reporting, not something to paper over in the example.

Stop the server.

- [ ] **Step 7: Verify nothing outside `example/` changed**

```bash
cd .. && git status --short
```

Expected: no output.

---

### Task 3: Schema form

**Files:**
- Create: `example/src/app/signup.model.ts`
- Modify: `example/src/app/app.ts` (add the second section)

**Interfaces:**
- Consumes: from `@releasium/ngx-grand-validator`: `GV`, `GVModel`, `GVService`, `FormControlType`, `GVItemConfig`. From Task 2: `App`'s existing template and the `userForm` field.
- Produces: nothing downstream; this is the last task.

- [ ] **Step 1: Create `example/src/app/signup.model.ts`**

The README's Schema section, with the schema moved beside the model so the component stays about rendering.

```ts
import { GV, GVModel, FormControlType, GVItemConfig } from '@releasium/ngx-grand-validator';

export class Signup extends GVModel {
  @GV.control()
  nickname!: string;
}

/**
 * Rules applied at runtime on top of the model. In a real app this would
 * typically arrive from a backend; here it is a constant so the page is
 * self-contained. `minLength` resolves through the same ValidatorRegistry
 * the decorators use.
 */
export const SIGNUP_SCHEMA: GVItemConfig[] = [
  {
    name: 'nickname',
    type: FormControlType.CONTROL,
    validation: [{ available: true, rules: { minLength: 4 } }],
  },
];
```

- [ ] **Step 2: Add the schema section to `example/src/app/app.ts`**

Change the imports at the top of the file to:

```ts
import { Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  GvModelDirective,
  GVErrorMessageComponent,
  GVService,
} from '@releasium/ngx-grand-validator';
import { Admin } from './user.model';
import { Signup, SIGNUP_SCHEMA } from './signup.model';
```

Inside the template, immediately after the closing `</section>` of the decorator form and before `</main>`, add:

```html
      <section>
        <h2>Schema validation</h2>
        <p>
          Built from <code>GVService.createForm(Signup, SIGNUP_SCHEMA)</code>. The model declares
          <code>nickname</code> with no rules; the schema adds <code>minLength: 4</code> at runtime.
        </p>

        <form [gvModel]="Signup" [formGroup]="signupForm" (ngSubmit)="signupForm.markAllAsTouched()">
          <label for="nickname">Nickname</label>
          <input id="nickname" formControlName="nickname" />
          <gv-error-message name="nickname" />

          <p><button type="submit">Submit</button></p>
        </form>

        <pre>valid: {{ signupForm.valid }}
{{ signupForm.value | json }}</pre>
      </section>
```

And change the class body to:

```ts
export class App {
  private readonly gv = inject(GVService);

  protected readonly Admin = Admin;
  protected readonly userForm = Admin.createForm();

  protected readonly Signup = Signup;
  protected readonly signupForm = this.gv.createForm(Signup, SIGNUP_SCHEMA);
}
```

`[gvModel]="Signup"` on the schema form is not strictly needed for messages — `Signup` declares none — but it is how a consumer would wire it, and it keeps both forms structurally identical for a reader comparing them.

- [ ] **Step 3: Build**

```bash
npx ng build
```

Expected: clean build. `GVService` is injectable only because `provideGrandValidator()` provided it in `main.ts`; a `NullInjectorError` here means Task 2 Step 3 was not applied.

- [ ] **Step 4: Serve and verify the schema path**

```bash
npx ng serve
```

| Do | Expect | Proves |
|---|---|---|
| Type `abc` into Nickname and click out | `Must be at least 4 characters` | a schema rule resolved through the registry, using the built-in default message with interpolation |
| Type `abcd` | message clears; `valid: true` | the schema-applied validator is a normal Angular validator |
| Clear it, press Submit | no message; `valid: true` | the schema added `minLength` only — no `required` — and an empty value passes `minLength` by design |

The last row is worth understanding rather than "fixing": this library's validators bail out on empty values so that only `@GV.required()` rejects them. An empty nickname is valid here because nobody asked for it to be required.

Stop the server.

- [ ] **Step 5: Final verification — both forms, clean tree**

Run the full Task 2 Step 6 table again against the served page to confirm the second section did not disturb the first, then:

```bash
cd .. && git status --short
```

Expected: no output. The example is complete and entirely local.

---

## Self-Review

**Spec coverage.**
- §1 purpose (packaged artifact, consumer tsconfig, rendered page) — Task 1 workspace, Task 2 Step 2 resolution proof, Task 2/3 serve tables. ✓
- §2.1 `paths` → dist, never `lib/src` — Task 1 Step 3, Global Constraints, Task 2 Step 2. ✓
- §2.2 minimal, two forms, no chrome — Tasks 2 and 3. ✓
- §2.3 local-only, root untouched, gitignore unchanged — Global Constraints; every task ends with a clean-status check. ✓
- §2.4 zoneless — Task 1 Step 2 `polyfills: []`, Step 8 provider. ✓
- §3 layout — File Structure matches the spec tree exactly. ✓
- §3.1 spike + fallback — Task 1 Step 9, both outcomes. ✓
- §4.1 `main.ts` with one override — Task 2 Step 3. ✓
- §4.2 `Admin` form, inheritance proof — Task 2 Steps 1, 2, 6. ✓
- §4.3 `Signup` + schema — Task 3 Step 1. ✓
- §4.4 interaction table — Task 2 Step 6 (all five rows) and Task 3 Step 4. ✓
- §4.5 styles — Task 1 Step 6. ✓
- §5 definition of done — Task 3 Step 5 plus each task's build/serve/status checks. ✓

**Placeholders.** None. Every file's full content is in the plan.

**Type consistency.** `App`, `userForm`, `signupForm`, `Admin`, `Signup`, `SIGNUP_SCHEMA` are used with the same names and shapes across Tasks 1–3. `provideZonelessChangeDetection` is the name the repo's own passing specs import. `FormControlType.CONTROL`, `GVItemConfig`, `GVService.createForm(model, schema)` match `lib/src/index.ts` and the README.

**One note for the executor.** Because nothing is committed, subagent-driven-development's diff-based review has no diff to package. Reviewers for this plan must read the files at the listed paths in the working tree and run the build themselves. That is a known consequence of the local-only decision, not an oversight.
