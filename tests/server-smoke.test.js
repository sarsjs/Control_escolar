import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const portServer = createServer();
await new Promise((resolve, reject) => {
  portServer.once('error', reject);
  portServer.listen(0, '127.0.0.1', resolve);
});
const { port } = portServer.address();
await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));

const child = spawn(process.execPath, ['server.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.setEncoding('utf8').on('data', chunk => { logs += chunk; });
child.stderr.setEncoding('utf8').on('data', chunk => { logs += chunk; });

try {
  let response;
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early (code ${child.exitCode}). Output: ${logs}`);
    }
    try {
      response = await fetch(`http://127.0.0.1:${port}/healthz`);
      break;
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }

  assert.ok(response, `Server did not become ready. Last error: ${lastError}. Output: ${logs}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'aulacontrol' });

  const invalidSessionResponse = await fetch(`http://127.0.0.1:${port}/api/admin/provision-account`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer definitely-not-a-valid-firebase-token',
    },
    body: JSON.stringify({ role: 'teacher', schoolId: 'test-school', linkedEntityId: 'test-user', email: 'teacher@example.com', name: 'Test Teacher' }),
  });
  assert.equal(invalidSessionResponse.status, 401, 'Invalid bearer tokens must be rejected as unauthenticated.');
  console.log('Server smoke test passed: /healthz returned HTTP 200 and invalid Firebase sessions returned HTTP 401.');
} finally {
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    delay(3000),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
