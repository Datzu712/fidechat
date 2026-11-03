-- Demo data, loaded by the `seed` service in compose.yaml after the migrations.
-- User IDs match the Keycloak users in docker/keycloak/realm-fidechat.json, and
-- the guild is the DEFAULT_GUILD_ID every new user is added to on first login.
-- Idempotent, so it is safe on every `docker compose up`.
BEGIN;

INSERT INTO app_user (id, username, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ana Rojas', 'ana@demo.local'),
    ('22222222-2222-2222-2222-222222222222', 'Bruno Mora', 'bruno@demo.local')
ON CONFLICT DO NOTHING;

INSERT INTO guild (id, name, is_public, owner_id, description) VALUES
    ('44444444-4444-4444-4444-444444444444', 'Fidechat', true, '11111111-1111-1111-1111-111111111111',
     'Fidechat v3 demo server')
ON CONFLICT DO NOTHING;

INSERT INTO guild_users (guild_id, user_id) VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO channel (id, name, description, position, guild_id) VALUES
    ('55555555-5555-5555-5555-555555555555', 'general', 'General chat', 0, '44444444-4444-4444-4444-444444444444'),
    ('66666666-6666-6666-6666-666666666666', 'backend', 'NestJS, PostgreSQL and Keycloak', 1,
     '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

INSERT INTO message (id, content, author_id, channel_id) VALUES
    ('77777777-7777-7777-7777-777777777777', 'Hi! This is Fidechat v3 (NestJS + PostgreSQL + Keycloak).',
     '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'),
    ('88888888-8888-8888-8888-888888888888', 'Ask the bots anything here: mention chat yipiyi, chayanne or pedro pascal.',
     '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;

COMMIT;
