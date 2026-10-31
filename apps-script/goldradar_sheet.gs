// GoldRadar sheet helper. Paste into Extensions > Apps Script, save, and reload the sheet.
const SHEET_NAME = "Prices";
const SEED_URL = "https://raw.githubusercontent.com/prashanthgurutech-max/Goldbar/main/data/sheet_seed.csv";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("GoldRadar")
    .addItem("Load coins from GitHub (first time only)", "loadFromGitHub")
    .addToUi();
}

// Stamps the time whenever you change a price or tick the verified box
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_NAME) return;
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const col = (n) => head.indexOf(n) + 1;
  const priceCol = col("price"), verCol = col("verified"), chkCol = col("checked_at");
  if (!priceCol || !verCol || !chkCol) return;

  const r1 = e.range.getRow(), r2 = e.range.getLastRow();
  const c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
  const now = Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const first = Math.max(r1, 2);
  if (r2 < first) return;
  const n = r2 - first + 1;

  if (priceCol >= c1 && priceCol <= c2) {
    const prices = sh.getRange(first, priceCol, n, 1).getValues();
    prices.forEach((p, i) => {
      if (Number(String(p[0]).replace(/[^\d.]/g, "")) > 0) sh.getRange(first + i, chkCol).setValue(now);
    });
  }
  if (verCol >= c1 && verCol <= c2) {
    const ticks = sh.getRange(first, verCol, n, 1).getValues();
    ticks.forEach((t, i) => {
      if (t[0] === true) {
        sh.getRange(first + i, chkCol).setValue(now);
        sh.getRange(first + i, verCol).setValue(false);
      }
    });
  }
}

function loadFromGitHub() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() > 1 &&
      ui.alert("This replaces everything on the Prices tab. Continue?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const res = UrlFetchApp.fetch(SEED_URL, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) { ui.alert("Could not download the coin list (HTTP " + res.getResponseCode() + "). Run 'Export coins for the Google Sheet' in GitHub Actions first."); return; }
  const rows = Utilities.parseCsv(res.getContentText());
  sh.clear();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  const head = rows[0];
  const col = (n) => head.indexOf(n) + 1;
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, head.length).setFontWeight("bold").setBackground("#eeeeee");
  sh.getRange(2, col("verified"), rows.length - 1, 1).insertCheckboxes();
  sh.getRange(2, col("price"), rows.length - 1, 1).setBackground("#fff2cc").setNumberFormat("0");
  sh.getRange(2, col("checked_at"), rows.length - 1, 1).setNumberFormat("@");
  sh.setColumnWidth(col("url"), 260);
  ui.alert("Loaded " + (rows.length - 1) + " coins. Edit the yellow price column, or tick 'verified' when a price is unchanged.");
}
