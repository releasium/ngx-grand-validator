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
