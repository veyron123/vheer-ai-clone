-- Create GIN index for full-text search on image prompts in PostgreSQL
-- This provides fast text search capabilities for the prompt field

-- Check if the index doesn't already exist before creating
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'colibrrri_images'
        AND indexname = 'idx_colibrrri_images_prompt_gin'
    ) THEN
        CREATE INDEX idx_colibrrri_images_prompt_gin 
        ON colibrrri_images 
        USING gin(to_tsvector('english', prompt));
    END IF;
END $$;

-- Optional: Create a trigger to maintain a tsvector column for even better performance
-- This would require adding a new column to the schema, so we'll leave it as a comment
-- ALTER TABLE colibrrri_images ADD COLUMN IF NOT EXISTS prompt_tsv tsvector;
-- CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
-- ON colibrrri_images FOR EACH ROW EXECUTE FUNCTION
-- tsvector_update_trigger(prompt_tsv, 'pg_catalog.english', prompt);