-- Add database indexes for efficient MLS listings queries
-- These indexes will dramatically improve query performance for 36K+ listings

-- Index for status filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_mls_listings_status ON mls_listings(mls_status);

-- Index for city filtering
CREATE INDEX IF NOT EXISTS idx_mls_listings_city ON mls_listings(city);

-- Index for status + city combination (common filter pattern)
CREATE INDEX IF NOT EXISTS idx_mls_listings_status_city ON mls_listings(mls_status, city);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_mls_listings_price ON mls_listings(listing_price);

-- Index for bedrooms filtering
CREATE INDEX IF NOT EXISTS idx_mls_listings_bedrooms ON mls_listings(bedrooms_total);

-- Index for coordinates (for map queries)
CREATE INDEX IF NOT EXISTS idx_mls_listings_coordinates ON mls_listings(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for property type filtering
CREATE INDEX IF NOT EXISTS idx_mls_listings_property_type ON mls_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_mls_listings_property_sub_type ON mls_listings(property_sub_type);

-- Index for list date sorting (newest first)
CREATE INDEX IF NOT EXISTS idx_mls_listings_list_date ON mls_listings(list_date DESC NULLS LAST);

-- Composite index for common query pattern: active status + city + sorted by date
CREATE INDEX IF NOT EXISTS idx_mls_listings_active_city_date ON mls_listings(mls_status, city, list_date DESC NULLS LAST);

-- Composite index for active + price sorting
CREATE INDEX IF NOT EXISTS idx_mls_listings_active_price ON mls_listings(mls_status, listing_price);

-- Index for year_built (new construction filter)
CREATE INDEX IF NOT EXISTS idx_mls_listings_year_built ON mls_listings(year_built);