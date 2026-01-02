# Database Migration Scripts

## Required Migration: alter_image_url_to_text.sql

**Issue:** The `image_url` column in `mini_job_cards` table is currently VARCHAR(255), which is too short for base64 encoded images.

**Solution:** Run the migration script to change the column type to TEXT.

### How to Run:

#### Option 1: Using psql command line
```bash
psql -U postgres -d ems_db -f alter_image_url_to_text.sql
```

#### Option 2: Using pgAdmin or any PostgreSQL client
1. Open your PostgreSQL client
2. Connect to database: `ems_db`
3. Run the following SQL:
```sql
ALTER TABLE mini_job_cards
ALTER COLUMN image_url TYPE TEXT;
```

#### Option 3: From inside psql session
```bash
# Connect to database
psql -U postgres -d ems_db

# Run the migration
\i /path/to/alter_image_url_to_text.sql

# Or copy-paste the SQL directly:
ALTER TABLE mini_job_cards ALTER COLUMN image_url TYPE TEXT;

# Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'mini_job_cards' AND column_name = 'image_url';
```

### Expected Result:
After running the migration, the column should show:
- **column_name:** image_url
- **data_type:** text
- **character_maximum_length:** NULL (unlimited)

### Note:
This migration is safe to run on existing data. PostgreSQL will automatically convert VARCHAR values to TEXT without data loss.
