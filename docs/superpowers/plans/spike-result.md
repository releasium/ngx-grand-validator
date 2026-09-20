# Spike result: BUILDER

`@angular/build:unit-test` accepts the ng-packagr library target.
Task 3 follows branch A.

## Evidence

The builder was invoked as `@angular/build:unit-test` against the `ngx-grand-validator`
library project (`projectType: "library"`, `build` target `@angular/build:ng-packagr`).
It resolved the default `buildTarget` (the project's own `build` target) without
complaint, discovered all 13 `*.spec.ts` files via the configured `include` glob, and
proceeded into esbuild-based bundling/type-checking of those files. It never emitted
any error about the build target, the application builder, or an unsupported project
type — the only failures are TypeScript compile errors, which is the expected/allowed
outcome per the spike's own decision rule.

All 197 reported errors trace to two known, pre-existing causes unrelated to the
question this spike answers (both are Task 3's job to fix, not this spike's):

1. `tsconfig.spec.json` still has `"types": ["jasmine"]`, but `@types/jasmine` was
   removed from `devDependencies` per Step 1 of the brief. With no Jasmine type
   definitions in the program, `describe`/`it`/`expect`/`beforeEach` are all
   undeclared globals (`TS2593`/`TS2304`), which is exactly the "13 Jasmine specs
   may fail" outcome the brief said to expect and not fix.
2. `tsconfig.spec.json`'s stale `"files": ["./test.ts", "polyfills.ts"]` entry (a
   leftover Karma test-bootstrap pattern) pulls `test.ts` into the TS program, which
   imports `@angular/platform-browser-dynamic/testing` — a package intentionally
   removed from `dependencies` per Step 1 — producing `TS2307` module-not-found
   errors.

Command output (relevant excerpt, full log is longer):

```
X [ERROR] TS2688: Cannot find type definition file for 'jasmine'.
  The file is in the program because:
    Entry point of type library 'jasmine' specified in compilerOptions [plugin angular-compiler]

X [ERROR] TS2593: Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig. [plugin angular-compiler]

    lib/src/validators/alphanumeric/alphanumeric.spec.ts:4:0:
      4 │ describe('Alphanumeric Validator', () => {
        ╵ ~~~~~~~~

X [ERROR] TS2304: Cannot find name 'expect'. [plugin angular-compiler]

    lib/src/validators/alphanumeric/alphanumeric.spec.ts:10:4:
      10 │     expect(result).toBeNull();
         ╵     ~~~~~~

... (repeats for all 13 spec files: alphanumeric, card-number, digit, email, equals,
    exact-length, integer, max, max-length, min, min-length, pattern, required)

X [ERROR] TS2307: Cannot find module '@angular/core/testing' or its corresponding type declarations. [plugin angular-compiler]

    test.ts:4:27:
      4 │ import { getTestBed } from '@angular/core/testing';
        ╵                            ~~~~~~~~~~~~~~~~~~~~~~~

X [ERROR] TS2307: Cannot find module '@angular/platform-browser-dynamic/testing' or its corresponding type declarations. [plugin angular-compiler]

    test.ts:8:7:
      8 │ } from '@angular/platform-browser-dynamic/testing';
        ╵        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

Note: no error in the entire run mentions the build target, the ng-packagr project
type, or an application-builder requirement. Full output is captured in
`.superpowers/sdd/2026-08-30-ngx-grand-validator-v2/task-1-report.md`.

## Config corrections applied beyond the brief's literal JSON (version drift, not workarounds)

Two mechanical corrections were required in `angular.json`'s `test` target to get the
builder past its own options-schema validation and file-discovery step, before it
could even attempt to answer the buildTarget question. Neither touches the
build-target/library-target question under test, and neither invents an application
project, a hand-written `vitest.config.ts`, or AnalogJS:

- `"browsers": []` fails this version's options schema (`minItems: 1`). Per the
  schema's own documentation ("When not specified, tests are run in a Node.js
  environment using jsdom"), the key was omitted entirely rather than set to `[]`.
- `"include": ["lib/**/*.spec.ts"]` resolved to zero files. The unit-test builder's
  `findTests` resolves `include` globs relative to the project's `sourceRoot`
  (`lib/src`), not the project root (`lib`) or the workspace root. It was changed to
  `"include": ["**/*.spec.ts"]`, which correctly matches the 13 existing spec files
  under `lib/src/**`.
