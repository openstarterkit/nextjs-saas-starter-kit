import { describe, it, expect, vi, beforeEach } from "vitest"

const session = vi.fn()
const redirect = vi.fn((path: string) => {
  // The real one throws to halt rendering, and code after it must never run.
  throw new Error(`REDIRECT:${path}`)
})

vi.mock("@/auth", () => ({ auth: () => session() }))
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }))

const { getCurrentUser, requireUser, isSignedIn } = await import("./index")

const signedIn = (user: Record<string, unknown>) => session.mockResolvedValue({ user })

beforeEach(() => {
  session.mockReset()
  redirect.mockClear()
})

describe("getCurrentUser", () => {
  it("returns the user of a live session", async () => {
    signedIn({ id: "u1", role: "USER", email: "a@example.com", name: "Ada", image: null })

    await expect(getCurrentUser()).resolves.toEqual({
      id: "u1",
      role: "USER",
      email: "a@example.com",
      name: "Ada",
      image: null,
    })
  })

  it("returns null when there is no session", async () => {
    session.mockResolvedValue(null)
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  // A session object with no id is not a signed-in user: everything downstream
  // keys off the id, so treating it as one hands a null id to a query.
  it("returns null when the session carries no user id", async () => {
    session.mockResolvedValue({})
    await expect(getCurrentUser()).resolves.toBeNull()

    signedIn({ role: "USER" })
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  /**
   * The point of the whole module. 2.0 moves authentication to a different
   * library, and anything that library adds on top of these five fields would
   * become a dependency that has to be reproduced there. Letting extra fields
   * through is how the boundary stops being one, silently and in a way no
   * other test would notice.
   */
  it("passes through only the five fields it declares", async () => {
    signedIn({
      id: "u1",
      role: "ADMIN",
      email: "a@example.com",
      name: "Ada",
      image: "https://example.com/a.png",
      emailVerified: new Date(),
      stripeCustomerId: "cus_123",
      provider: "github",
    })

    const user = await getCurrentUser()

    expect(Object.keys(user ?? {}).sort()).toEqual(["email", "id", "image", "name", "role"])
  })
})

describe("requireUser", () => {
  it("returns the user when there is one", async () => {
    signedIn({ id: "u1", role: "USER" })

    await expect(requireUser()).resolves.toMatchObject({ id: "u1", role: "USER" })
    expect(redirect).not.toHaveBeenCalled()
  })

  it("redirects to the sign-in page when there is not", async () => {
    session.mockResolvedValue(null)

    await expect(requireUser()).rejects.toThrow("REDIRECT:/login")
    expect(redirect).toHaveBeenCalledWith("/login")
  })
})

describe("isSignedIn", () => {
  it("is true with a session and false without one", async () => {
    signedIn({ id: "u1", role: "USER" })
    await expect(isSignedIn()).resolves.toBe(true)

    session.mockResolvedValue(null)
    await expect(isSignedIn()).resolves.toBe(false)
  })
})
