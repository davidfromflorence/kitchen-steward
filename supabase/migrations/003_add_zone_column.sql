-- Add zone column to separate storage location from food category
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS zone text DEFAULT 'fridge';

-- Set initial zone based on current category
UPDATE inventory_items SET zone = 'freezer' WHERE LOWER(category) = 'frozen';
UPDATE inventory_items SET zone = 'pantry' WHERE LOWER(category) IN ('carbohydrate', 'condiment', 'general');
UPDATE inventory_items SET zone = 'fridge' WHERE zone IS NULL OR zone = 'fridge';

-- Fix any items that had their category set to "Frozen" or "Dairy" by the old moveItem
-- Keep them as-is since we can't recover the original category
