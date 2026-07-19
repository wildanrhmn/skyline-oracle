"use client";
/**
 * Stub provider — nothing currently needs a client context. Kept so the app
 * router has a place to slot in wallet / connection providers if we add a
 * real interactive flow later (e.g. "sponsor an update").
 */
export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
