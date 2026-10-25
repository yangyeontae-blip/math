import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
const peer=process.argv[2];if(!peer)throw Error('Usage: node scripts/sync-common.mjs /path/to/peer');
const manifest=JSON.parse(readFileSync('scripts/common-manifest.json','utf8'));
for(const file of Object.keys(manifest.files)){const destination=resolve(peer,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(file,destination);manifest.files[file]=createHash('sha256').update(readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');}
manifest.generation=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
const text=JSON.stringify(manifest,null,2)+'\n';writeFileSync('scripts/common-manifest.json',text);writeFileSync(resolve(peer,'scripts/common-manifest.json'),text);
console.log('Common modules synchronized. Run checks in both repositories before committing.');
