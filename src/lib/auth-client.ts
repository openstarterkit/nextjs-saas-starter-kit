import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins"
import type { auth } from "@/auth"

/**
 * The browser half of authentication.
 *
 * Auth.js exposed `signIn` and `signOut` from the same module the server used;
 * Better Auth splits them, so anything running in the browser imports from
 * here and anything running on the server keeps using `auth.api.*`.
 *
 * `inferAdditionalFields` is what carries `role` into the client's types: it
 * reads the server instance's type, not its value, so nothing from src/auth.ts
 * is bundled into the browser.
 *
 * The magic link plugin is registered unconditionally, unlike its server half,
 * which only loads when RESEND_API_KEY is set. A client plugin only adds
 * methods: registering it when the server has not costs nothing, and the sign
 * in form is hidden by the same env check anyway.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), inferAdditionalFields<typeof auth>()],
})

export const { signIn, signOut, signUp, useSession } = authClient
