/**
 * Curated universe of US-listed products shown in Browse deals. Any other
 * ticker is reachable through search; these are the editorial picks per class.
 */
export type AssetClassId =
  | "stocks"
  | "etfs"
  | "index-funds"
  | "mutual-funds"
  | "crypto"
  | "bonds"
  | "real-estate"
  | "cash"
  | "commodities"
  | "alternatives";

export type CatalogEntry = { symbol: string; name: string; group: string };

export type AssetClass = {
  id: AssetClassId;
  label: string;
  blurb: string;
  entries: CatalogEntry[];
};

const e = (group: string, list: [string, string][]): CatalogEntry[] =>
  list.map(([symbol, name]) => ({ symbol, name, group }));

export const ASSET_CLASSES: AssetClass[] = [
  {
    id: "stocks",
    label: "Stocks",
    blurb: "Individual US companies. Buy any amount from $1 — fractional shares included.",
    entries: [
      ...e("Mega-cap tech", [
        ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "Nvidia"], ["AMZN", "Amazon"],
        ["GOOGL", "Alphabet (Google)"], ["META", "Meta Platforms"], ["TSLA", "Tesla"], ["AVGO", "Broadcom"],
      ]),
      ...e("Growth & software", [
        ["NFLX", "Netflix"], ["AMD", "Advanced Micro Devices"], ["ORCL", "Oracle"], ["CRM", "Salesforce"],
        ["ADBE", "Adobe"], ["PLTR", "Palantir"], ["UBER", "Uber"], ["COIN", "Coinbase"], ["INTC", "Intel"],
      ]),
      ...e("Blue chips", [
        ["BRK-B", "Berkshire Hathaway"], ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["MA", "Mastercard"],
        ["UNH", "UnitedHealth"], ["JNJ", "Johnson & Johnson"], ["XOM", "Exxon Mobil"], ["WMT", "Walmart"],
        ["PG", "Procter & Gamble"], ["HD", "Home Depot"], ["COST", "Costco"], ["KO", "Coca-Cola"],
        ["PEP", "PepsiCo"], ["MCD", "McDonald's"], ["DIS", "Disney"], ["NKE", "Nike"], ["BA", "Boeing"],
      ]),
    ],
  },
  {
    id: "etfs",
    label: "ETFs",
    blurb: "Exchange-traded funds tracking markets, sectors and themes.",
    entries: [
      ...e("Broad market", [
        ["SPY", "SPDR S&P 500 ETF"], ["QQQ", "Invesco QQQ (Nasdaq-100)"], ["DIA", "SPDR Dow Jones"],
        ["IWM", "iShares Russell 2000"], ["VTI", "Vanguard Total Stock Market"],
      ]),
      ...e("International", [
        ["VXUS", "Vanguard Total International"], ["VEA", "Vanguard Developed Markets"], ["VWO", "Vanguard Emerging Markets"],
      ]),
      ...e("Sectors & themes", [
        ["XLK", "Technology Select Sector"], ["XLF", "Financial Select Sector"], ["XLE", "Energy Select Sector"],
        ["XLV", "Health Care Select Sector"], ["SMH", "VanEck Semiconductor"], ["ARKK", "ARK Innovation"],
      ]),
      ...e("Dividend", [["SCHD", "Schwab US Dividend Equity"], ["VIG", "Vanguard Dividend Appreciation"]]),
    ],
  },
  {
    id: "index-funds",
    label: "Index funds",
    blurb: "Low-cost funds tracking the S&P 500, total market and international indexes.",
    entries: [
      ...e("S&P 500", [
        ["VOO", "Vanguard S&P 500 ETF"], ["IVV", "iShares Core S&P 500"], ["SPLG", "SPDR Portfolio S&P 500"],
        ["VFIAX", "Vanguard 500 Index Admiral"], ["FXAIX", "Fidelity 500 Index"], ["SWPPX", "Schwab S&P 500 Index"],
      ]),
      ...e("Total market", [
        ["ITOT", "iShares Core S&P Total US"], ["VTSAX", "Vanguard Total Stock Mkt Admiral"], ["FSKAX", "Fidelity Total Market Index"],
      ]),
      ...e("International & global", [
        ["VT", "Vanguard Total World"], ["IXUS", "iShares Core MSCI Total Intl"], ["VTIAX", "Vanguard Total Intl Admiral"],
      ]),
    ],
  },
  {
    id: "mutual-funds",
    label: "Mutual funds",
    blurb: "Actively managed funds, priced once a day at net asset value.",
    entries: e("Actively managed", [
      ["AGTHX", "American Funds Growth Fund"], ["VWELX", "Vanguard Wellington"], ["FCNTX", "Fidelity Contrafund"],
      ["DODGX", "Dodge & Cox Stock"], ["PRGFX", "T. Rowe Price Growth Stock"], ["VWINX", "Vanguard Wellesley Income"],
    ]),
  },
  {
    id: "crypto",
    label: "Crypto",
    blurb: "Major coins, spot crypto ETFs and stablecoins, priced around the clock.",
    entries: [
      ...e("Coins & tokens", [
        ["BTC-USD", "Bitcoin"], ["ETH-USD", "Ethereum"], ["SOL-USD", "Solana"], ["XRP-USD", "XRP"],
        ["BNB-USD", "BNB"], ["ADA-USD", "Cardano"], ["DOGE-USD", "Dogecoin"], ["AVAX-USD", "Avalanche"],
        ["LINK-USD", "Chainlink"], ["DOT-USD", "Polkadot"], ["LTC-USD", "Litecoin"], ["TRX-USD", "TRON"],
      ]),
      ...e("Crypto ETFs & funds", [
        ["IBIT", "iShares Bitcoin Trust"], ["FBTC", "Fidelity Wise Origin Bitcoin"], ["GBTC", "Grayscale Bitcoin Trust"],
        ["ARKB", "ARK 21Shares Bitcoin"], ["ETHA", "iShares Ethereum Trust"], ["BITO", "ProShares Bitcoin Strategy"],
      ]),
      ...e("Stablecoins", [["USDT-USD", "Tether"], ["USDC-USD", "USD Coin"], ["DAI-USD", "Dai"], ["PYUSD-USD", "PayPal USD"]]),
    ],
  },
  {
    id: "bonds",
    label: "Bonds",
    blurb: "Treasuries, corporate and municipal bonds, plus bond funds.",
    entries: [
      ...e("US Treasury bills, notes & bonds", [
        ["SGOV", "Treasury bills 0–3 month"], ["BIL", "Treasury bills 1–3 month"], ["SHY", "Treasury notes 1–3 year"],
        ["IEF", "Treasury notes 7–10 year"], ["TLT", "Treasury bonds 20+ year"], ["GOVT", "All-maturity Treasuries"],
      ]),
      ...e("Corporate bonds", [
        ["LQD", "Investment-grade corporates"], ["VCIT", "Intermediate corporates"], ["HYG", "High-yield corporates"], ["JNK", "SPDR high-yield"],
      ]),
      ...e("Municipal bonds", [["MUB", "National municipal bonds"], ["VTEB", "Vanguard tax-exempt"], ["TFI", "SPDR municipal"]]),
      ...e("Bond ETFs & mutual funds", [
        ["BND", "Vanguard Total Bond"], ["AGG", "iShares Core US Aggregate"], ["BNDX", "Vanguard Total Intl Bond"],
        ["VBTLX", "Vanguard Total Bond Admiral"], ["PTTRX", "PIMCO Total Return"],
      ]),
    ],
  },
  {
    id: "real-estate",
    label: "Real estate",
    blurb: "Listed REITs and real estate funds. Direct property deals are under Private deals.",
    entries: [
      ...e("REITs", [
        ["O", "Realty Income"], ["PLD", "Prologis"], ["AMT", "American Tower"], ["EQIX", "Equinix"],
        ["SPG", "Simon Property Group"], ["PSA", "Public Storage"], ["AVB", "AvalonBay Communities"], ["WELL", "Welltower"],
      ]),
      ...e("Real estate ETFs & funds", [
        ["VNQ", "Vanguard Real Estate ETF"], ["SCHH", "Schwab US REIT"], ["XLRE", "Real Estate Select Sector"],
        ["IYR", "iShares US Real Estate"], ["REET", "iShares Global REIT"], ["VGSLX", "Vanguard REIT Index Admiral"],
      ]),
    ],
  },
  {
    id: "cash",
    label: "Cash & low risk",
    blurb: "Money market funds and ultra-short Treasury funds paying high-yield-savings-like rates.",
    entries: [
      ...e("Money market funds", [
        ["VMFXX", "Vanguard Federal Money Market"], ["SPAXX", "Fidelity Government Money Market"], ["SWVXX", "Schwab Value Advantage Money"],
      ]),
      ...e("Ultra-short cash funds", [
        ["USFR", "Floating-rate Treasury"], ["JPST", "JPMorgan Ultra-Short Income"], ["SGOV", "0–3 month Treasury"],
      ]),
    ],
  },
  {
    id: "commodities",
    label: "Commodities",
    blurb: "Gold, silver and other metals, energy and agriculture — via ETFs or futures.",
    entries: [
      ...e("Precious metals", [
        ["GLD", "SPDR Gold Shares"], ["IAU", "iShares Gold Trust"], ["SLV", "iShares Silver Trust"],
        ["PPLT", "Physical Platinum"], ["PALL", "Physical Palladium"],
      ]),
      ...e("Energy, agriculture & broad", [
        ["USO", "United States Oil Fund"], ["UNG", "United States Natural Gas"], ["DBA", "Invesco Agriculture"],
        ["DBC", "Invesco Commodity Index"], ["CPER", "United States Copper"],
      ]),
      ...e("Futures (advanced)", [
        ["GC=F", "Gold futures"], ["SI=F", "Silver futures"], ["CL=F", "Crude oil futures"],
        ["NG=F", "Natural gas futures"], ["ZC=F", "Corn futures"], ["ES=F", "S&P 500 E-mini futures"],
      ]),
    ],
  },
  {
    id: "alternatives",
    label: "Alternatives",
    blurb: "Listed private equity, venture and hedge-fund strategies. Collectibles are offered as private deals.",
    entries: [
      ...e("Private equity & venture managers", [
        ["BX", "Blackstone"], ["KKR", "KKR & Co."], ["APO", "Apollo Global"], ["ARES", "Ares Management"], ["CG", "Carlyle Group"],
      ]),
      ...e("Alternative strategy funds", [
        ["PSP", "Invesco Global Listed Private Equity"], ["QAI", "IQ Hedge Multi-Strategy"], ["DBMF", "iMGP Managed Futures"],
      ]),
    ],
  },
];

export const ACCOUNT_TYPES = [
  { value: "individual", label: "Individual (taxable)" },
  { value: "traditional_ira", label: "Traditional IRA" },
  { value: "roth_ira", label: "Roth IRA" },
  { value: "sep_ira", label: "SEP IRA" },
  { value: "solo_401k", label: "Solo 401(k)" },
  { value: "rollover_401k", label: "401(k) / 403(b) rollover" },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

export const ACCOUNT_LABEL: Record<string, string> = Object.fromEntries(ACCOUNT_TYPES.map((a) => [a.value, a.label]));

export function findCatalogEntry(symbol: string) {
  for (const cls of ASSET_CLASSES) {
    const hit = cls.entries.find((x) => x.symbol === symbol);
    if (hit) return { ...hit, classId: cls.id, classLabel: cls.label };
  }
  return null;
}
