# Upgrading

You cloned this kit and made it yours. This guide is about taking a newer version of it without losing that work, and about knowing in advance how much a given release will cost you.

## What a version number promises

Releases follow [SemVer](https://semver.org/), and here the question that decides the number is deliberately about you, not about how much work went in:

> What do you have to do to take this version?

| You have to | Number |
|---|---|
| `git pull`, at most `npm install` | **PATCH**: 1.6.**1** |
| `git pull`, `npm install`, at most a migration that runs itself or an **optional** env var | **MINOR**: 1.**7**.0 |
| Put your hands in: a required env var, a migration to think about against your data, a moved file, a raised runtime, a removed feature | **MAJOR**: **2**.0.0 |

A release can take two weeks of work and be a MINOR. Renaming one environment variable takes ten minutes and is a MAJOR. The number describes your side of the exchange.

## Taking a newer version

Add the kit as a second remote once:

```bash
git remote add upstream https://github.com/openstarterkit/nextjs-saas-starter-kit.git
git fetch upstream
```

Then, for each release you want:

```bash
git fetch upstream --tags
git merge v1.7.0        # or: git rebase v1.7.0
npm install
npx prisma migrate deploy
```

Conflicts land where you edited the same lines the release did. That is the honest cost of owning the code, and it is smaller than it sounds if your own work lives where the kit expects it: your routes under `src/app`, your components in their own folders, your copy in `src/locales`. The files most likely to conflict are the ones everybody edits, starting with `src/config/site.ts`, the message files and `prisma/schema.prisma`.

Read the [CHANGELOG](https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/CHANGELOG.md) before a MAJOR. It says what moved.

## The next major: authentication changes

Version **2.0** replaces the authentication library. It is the only thing that release contains: no new features, nothing else to review, so that the migration is as easy to adopt as a migration can be.

Version 1.7 already did the part that makes it cheap. Everything that reads the signed-in user now goes through one module:

```ts
import { getCurrentUser, requireUser } from "@/lib/auth"

const user = await getCurrentUser()   // the user, or null
const user = await requireUser()      // the user, or a redirect to sign-in
```

`getCurrentUser()` works today, on the current library. It will keep working after 2.0, returning the same shape: `id`, `role`, `email`, `name`, `image`.

**What to do now, in your own code:** read the session through those functions and not by importing `auth()` from `@/auth`. Code written against the boundary survives the upgrade untouched. Code written against the library is code you will have to find and rewrite.

The exceptions, which the kit already handles for you, are the places where a library is unavoidable: the sign-in and sign-out actions, the route handler under `src/app/api/auth`, and the middleware. If you have not edited those, 2.0 will not ask you anything about them.

## Before you upgrade anything

Commit or stash your work first, so the diff you review is the release and nothing else. Then, after the merge:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Four commands, in that order, because they fail from cheapest to most expensive. A type error found in two seconds is a type error you did not wait four minutes for a build to show you.
