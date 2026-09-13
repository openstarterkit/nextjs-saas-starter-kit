<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working in this repository

Nine rules. Each one is here because breaking it has caused, or would cause, a
defect that nothing else catches.

**Read the session through `@/lib/auth`.** `getCurrentUser()` returns the user
or null, `requireUser()` returns it or redirects. Do not import `auth()` from
`@/auth`: that boundary is what made the move to Better Auth in 2.0 a change
to seven files instead of a rewrite, and code written against the library
directly is code that has to be found and rewritten the next time. The sign-in
flow, the route handler and the middleware are the exceptions, and they are
already written.

**User-facing text lives in `src/locales/en.json`.** Read it with
`useTranslations` or `getTranslations`. A test fails on a key nothing reads and
on a key read but missing, so those two mistakes cannot survive. It cannot see a
string typed straight into a component, which is exactly how one gets out: if
you are about to write words a person will read, they belong in the message
file.

**The kit is neutral.** No brand name, no positioning, no marketing copy in the
product. Whoever deploys this ships it to their own users, and a sentence about
the kit inside their app is your words in their mouth. Anything specific to a
deployment goes in environment variables.

**English everywhere**, including comments, test names and error strings.

**Pure logic goes in `src/lib` with a `.test.ts` beside it.** If a rule can be
stated as a function, state it as a function: components render, they do not
decide.

**The server is the authority.** Client-side validation buys the user a round
trip they do not have to wait for. It proves nothing. A server action re-parses
what arrives, every time, even when a form checked it first.

**Structured data comes from the same source as what the page shows.** A price,
a breadcrumb, an outline: build both from one value. Two copies of the same
fact drift, and the copy nobody looks at drifts first.

**Do not reformat.** There is no formatter here on purpose. Match the style of
the file you are in.

**Every `docs/x.md` has a `docs/x.it.md`.** A guide added in one language only
is a guide half the readers cannot use.

Before calling work finished: `npx tsc --noEmit`, `npm run lint`, `npm test`.
