import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(currentDir, 'dist');
const port = Number(process.env.PORT) || 8080;

app.use(express.static(distDir));

// Support client-side routes in the React single-page application.
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AulaControl listening on port ${port}`);
});
