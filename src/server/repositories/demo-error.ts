/**
 * Thrown by `DemoLibraryRepository`'s write methods. A distinct error class
 * lets route handlers tell "demo mode blocked this write" apart from real
 * failures (validation, not-found, provider errors) and respond with a
 * friendly 403 instead of a generic 500.
 */
export class DemoReadOnlyError extends Error {
  constructor(message = "Esta es una demo pública — los cambios no se guardan.") {
    super(message);
    this.name = "DemoReadOnlyError";
  }
}
