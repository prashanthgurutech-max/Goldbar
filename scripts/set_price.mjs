name: Set store price
on:
  workflow_dispatch:
    inputs:
      url:
        description: "Product page URL"
        required: true
      price:
        description: "Price in rupees"
        required: true
      force:
        description: "Allow a change over 40% (true/false)"
        default: "false"

permissions:
  contents: write

concurrency: data-writes

jobs:
  set:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/set_price.mjs
        env:
          IN_URL: ${{ inputs.url }}
          IN_PRICE: ${{ inputs.price }}
          IN_FORCE: ${{ inputs.force }}
      - run: |
          git config user.name "price-bot"
          git config user.email "price-bot@users.noreply.github.com"
          git add data/listings.json
          git diff --cached --quiet || (git commit -m "Set store price" && git pull --rebase && git push)
