# Changes to noobtrader-website

This repo is what GitHub Pages serves at **noob-trader.com**:
- `app/` is the web app, built from `Rubix-1983/Noob-Trader`. Never edit it by hand.
- the landing page files come from `website/` in that repo.
- `schools/` keeps only `sw.js`, a clean-up file for the retired Schools address.

## Every change is documented (founder rule, 1 Nov 2026)

> "always give detailed reasons for the repo updates on each change to its tracked properly"
> "Ensure all repos as a rule changes are documented properly"

- **Publishes.** Almost every commit here is made by
  `scripts/deploy-web.mjs` in Noob-Trader (`Deploy web app from
  Noob-Trader@<sha>`). Its body lists why it was published, the merged pull
  requests and commits since the last publish, and a link to the source
  commit.
- **Changes made by hand** (a rare fix straight on this repo) go through a pull
  request that follows `.github/pull_request_template.md`. The commit body
  quotes the request with its date, the cause, what changed, and the checks
  actually run. Merge with a merge commit so the PR link stays in history.
- **Landing page changes** belong in `website/` in Noob-Trader, not here. A
  publish copies them over, so a hand edit here would be overwritten.

The full rule is in Noob-Trader's `CLAUDE.md`, section 2.8, "Document every
change".
