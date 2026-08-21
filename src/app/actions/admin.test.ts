import { describe, expect, it, vi, beforeEach } from "vitest"

const session = vi.fn()
const updateMany = vi.fn()

vi.mock("@/auth", () => ({ auth: () => session() }))
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { updateMany: (...args: unknown[]) => updateMany(...args) } },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const { setUserRole } = await import("./admin")

const asAdmin = () => session.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })

beforeEach(() => {
  session.mockReset()
  updateMany.mockReset()
  updateMany.mockResolvedValue({ count: 1 })
})

describe("setUserRole", () => {
  it("refuses a caller who is not signed in", async () => {
    session.mockResolvedValue(null)
    await expect(setUserRole("u1", "ADMIN", "USER")).rejects.toThrow("Unauthorized")
    expect(updateMany).not.toHaveBeenCalled()
  })

  it("refuses a signed-in caller who is not an admin", async () => {
    session.mockResolvedValue({ user: { id: "u2", role: "USER" } })
    await expect(setUserRole("u1", "ADMIN", "USER")).rejects.toThrow("Unauthorized")
    expect(updateMany).not.toHaveBeenCalled()
  })

  it("promotes when the row still holds the role the admin was looking at", async () => {
    asAdmin()
    await expect(setUserRole("u1", "ADMIN", "USER")).resolves.toEqual({ role: "ADMIN" })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "u1", role: "USER" },
      data: { role: "ADMIN" },
    })
  })

  /**
   * The defect this replaced: the action used to read the current role and
   * flip it. A page rendered before someone else promoted the same user still
   * showed "Make Admin", and clicking it demoted them, with a toast that said
   * "User promoted to USER".
   */
  it("refuses instead of demoting when the role moved under a stale page", async () => {
    asAdmin()
    updateMany.mockResolvedValue({ count: 0 })
    await expect(setUserRole("u1", "ADMIN", "USER")).rejects.toThrow(/changed since/)
  })

  it("refuses a request that would not change anything", async () => {
    asAdmin()
    await expect(setUserRole("u1", "ADMIN", "ADMIN")).rejects.toThrow(/already set/)
    expect(updateMany).not.toHaveBeenCalled()
  })

  it("never writes a role the caller did not ask for", async () => {
    // The role written comes from the argument, never from what the row holds:
    // that is the whole difference from the toggle this replaced.
    asAdmin()
    await setUserRole("u1", "USER", "ADMIN")
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "u1", role: "ADMIN" },
      data: { role: "USER" },
    })
  })
})
