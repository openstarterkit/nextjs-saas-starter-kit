import { afterEach, describe, expect, it } from "vitest"
import { enabledOAuthProviders, oauthCredentials } from "./oauth-providers"

const KEYS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))

function setEnv(values: Record<string, string>) {
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, values)
}

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("enabledOAuthProviders", () => {
  it("is empty on a fresh clone, so the login page shows no button that would fail", () => {
    setEnv({})
    expect(enabledOAuthProviders()).toEqual([])
  })

  it("needs both keys of a provider, not one", () => {
    setEnv({ GOOGLE_CLIENT_ID: "id", GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" })
    expect(enabledOAuthProviders()).toEqual(["github"])
    expect(oauthCredentials("google")).toBeUndefined()
    expect(oauthCredentials("github")).toEqual({ clientId: "id", clientSecret: "secret" })
  })

  it("keeps the display order, Google first", () => {
    setEnv({
      GITHUB_CLIENT_ID: "a",
      GITHUB_CLIENT_SECRET: "b",
      GOOGLE_CLIENT_ID: "c",
      GOOGLE_CLIENT_SECRET: "d",
    })
    expect(enabledOAuthProviders()).toEqual(["google", "github"])
  })
})
