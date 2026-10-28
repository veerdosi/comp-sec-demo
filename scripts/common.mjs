import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const dist = join(root, 'dist');
export const work = join(root, '.demo');
export const proofText = 'Harmless SC3010 demo: plain-crypto-js@4.2.1 postinstall executed.\n';
export const dummyEnv = '# SC3010 SYNTHETIC FIXTURE ONLY\nDEMO_API_KEY=sc3010-fake-key-not-a-real-credential\n';
export const json = path => JSON.parse(readFileSync(path, 'utf8'));
export const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
export function reset(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}
export function command(executable, args, cwd = root, show = true) {
  if (show) console.log('$ ' + executable + ' ' + args.join(' '));
  // Keep shell/runtime environment, but isolate npm from inherited user policy.
  const environment = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(executable, args, {
    cwd, encoding: 'utf8', timeout: 30_000,
    env: { ...environment, npm_config_userconfig: join(dist, 'empty.npmrc'),
      npm_config_globalconfig: join(dist, 'empty-global.npmrc'),
      npm_config_cache: join(dist, 'cache'), npm_config_update_notifier: 'false' }
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${executable} failed: ${result.error || result.stderr || result.stdout}`);
  }
  if (show && result.stdout.trim()) console.log(result.stdout.trim());
  return result.stdout;
}
export function makeVictim(name, archive) {
  const cwd = join(work, name);
  reset(cwd);
  writeFileSync(join(cwd, '.env'), dummyEnv, { mode: 0o600 });
  copyFileSync(join(root, 'victim/app.cjs'), join(cwd, 'app.cjs'));
  save(join(cwd, 'package.json'), {
    name: `victim-${name}`, version: '1.0.0', private: true,
    dependencies: { 'axios-demo': `file:../../dist/${archive}` }
  });
  return cwd;
}
export function install(cwd, ignoreScripts, show = true) {
  return command('npm', ['install', ignoreScripts ? '--ignore-scripts' : '--ignore-scripts=false',
    '--offline', '--no-audit', '--no-fund', '--foreground-scripts', '--loglevel=error'], cwd, show);
}
