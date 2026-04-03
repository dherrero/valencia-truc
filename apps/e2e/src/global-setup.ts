import { startServers, waitForServers } from './server-manager';

export default async function globalSetup() {
  await startServers();
  await waitForServers();
}
