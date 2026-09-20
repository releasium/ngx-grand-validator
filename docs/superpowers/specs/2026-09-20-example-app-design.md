# Example app — Design

**Date:** 2026-09-20
**Status:** Approved
**Scope:** A minimal, local-only Angular application under `example/` that consumes `@releasium/ngx-grand-validator` from the built `dist/` output and mirrors the README's documented usage.

**This document is the durable record.** `example/` is gitignored by decision (§2.3), so it does not survive a fresh clone. This spec carries enough detail to recreate it.

---

## 1. Purpose

The library's 146 unit tests run against `lib/src`. They cannot show that the *packaged* artifact works from a consumer's position: the `exports` map, `.d.ts` resolution, `experimentalDecorators` in a consumer tsconfig, and the standalone directive and component actually rendering in a served page. The example closes that gap and doubles as a copyable reference for the README's Getting Started and Schema sections.

### Non-goals

- A documentation site (routing, nav, about page). The deleted 2022 `example/` was one; this is not.
- Coverage of every validator or feature. Only what the README's usage sections show.
- Automated tests inside `example/`. The unit suite in `lib/` owns correctness; this is a manual smoke check.
- Any change to root `angular.json`, `package.json`, `tsconfig.json`, or `.gitignore`.

---

## 2. Decisions

### 2.1 Resolves the library from `dist/`, via a `paths` mapping

`example/tsconfig.json` maps `@releasium/ngx-grand-validator` to `../dist/ngx-grand-validator`. The example therefore imports the real FESM bundle and `.d.ts` — the same files `npm publish` ships. Importing from `lib/src` was rejected because it proves nothing about packaging, which is exactly where library bugs hide. Installing the dist as a `file:` dependency was rejected because every library rebuild would need a reinstall.

### 2.2 Minimal demo mirroring the README

One page, two forms, no chrome. Rejected alternatives: a demo of every documented feature (larger surface to keep in sync), and a documentation site (most effort goes to site chrome, not library demonstration).

### 2.3 Local-only; `/example/` stays in `.gitignore`

The maintainer chose not to commit the example. Consequence: nothing committed may reference `example/`, or a fresh clone would carry a dangling reference. This forces §3's self-contained layout.

### 2.4 Zoneless

`zone.js` is not installed in this workspace. The app bootstraps with `provideZonelessChangeDetection()`. This is a live demonstration of the v2 claim that the error component works without zone.js, not a workaround.

---

## 3. Layout

```
example/                       gitignored; root files untouched
  angular.json                 one application project, @angular/build:application
  tsconfig.json                standalone (extends nothing); paths → ../dist; experimentalDecorators: true
  tsconfig.app.json
  src/
    index.html
    main.ts                    bootstrapApplication + providers
    styles.css                 ~5 lines: red error text, spacing
    app/
      app.ts                   root standalone component, two forms
      user.model.ts            README's User / Admin model
      signup.model.ts          README's Signup model + schema
```

**No `example/package.json` and no `example/node_modules`.** Node resolution walks up the tree, so the example shares the root install. `ng` picks the nearest `angular.json` upward from the working directory, so run from inside `example/`:

```bash
npm run build && cd example && npx ng serve
```

**`experimentalDecorators: true` is set in the example tsconfig deliberately.** Every consumer must set it, and this is the first place in the repo that proves the library works under a consumer's tsconfig rather than its own.

### 3.1 Spike before building

Angular CLI running in a directory with `angular.json` but no `package.json`, resolving `@angular/build` from the parent `node_modules`, is expected to work but is unverified on this toolchain. Verify with a bare `npx ng version` from inside `example/` before writing any app code.

**Fallback if the CLI refuses:** a two-line `example/package.json` — `{ "name": "example", "private": true }` — with no dependencies and no lockfile. It still shares the root install and still changes nothing at the root.

---

## 4. Contents

### 4.1 `main.ts`

```ts
bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    provideGrandValidator({
      messages: { required: 'This field is required' },
    }),
  ],
});
```

The single message override exists to prove that consumer overrides merge on top of registry defaults rather than replacing them.

### 4.2 `user.model.ts`

The README's model verbatim: `User extends GVModel` with `firstName` (`required`, `minLength(2)`, `maxLength(50)`), `email` (`required`, `email`), `paymentCard` (`cardNumber('Enter a valid card number')`); and `Admin extends User` adding `accessLevel` (`required`).

**The form is built from `Admin`, not `User`.** Subclass inheritance was a shipped v1 bug (own-property-only metadata lookup). If `accessLevel` does not appear as a control, the bug has returned.

### 4.3 `signup.model.ts`

The README's Schema section verbatim: `Signup extends GVModel` with `nickname` declared via `@GV.control()`, and a `GVItemConfig[]` applying `minLength: 4` to it through `FormControlType.CONTROL`.

### 4.4 `app.ts`

One standalone root component importing `ReactiveFormsModule`, `GvModelDirective`, `GVErrorMessageComponent`. Two forms:

**Decorator form.** `form = Admin.createForm()`. Template: `<form [gvModel]="Admin" [formGroup]="form">`, one `<input formControlName>` + `<gv-error-message name>` pair per field, a Submit button that calls `form.markAllAsTouched()`, and a `<pre>` showing `form.value` and `form.valid` live.

What each interaction demonstrates:

| Interaction | Proves |
|---|---|
| Touch empty `firstName` → "This field is required" | consumer override merged over defaults |
| Type `a` → "Must be at least 2 characters" | `{{requiredValue}}` interpolation |
| Type `1234` into `paymentCard` (fails Luhn) → "Enter a valid card number" | custom decorator message (v1 silently ignored it) |
| Submit empty → `firstName`, `email`, `accessLevel` show `required`; `paymentCard` shows nothing | `required` always wins the error-priority rule; `markAllAsTouched` recursion. `paymentCard` carries only `@GV.cardNumber()`, and every validator except `required` passes an empty value by design |
| Four fields rendered | subclass inheritance |

**Schema form.** `inject(GVService).createForm(Signup, schema)`. One input, one `<gv-error-message>`, one live value readout. Typing three characters shows the `minlength` default message, proving schema rules resolve through the registry.

### 4.5 `styles.css`

Minimal: red text for `gv-error-message`, spacing between fields, two-column layout for the forms. Nothing that obscures what the library renders.

---

## 5. Definition of done

1. `npm run build` then `cd example && npx ng build` succeeds — the dist resolves through `paths`, its `.d.ts` typechecks under a consumer tsconfig with `experimentalDecorators`, and the standalone directive/component compile into an application.
2. `npx ng serve` renders both forms, and every row of the §4.4 table behaves as stated.
3. `git status` is clean afterwards. Nothing outside `example/` changed.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| CLI refuses a workspace with no `package.json` | §3.1 spike first; two-line fallback manifest |
| `dist/` stale relative to `lib/src` | The run command starts with `npm run build`; document that the example reflects the last build, not the source |
| Example rots against the library unnoticed | Accepted consequence of §2.3. Mitigated by this spec being enough to recreate it, and by the README examples already being compiler-verified in the library's own suite |
