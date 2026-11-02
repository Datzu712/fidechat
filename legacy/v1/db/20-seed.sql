-- Demo data so you can log in without signing up. Both passwords are "demo1234".
-- pgcrypto produces $2a$ hashes, which v1's BCryptPasswordEncoder accepts.
INSERT INTO "user" (id, name, email, hashed_password) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ana', 'ana@demo.local', crypt('demo1234', gen_salt('bf', 10))),
    ('22222222-2222-2222-2222-222222222222', 'Bruno', 'bruno@demo.local', crypt('demo1234', gen_salt('bf', 10)));

INSERT INTO channel (id, name, description, owner_id) VALUES
    ('33333333-3333-3333-3333-333333333333', 'general', 'Fidechat v1 demo channel', '11111111-1111-1111-1111-111111111111');

-- Like v1 itself, the owner is NOT inserted into user_channel: v1 reaches the
-- owner's channels through channel.owner_id, and adding a row here would make
-- the owner see the channel twice.
INSERT INTO user_channel (user_id, channel_id) VALUES
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

INSERT INTO message (author_id, channel_id, content) VALUES
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Hi! This is Fidechat v1 (Java + Spring Boot).');
