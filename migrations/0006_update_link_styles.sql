-- Update existing links to use new style names
UPDATE links SET style = 'thumbnail' WHERE style = 'compact';
UPDATE links SET style = 'simple' WHERE style = 'list';
UPDATE links SET style = 'background' WHERE style = 'minimal';
-- 'card' style remains the same

-- Update default value for new links
ALTER TABLE links ALTER COLUMN style SET DEFAULT 'thumbnail';