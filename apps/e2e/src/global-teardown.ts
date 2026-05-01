import { stopServers } from './server-manager';

export default async function globalTeardown() {
  await stopServers();
}
