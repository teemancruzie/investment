export type MarketQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: string;
  exchange: string;
  dayHigh: number | null;
  dayLow: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  volume: number | null;
  time: string | null;
};

export type ChartPoint = { t: number; price: number };

export type SearchHit = { symbol: string; name: string; type: string; exchange: string };
