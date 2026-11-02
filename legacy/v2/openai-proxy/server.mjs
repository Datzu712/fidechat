// v2's AI bots hard-code `gpt-3.5-turbo`, which OpenAI has since retired
// (requests now fail with 404). The v2 API reaches this proxy through
// OPENAI_BASE_URL (read by the openai SDK it uses); the proxy forwards every
// request to OpenAI unchanged except for the `model` field.
import http from 'node:http';

const UPSTREAM = 'https://api.openai.com';
const RETIRED = 'gpt-3.5-turbo';
const REPLACEMENT = process.env.REPLACEMENT_MODEL || 'gpt-4o-mini';

http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body = Buffer.concat(chunks);

    if (body.length && req.headers['content-type']?.includes('application/json')) {
        const json = JSON.parse(body.toString());
        if (json.model === RETIRED) json.model = REPLACEMENT;
        body = Buffer.from(JSON.stringify(json));
    }

    const upstream = await fetch(UPSTREAM + req.url, {
        method: req.method,
        headers: {
            authorization: req.headers.authorization ?? '',
            'content-type': req.headers['content-type'] ?? 'application/json',
        },
        body: body.length ? body : undefined,
    });
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
    res.end(Buffer.from(await upstream.arrayBuffer()));
}).listen(8080);
