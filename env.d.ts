/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Reviews backend (optional; falls back to the built-in public values) */
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
}
