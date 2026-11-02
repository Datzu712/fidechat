-- backup.sql uses uuid_generate_v4() as the column default, but the dump
-- declares the uuid-ossp functions AFTER the tables. Creating the extension
-- first lets the tables be created, and those functions already exist.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Only used to hash the demo users' passwords with bcrypt (20-seed.sql).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
