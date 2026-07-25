# Contributing

Thanks for being here. This project is free and MIT licensed, and it gets better when people who actually use it say what is missing or broken.

Before you spend time on code, please read how contributions are handled here. It is a little different from most repositories, and knowing it up front saves you effort.

## How this repository works

Development happens in a private repository, and each release is published here as a single commit. That keeps the public history clean and readable, and it means the code you see is always a released, working state.

The practical consequence for you: **an accepted pull request is not merged as your commit.** The maintainer reviews it, applies the change upstream, and it ships with the next release. Your contribution is credited in the release notes and in the changelog entry. Nothing is taken silently.

## What is most useful

**Issues and discussions come first.** A clear bug report or a well argued "this is missing" is worth more here than a patch, because it tells us what real users hit. There is no template to fill in: describe what you expected, what happened, and how to reproduce it.

Especially welcome:

- Bugs in the released code, with steps to reproduce
- Security reports, which go to security@openstarterkit.dev and never in a public issue (see [SECURITY.md](./SECURITY.md))
- Documentation that is wrong, unclear or out of date
- Concrete gaps you hit while shipping your own product with the kit

## Pull requests

They are welcome, with one condition: **open an issue first and wait for a reply**, unless the change is trivial like a typo or a broken link.

This is not bureaucracy. It is a starter kit, so every feature added becomes code that thousands of people would carry into their own products and maintain forever. That makes the bar for inclusion high, and it is a bar about scope and direction, not about the quality of your work.

Please also know, plainly: **every contribution is reviewed, and it may be declined.** A pull request being open is not a commitment to accept it. If we decline one we will say why, and it is usually one of these reasons:

- It belongs in a specific product rather than in a generic starter
- It adds a dependency where the kit deliberately stays lean
- It locks users into a vendor, which is the one thing this kit exists to avoid
- It duplicates something already solvable with the existing pieces

If you would rather not work under those terms, that is completely fair. The license is MIT: fork it and build what you want, with no obligation to us.

## If you do send a patch

Keep it focused on one thing, and make sure `npm run lint` and `npx tsc --noEmit` pass. Match the style already in the file you are editing. Explain in the description what problem it solves, not only what the code does.

## Roadmap and direction

The [roadmap](./ROADMAP.md) is indicative and can be reordered based on what people ask for. If something on it matters to you, say so in an issue. That signal genuinely changes the order.

## Code of conduct

Be decent. Assume the other person is trying to help, and disagree about the work rather than the person. Behaviour that makes this a worse place to be will be moderated.
