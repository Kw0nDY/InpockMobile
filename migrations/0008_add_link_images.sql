-- Add image-related fields to links table
ALTER TABLE links ADD COLUMN image_url TEXT;
ALTER TABLE links ADD COLUMN custom_image_url TEXT;
ALTER TABLE links ADD COLUMN crop_data TEXT;
ALTER TABLE links ADD COLUMN description TEXT;