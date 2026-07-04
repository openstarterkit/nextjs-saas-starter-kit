"use server"

import { signOut } from "@/auth"

// Signs out via POST (CSRF-safe) and redirects home — skipping the unstyled
// Auth.js confirmation page that a plain GET link to /api/auth/signout shows.
export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
