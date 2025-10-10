import { PostgresInstance } from 'pg-embedded';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const serverDir = path.resolve(__dirname, '..');
const clientDir = path.resolve(__dirname, '..', '..', 'client');

const DEFAULT_PORT = 5544;
const username = process.env.DEV_PG_USER || 'postgres';
const password = process.env.DEV_PG_PASSWORD || 'postgres';
const databaseName = process.env.DEV_PG_DB || 'colibrrri_dev';
const port = Number(process.env.DEV_PG_PORT || DEFAULT_PORT);
const persistent = process.env.DEV_PG_PERSIST !== 'false';
const version = process.env.DEV_PG_VERSION || '>=15';
const dataDir = process.env.DEV_PG_DATA_DIR
  ? path.resolve(process.env.DEV_PG_DATA_DIR)
  : path.join(os.homedir(), '.colibrrri', 'embedded-postgres');
const skipDevServers = process.env.EMBEDDED_SKIP_DEV === 'true';

let keepAliveInterval = null;
let serverProcess = null;
let clientProcess = null;

const postgres = new PostgresInstance({
  port,
  username,
  password,
  persistent,
  version,
  dataDir,
});

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.chmod(dataDir, 0o700);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function stopPostgres() {
  try {
    if (postgres.isHealthy()) {
      await postgres.stop();
    }
  } catch (error) {
    console.warn('Failed to stop embedded PostgreSQL cleanly:', error.message);
  }

  if (!persistent) {
    try {
      await postgres.cleanup();
    } catch (error) {
      console.warn('Failed to clean up embedded PostgreSQL resources:', error.message);
    }
  }
}

function createConnectionString() {
  const encodedUser = encodeURIComponent(username);
  const encodedPass = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPass}@127.0.0.1:${port}/${databaseName}`;
}

async function main() {
  try {
    await ensureDataDir();

    console.log('🚀 Starting embedded PostgreSQL instance...');
    await postgres.start();

    const connectionString = createConnectionString();

    const dbExists = await postgres.databaseExists(databaseName);
    if (!dbExists) {
      await postgres.createDatabase(databaseName);
      console.log(`🆕 Created database "${databaseName}"`);
    }

    console.log(`✅ Embedded PostgreSQL ready at ${connectionString}`);

    const env = {
      ...process.env,
      DATABASE_URL: connectionString,
      DATABASE_PROVIDER: 'postgresql',
    };

    console.log('📐 Pushing Prisma schema to embedded database...');
    await run(
      'npx',
      ['prisma', 'db', 'push', '--skip-generate'],
      { cwd: serverDir, env },
    );

    console.log('🌱 Seeding development data...');
    await run(
      'npm',
      ['run', 'db:seed'],
      { cwd: serverDir, env },
    );

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down...`);
      if (serverProcess) {
        serverProcess.kill(signal);
      }
      if (clientProcess) {
        clientProcess.kill(signal);
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      await stopPostgres();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (skipDevServers) {
      console.log('✅ Embedded PostgreSQL prepared. Skipping dev servers (EMBEDDED_SKIP_DEV=true).');
      console.log(`ℹ️  Use this connection string in another terminal:\n    ${connectionString}`);
      console.log('Press Ctrl+C to stop the embedded database.');
      keepAliveInterval = setInterval(() => {}, 60_000);
      await new Promise(() => {});
    }

    console.log('▶️ Starting development servers...');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    serverProcess = spawn(
      npxCmd,
      ['nodemon', 'index.js'],
      {
        cwd: serverDir,
        env: {
          ...env,
          PORT: env.PORT || '5000',
          NODE_ENV: env.NODE_ENV || 'development',
        },
        stdio: 'inherit',
      },
    );

    clientProcess = spawn(
      npmCmd,
      ['run', 'dev'],
      {
        cwd: clientDir,
        env,
        stdio: 'inherit',
      },
    );

    const handleChildExit = async (source, code) => {
      console.log(`\n⚠️  ${source} процесс завершился с кодом ${code ?? 0}. Останавливаем окружение...`);
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
      if (clientProcess) {
        clientProcess.kill('SIGTERM');
      }
      await stopPostgres();
      process.exit(code ?? 0);
    };

    serverProcess.on('exit', (code) => handleChildExit('Server', code));
    clientProcess.on('exit', (code) => handleChildExit('Client', code));
  } catch (error) {
    console.error('❌ Failed to start embedded development environment:', error);
    await stopPostgres();
    process.exit(1);
  }
}

main();
