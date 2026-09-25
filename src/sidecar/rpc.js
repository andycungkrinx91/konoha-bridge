'use strict';

const http = require('http');
const https = require('https');
const http2 = require('http2');
const fs = require('fs');

const sessionPool = new Map();
const certCache = new Map();

function getCert(certPath) {
  if (!certPath) return undefined;
  if (!certCache.has(certPath)) {
    try {
      certCache.set(certPath, fs.readFileSync(certPath));
    } catch {
      return undefined;
    }
  }
  return certCache.get(certPath);
}

function getOrCreateH2Session(port, certPath) {
  const key = `${port}:${certPath || ''}`;
  const existing = sessionPool.get(key);
  if (existing && !existing.destroyed && !existing.closed) {
    return existing;
  }

  const ca = getCert(certPath);
  const session = http2.connect(`https://localhost:${port}`, { ca, rejectUnauthorized: false });

  const cleanup = () => {
    if (sessionPool.get(key) === session) {
      sessionPool.delete(key);
    }
    try {
      if (!session.destroyed) session.destroy();
    } catch {
      /* ignore */
    }
  };

  session.on('error', cleanup);
  session.on('close', cleanup);
  session.on('goaway', cleanup);

  sessionPool.set(key, session);
  return session;
}

function closeAllH2Sessions() {
  for (const session of sessionPool.values()) {
    try {
      if (!session.destroyed) session.destroy();
    } catch {
      /* ignore */
    }
  }
  sessionPool.clear();
  certCache.clear();
}

/**
 * Low-level H2 ConnectRPC unary call.
 * Both JSON and Proto callers delegate here — the only difference is
 * `contentType`, the serialised `payload` buffer, and how the caller
 * interprets the returned `Buffer`.
 */
// aislop-ignore-next-line code-quality/duplicate-block (H2 RPC call implementation)
function _makeH2UnaryCallOnce(port, csrf, certPath, method, contentType, payload, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let client;
    try {
      client = getOrCreateH2Session(port, certPath);
    } catch (err) {
      return reject(new Error('H2 connect: ' + err.message));
    }

    const chunks = [];
    let status;
    let settled = false;
    let timer = null;

    const settle = (fn, val) => {
      if (!settled) {
        settled = true;
        if (timer) clearTimeout(timer);
        fn(val);
      }
    };

    let req;
    try {
      req = client.request({
        ':method': 'POST',
        ':path': `/exa.language_server_pb.LanguageServerService/${method}`,
        'content-type': contentType,
        'connect-protocol-version': '1',
        'x-codeium-csrf-token': csrf,
      });
    } catch (err) {
      const key = `${port}:${certPath || ''}`;
      sessionPool.delete(key);
      try {
        client.destroy();
      } catch {
        /* ignore */
      }
      return settle(reject, new Error('H2 connect: ' + err.message));
    }

    timer = setTimeout(() => {
      try {
        req.close(http2.constants.NGHTTP2_CANCEL);
      } catch {
        /* ignore */
      }
      settle(reject, new Error('H2 timeout'));
    }, timeoutMs);

    req.on('response', (h) => {
      status = h[':status'];
    });
    req.on('data', (d) => {
      chunks.push(d);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (status === 200) {
        settle(resolve, body);
      } else {
        settle(reject, new Error(`HTTP ${status}: ${body.toString('utf8').substring(0, 1000)}`));
      }
    });
    req.on('error', (e) => {
      settle(reject, e);
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Low-level H2 ConnectRPC streaming call (server-streaming).
 * The server streams responses after receiving our single request frame.
 * Timeout resolution (not rejection) is intentional — the sidecar starts
 * processing asynchronously and we poll for results separately.
 */
function _makeH2StreamingCallOnce(port, csrf, certPath, method, contentType, payload) {
  return new Promise((resolve, reject) => {
    let client;
    try {
      client = getOrCreateH2Session(port, certPath);
    } catch (err) {
      return reject(new Error('H2 connect: ' + err.message));
    }

    let status;
    const chunks = [];

    const timer = setTimeout(() => {
      resolve(); // streaming RPC — timeout is normal, means server started streaming
    }, 30000);

    let req;
    try {
      req = client.request({
        ':method': 'POST',
        ':path': `/exa.language_server_pb.LanguageServerService/${method}`,
        'content-type': contentType,
        'connect-protocol-version': '1',
        'x-codeium-csrf-token': csrf,
      });
    } catch (err) {
      clearTimeout(timer);
      const key = `${port}:${certPath || ''}`;
      sessionPool.delete(key);
      try {
        client.destroy();
      } catch {
        /* ignore */
      }
      return reject(new Error('H2 connect: ' + err.message));
    }

    req.on('response', (h) => {
      status = h[':status'];
    });
    req.on('data', (d) => {
      chunks.push(d);
    });
    req.on('end', () => {
      clearTimeout(timer);
      if (status === 200) resolve();
      else {
        const body = Buffer.concat(chunks).toString('utf8');
        reject(new Error(`HTTP ${status}: ${body.substring(0, 1000)}`));
      }
    });
    req.on('error', (e) => {
      clearTimeout(timer);
      if (status === 200 || chunks.length > 0) resolve();
      else reject(e);
    });
    req.write(payload);
    req.end();
  });
}

/** Retry wrapper for transient H2 connect/timeout errors */
async function _withRetry(fn, retries = 2, retryOnTimeout = true) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const isTimeout = e.message.includes('H2 timeout');
      const isConnect = e.message.includes('H2 connect:');
      // Don't retry on timeout if caller set a custom (long) timeout — the request legitimately failed
      if (attempt < retries && (isConnect || (isTimeout && retryOnTimeout))) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}

/** Make a unary H2+JSON ConnectRPC call (with automatic retry) */
async function makeH2JsonCall(port, csrf, certPath, method, body, retries = 2, timeoutMs = 10000) {
  const payload = Buffer.from(JSON.stringify(body));
  // If caller set a custom timeout (e.g. for inference), don't retry on timeout — the request ran its full duration
  const retryOnTimeout = timeoutMs <= 10000;
  const raw = await _withRetry(
    () => _makeH2UnaryCallOnce(port, csrf, certPath, method, 'application/json', payload, timeoutMs),
    retries,
    retryOnTimeout,
  );
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    return raw.toString('utf8');
  }
}

/** Make a streaming H2+JSON ConnectRPC call */
function makeH2StreamingCall(port, csrf, certPath, method, body) {
  const payload = Buffer.from(JSON.stringify(body));
  return _makeH2StreamingCallOnce(port, csrf, certPath, method, 'application/json', payload);
}

/** Make a unary H2+Proto ConnectRPC call (with automatic retry) */
async function makeH2ProtoCall(port, csrf, certPath, method, protoBytes, retries = 2) {
  const payload = Buffer.from(protoBytes);
  const raw = await _withRetry(
    () => _makeH2UnaryCallOnce(port, csrf, certPath, method, 'application/proto', payload),
    retries,
  );
  return new Uint8Array(raw);
}

/** Make a streaming H2+Proto ConnectRPC call */
function makeH2ProtoStreamingCall(port, csrf, certPath, method, protoBytes) {
  const payload = Buffer.from(protoBytes);
  return _makeH2StreamingCallOnce(port, csrf, certPath, method, 'application/proto', payload);
}

// aislop-ignore-next-line code-quality/duplicate-block (Connect RPC helper implementation)
function makeConnectRpcCallOnPort(port, csrf, certPath, servicePath, payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path: servicePath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
        'x-codeium-csrf-token': csrf,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
    };

    if (certPath) {
      try {
        options.ca = fs.readFileSync(certPath);
      } catch {
        /* ignore */
      }
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 1000)}`));
        }
      });
    });

    req.on('error', (err) => {
      // If HTTPS fails, try HTTP
      if (
        err.code === 'ERR_SSL_WRONG_VERSION_NUMBER' ||
        err.message.includes('SSL') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('disconnected') ||
        err.message.includes('EPIPE')
      ) {
        const httpOpts = { ...options };
        delete httpOpts.ca;
        delete httpOpts.rejectUnauthorized;
        const httpReq = http.request(httpOpts, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve(body);
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 1000)}`));
            }
          });
        });
        httpReq.on('error', reject);
        httpReq.setTimeout(10000, () => {
          httpReq.destroy(new Error('Timeout'));
        });
        httpReq.write(payload);
        httpReq.end();
      } else {
        reject(err);
      }
    });
    req.setTimeout(10000, () => {
      req.destroy(new Error('Timeout'));
    });
    req.write(payload);
    req.end();
  });
}

module.exports = {
  makeH2JsonCall,
  makeH2StreamingCall,
  makeH2ProtoCall,
  makeH2ProtoStreamingCall,
  makeConnectRpcCallOnPort,
  closeAllH2Sessions,
};
