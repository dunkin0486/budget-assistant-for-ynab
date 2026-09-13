// Stub for the "cloudflare:workers" virtual module, which only exists
// inside the real Workers runtime. @cloudflare/workers-oauth-provider
// imports WorkerEntrypoint from it unconditionally at module scope (for
// its OAuthProvider class, which oauth-handler.ts never uses -- it only
// imports AuthorizationError and a type), so plain Node/Vitest can't load
// that module without this alias (see vitest.config.ts). Never bundled
// into the deployed Worker -- nothing outside test/ imports this.
export class WorkerEntrypoint {}
