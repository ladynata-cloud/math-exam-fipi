import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { InvalidTurn, respond } from './dialogue.mjs';

const baseHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store', 'Vary': 'Origin' };
const assets = new Map([
  ['/', ['demo.html', 'text/html; charset=utf-8']], ['/demo.js', ['demo.js', 'text/javascript; charset=utf-8']],
  ['/demo.css', ['demo.css', 'text/css; charset=utf-8']], ['/client.js', ['client.js', 'text/javascript; charset=utf-8']],
]);
function originValue(value) {
  const url = new URL(value);
  const loopback = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (url.origin !== value || !(url.protocol === 'https:' || loopback && url.protocol === 'http:')) {
    throw new Error('Expected an exact HTTPS origin or HTTP loopback origin');
  }
  return url.origin;
}
function origins(extra, defaults) {
  return new Set([...defaults, ...(extra || '').split(',').map(s => s.trim()).filter(Boolean)].map(originValue));
}
class HttpFailure extends Error {
  constructor(status, code) { super(code); this.status = status; }
}
async function readJson(req) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '') ||
      !['identity',undefined].includes(req.headers['content-encoding'])) throw new HttpFailure(415, 'json_required');
  const maxBytes = 8192;
  if (Number(req.headers['content-length']) > maxBytes) throw new HttpFailure(413, 'body_too_large');
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpFailure(413, 'body_too_large');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpFailure(400, 'invalid_json'); }
}
function send(res, status, body, headers={}) {
  res.writeHead(status, { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(body == null ? undefined : JSON.stringify(body));
}

// No per-user identifiers, prompts or responses are stored by this handler.
export function createHandler({env=process.env, now=Date.now, requestsPerMinute=1200}={}) {
  const sites = {
    mathexam: origins(env.SITE_ASSISTANT_MATH_ORIGINS, ['https://mathexam.space']),
    uzel: origins(env.SITE_ASSISTANT_READER_ORIGINS, ['https://usel-toski-po-miru.art']),
  };
  const publicOrigin = env.SITE_ASSISTANT_PUBLIC_ORIGIN ? originValue(env.SITE_ASSISTANT_PUBLIC_ORIGIN) : '';
  let windowStart = now();
  let count = 0;
  return async function handle(req, res) {
    let cors = {};
    try {
      const endpoint = req.url;
      if (req.method === 'GET' && endpoint === '/healthz') return send(res, 200, {ok:true, version:1, mode:'offline'});
      if (req.method === 'GET' && assets.has(endpoint)) {
        const [name, contentType] = assets.get(endpoint);
        const body = await readFile(new URL(name, import.meta.url));
        const policy = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'";
        res.writeHead(200, { ...baseHeaders, 'Content-Type': contentType, 'Content-Security-Policy': policy,
          ...(endpoint === '/client.js' ? {'Access-Control-Allow-Origin':'*'} : {}) });
        return res.end(body);
      }
      if (endpoint !== '/api/v1/dialogue') throw new HttpFailure(404, 'not_found');
      const origin = req.headers.origin;
      const localDemo = /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin || '') &&
                        origin === 'http://' + req.headers.host;
      const demo = localDemo || (publicOrigin && origin === publicOrigin);
      if (origin && !demo && !sites.mathexam.has(origin) && !sites.uzel.has(origin)) {
        throw new HttpFailure(403, 'origin_not_allowed');
      }
      if (origin) cors = {'Access-Control-Allow-Origin':origin};
      if (req.method === 'OPTIONS') return send(res, 204, null, { ...cors,
        'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers':'Content-Type', 'Access-Control-Max-Age':'600' });
      if (req.method !== 'POST') throw new HttpFailure(405, 'method_not_allowed');
      const time = now();
      if (time - windowStart >= 60000) { windowStart = time; count = 0; }
      if (++count > requestsPerMinute) throw new HttpFailure(429, 'rate_limited');
      const input = await readJson(req);
      if (origin && !demo && (typeof input?.site !== 'string' || !Object.hasOwn(sites,input.site))) throw new HttpFailure(400, 'invalid_turn');
      if (origin && !demo && !sites[input.site].has(origin)) throw new HttpFailure(403, 'site_origin_mismatch');
      return send(res, 200, respond(input), cors);
    } catch (error) {
      req.resume();
      if (res.destroyed || res.writableEnded) return;
      if (error instanceof HttpFailure) return send(res, error.status, {error:error.message}, cors);
      if (error instanceof InvalidTurn) return send(res, 400, {error:'invalid_turn'}, cors);
      return send(res, 503, {error:'unavailable'}, cors);
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '127.0.0.1';
  const server = http.createServer({requestTimeout:10000, headersTimeout:10000, keepAliveTimeout:5000,
    maxHeaderSize:8192}, createHandler());
  server.listen(port, host, () => console.log('Site assistant (offline) listening on port ' + server.address().port));
}
