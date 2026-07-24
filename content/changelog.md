# Changelog

What changed, when, and what it means for you. These entries are examples: replace them with your own release notes, and keep the newest version in step with `version` in `src/config/site.ts`, which is what the footer links here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and versions follow [Semantic Versioning](https://semver.org/).

---

## [1.3.0] - 2026-07-20

📁 **Projects, tidied up.** Archiving, a faster dashboard and a clearer picture of who has access to what.

### Added
- **Archive a project** instead of deleting it: it leaves your active list, stays searchable, and comes back untouched whenever you restore it
- **Member list** on every project, so you can see at a glance who has access before you share something
- Keyboard shortcut to jump straight to a project by name

### Changed
- The dashboard loads noticeably faster when you have many projects
- Renaming a project no longer breaks links that point to it

### Fixed
- Invitation emails sometimes arrived without the project name in the subject line
- The project list kept a deleted project visible until the next refresh

## [1.2.0] - 2026-06-11

💳 **Billing you can settle yourself.** Yearly plans, better invoices, and no more writing to us to change a card.

### Added
- **Yearly plans**, at a lower monthly equivalent, with a switch on the pricing page
- **Company name and VAT number** on invoices, editable before your next renewal
- One-click access to the billing portal for changing your card or billing address

### Changed
- Upgrades are now prorated to the day rather than charged as a full new period
- Cancelling keeps your access until the end of the period you already paid for

### Fixed
- Receipts occasionally went to the sign-in address instead of the billing address

## [1.1.0] - 2026-05-04

🌗 **Comfort and clarity.** Dark mode, a calmer dashboard and fewer emails.

### Added
- **Dark mode**, following your system theme or pinned to your choice
- A short setup checklist on the dashboard for the first few things worth doing

### Changed
- Notification emails are grouped instead of sent one per event
- Clearer wording throughout the sign-in and sign-up screens

### Fixed
- The sidebar forgot its collapsed state after signing out and back in

## [1.0.0] - 2026-04-15

🎉 **First release.** Accounts, projects and billing, working end to end.
