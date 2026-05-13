import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localMaspPath = resolve(process.cwd(), '../ro-crate-masp');
const useLocalMasp = process.env.CRATE_O_MASP_SOURCE
  ? process.env.CRATE_O_MASP_SOURCE === 'local'
  : existsSync(localMaspPath);
const maspTarget = useLocalMasp
  ? localMaspPath
  : 'github:Language-Research-Technology/ro-crate-maps#main';
const args = ['install', '--no-save'];

if (!useLocalMasp) {
  args.push('--prefer-online');
}

args.push(maspTarget);
console.log(`Refreshing MASP from ${useLocalMasp ? maspTarget : 'GitHub'}...`);
execFileSync('npm', args, { stdio: 'inherit' });

const installedMaspPath = resolve(process.cwd(), 'node_modules/ro-crate-maps');
const maspProfilesSourcePath = useLocalMasp ? localMaspPath : installedMaspPath;
const publicProfilesPath = resolve(process.cwd(), 'public/masp-profiles');
const profileIds = [
  'ro-crate',
  'schema-org',
  'ldac',
  'workflow',
  'software',
  'ro-crate-masp',
];

for (const profileId of profileIds) {
  const sourceDir = resolve(maspProfilesSourcePath, 'profiles', profileId, 'profile-crate');
  const targetDir = resolve(publicProfilesPath, profileId, 'profile-crate');
  mkdirSync(targetDir, { recursive: true });

  const metadataSource = resolve(sourceDir, 'ro-crate-metadata.json');
  const modeSource = resolve(sourceDir, 'crate-o-mode.json');

  if (!existsSync(metadataSource)) {
    console.warn(`Skipping ${profileId}: ${metadataSource} not found`);
    continue;
  }

  cpSync(metadataSource, resolve(targetDir, 'ro-crate-metadata.json'));

  if (existsSync(modeSource)) {
    cpSync(modeSource, resolve(targetDir, 'crate-o-mode.json'));
  }
}

console.log(`Mirrored MASP profiles into ${publicProfilesPath}`);
