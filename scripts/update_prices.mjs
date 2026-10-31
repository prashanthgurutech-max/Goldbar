name: Update store prices
on:
  schedule:
    - cron: "17 */6 * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency: data-writes

jobs:
  update:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: |
          npm install --no-save playwright
          npx playwright install --with-deps chromium
      - id: upd
        run: node scripts/update_prices.mjs
        continue-on-error: true
        env:
          # Stores the test run could read. Add Myntra, Ajio or Amazon here only if they ever start working.
          ONLY_STORES: "Flipkart,Shopsy"
      - run: |
          git config user.name "price-bot"
          git config user.email "price-bot@users.noreply.github.com"
          git add data/listings.json
          git diff --cached --quiet || (git commit -m "Update store prices" && git pull --rebase && git push)
      - name: Fail the run if some prices could not be updated, so GitHub emails you
        if: steps.upd.outcome == 'failure'
        run: |
          echo "Some listings could not be updated. See the summary above."
          exit 1
