-- Migration v2: Update billing tiers to new 5-tier pricing
-- Plans: go (250 min), grow (750 min), scale (1500 min), pro (2500 min), enterprise (3500 min)

UPDATE organizations SET monthly_minute_limit = 250  WHERE plan = 'go';
UPDATE organizations SET monthly_minute_limit = 750  WHERE plan = 'grow';
UPDATE organizations SET monthly_minute_limit = 1500 WHERE plan = 'scale';
UPDATE organizations SET monthly_minute_limit = 2500 WHERE plan = 'pro';
UPDATE organizations SET monthly_minute_limit = 3500 WHERE plan = 'enterprise';

-- Migrate any orgs still on old plan names
UPDATE organizations SET plan = 'go',         monthly_minute_limit = 250  WHERE plan = 'starter';
UPDATE organizations SET plan = 'grow',       monthly_minute_limit = 750  WHERE plan = 'growth';
