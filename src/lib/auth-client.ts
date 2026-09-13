import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields, magicLinkClient, twoFactorClient } from "better-auth/client/plugins"
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
 *
 * The two-factor plugin is here for the same reason, and the kit itself does
 * not call it: sign-in, setup and verification all run through server actions
 * (src/app/actions/two-factor.ts), the way the rest of authentication does, so
 * no secret and no code is ever handled in the browser. It is registered so
 * that a clone building a client-side flow has `authClient.twoFactor.*` and
 * its types without editing this file.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), twoFactorClient(), inferAdditionalFields<typeof auth>()],
})

export const { signIn, signOut, signUp, useSession } = authClient
