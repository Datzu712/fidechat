-- Loads v2's SQL files from the api-v2-nest-oracle tag WITHOUT modifying them.
--
-- init.sql is a full dump (tables, packages, the owner trigger). The pkg_*.sql
-- and triggers.sql files are CREATE OR REPLACE versions that are newer than the
-- copies inside the dump, so they run afterwards.
--
-- Expected errors along the way: the dump adds GUILD_USERS' primary key twice
-- (ORA-02261), some objects compile before their dependencies exist and are
-- fixed by the later files, and pkg_sync_users.sql ends with a test query for a
-- user id that only existed in the original database (ORA-20102).
CONNECT admin/admin@//localhost:1521/XEPDB1

SET DEFINE OFF
SET SQLBLANKLINES ON
SET FEEDBACK OFF

@/legacy/sql/init.sql
@/legacy/sql/random_uuid.sql
-- random_uuid.sql ends without the `/` SQL*Plus needs to run a PL/SQL block
-- (IDEs like DataGrip do not need it), so terminate the block here. Without
-- this, SQL*Plus keeps appending the next file to the function's source.
/
@/legacy/sql/pkg_user.sql
@/legacy/sql/pkg_guild.sql
@/legacy/sql/pkg_channel.sql
@/legacy/sql/pkg_messages.sql
@/legacy/sql/pkg_sync_users.sql
@/legacy/sql/triggers.sql

-- Fail the init if any table is missing or any PL/SQL object did not compile.
WHENEVER SQLERROR EXIT FAILURE
DECLARE
    v_tables  NUMBER;
    v_invalid VARCHAR2(4000);
BEGIN
    DBMS_UTILITY.COMPILE_SCHEMA(schema => USER, compile_all => FALSE);
    SELECT COUNT(*) INTO v_tables FROM user_tables
    WHERE table_name IN ('APP_USER', 'GUILD', 'GUILD_USERS', 'CHANNEL', 'MESSAGE', 'AUDITORIA');
    SELECT LISTAGG(object_type || ' ' || object_name, ', ') INTO v_invalid
    FROM user_objects WHERE status = 'INVALID';
    IF v_tables <> 6 OR v_invalid IS NOT NULL THEN
        RAISE_APPLICATION_ERROR(-20000, 'v2 schema load failed: tables=' || v_tables || ', invalid: ' || v_invalid);
    END IF;
END;
/
WHENEVER SQLERROR CONTINUE
