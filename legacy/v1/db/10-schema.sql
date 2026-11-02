-- Loads backup.sql from the api-v1-java tag WITHOUT modifying it.
--
-- The dump is a DataGrip export: after the tables it redeclares the uuid-ossp
-- functions as `language c` with "missing source code", which always fails
-- (the extension already provides them, see 00-extensions.sql). Those errors
-- are expected, so they are tolerated only while the dump runs.
\set ON_ERROR_STOP off
\i /legacy/backup.sql
\set ON_ERROR_STOP on

-- Fail the init if the dump did not create the four app tables.
DO $$
BEGIN
    IF (SELECT count(*) FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('user', 'channel', 'message', 'user_channel')) <> 4 THEN
        RAISE EXCEPTION 'backup.sql did not create the 4 expected v1 tables';
    END IF;
END
$$;
