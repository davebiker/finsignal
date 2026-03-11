-- Add yahoo_symbol column to watchlist for international ticker resolution
-- e.g., ticker="VOW3" but yahoo_symbol="VOW3.DE" for Xetra

ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS yahoo_symbol text;

-- Backfill: set yahoo_symbol = ticker for existing rows (US tickers)
UPDATE watchlist SET yahoo_symbol = ticker WHERE yahoo_symbol IS NULL;
