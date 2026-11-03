import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','realtime/wrangler.jsonc','--dry-run','--outdir',resolve(root,'.plaza-worker')],{cwd:root,stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
if(result.error)throw result.error;process.exitCode=result.status??1;
