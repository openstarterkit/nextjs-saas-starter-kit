import { auth } from "@/auth"
import { toNextJsHandler } from "better-auth/next-js"

// The folder name is part of the contract: Better Auth serves every one of its
// routes under /api/auth, so the catch-all has to catch all of them. It used to
// be [...nextauth]; the rename is the one file move this upgrade needs.
export const { GET, POST } = toNextJsHandler(auth)
