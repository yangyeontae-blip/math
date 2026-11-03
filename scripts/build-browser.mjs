import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{stdio:'inherit',windowsHide:true,env:{...process.env,VITE_BROWSER_TEST:'1'}});
if(result.error)throw result.error;
process.exitCode=result.status??1;
