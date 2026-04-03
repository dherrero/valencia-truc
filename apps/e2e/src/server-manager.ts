import { spawn, type ChildProcess } from 'child_process';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const rootDir = process.cwd();
const stateFile = resolve(rootDir, 'apps/e2e/.playwright/servers.json');
const nxBin = resolve(rootDir, 'node_modules/nx/bin/nx.js');

export interface ManagedServer {
  pid: number;
  command: string;
}

export async function startServers(): Promise<ManagedServer[]> {
  const commands = [
    {
      command: process.execPath,
      args: [nxBin, 'run', '@valencia-truc/backend:serve'],
    },
    {
      command: process.execPath,
      args: [nxBin, 'run', '@valencia-truc/frontend:serve'],
    },
  ];

  const pids: ManagedServer[] = [];
  const children: ChildProcess[] = [];

  try {
    for (const entry of commands) {
      const child = spawn(entry.command, entry.args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false,
        env: {
          ...process.env,
          NX_DAEMON: 'false',
        },
      });

      if (!child.pid) {
        throw new Error(`Unable to start ${entry.args.join(' ')}`);
      }

      children.push(child);
      pids.push({ pid: child.pid, command: entry.args.join(' ') });
    }

    await mkdir(resolve(rootDir, 'apps/e2e/.playwright'), { recursive: true });
    await writeFile(stateFile, JSON.stringify(pids, null, 2), 'utf8');
    return pids;
  } catch (error) {
    await Promise.all(
      children.map((child) => terminateProcess(child.pid ?? 0)),
    );
    throw error;
  }
}

export async function waitForServers(): Promise<void> {
  await waitForHttp('http://127.0.0.1:3333/api/rooms');
  await waitForHttp('http://localhost:4200');
}

export async function stopServers(): Promise<void> {
  try {
    const raw = await readFile(stateFile, 'utf8');
    const servers = JSON.parse(raw) as ManagedServer[];
    await Promise.all(servers.map((server) => terminateProcess(server.pid)));
  } catch {
    // Nothing to stop.
  }
}

async function waitForHttp(url: string): Promise<void> {
  const timeoutMs = 120_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep polling
    }

    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function terminateProcess(pid: number): Promise<void> {
  if (!pid) return;

  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: false,
    });

    await new Promise<void>((resolveKill) => {
      killer.on('close', () => resolveKill());
      killer.on('error', () => resolveKill());
    });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // Ignore stale processes.
  }
}
