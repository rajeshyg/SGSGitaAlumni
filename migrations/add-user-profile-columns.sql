ALTER TABLE user_profiles ADD COLUMN graduation_year INT NULL;
ALTER TABLE user_profiles ADD COLUMN program VARCHAR(100) NULL;
ALTER TABLE user_profiles ADD COLUMN alumni_data_snapshot JSON NULL;
ALTER TABLE user_profiles ADD COLUMN user_additions JSON NULL;
