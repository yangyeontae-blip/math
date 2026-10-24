import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const manifest=JSON.parse(readFileSync('scripts/common-manifest.json','utf8'));
const digest=data=>createHash('sha256').update(data).digest('hex');
const peer=process.argv.find(a=>a.startsWith('--peer='))?.slice(7);
for(const [file,hash] of Object.entries(manifest.files)){
 if(digest(readFileSync(file))!==hash)throw Error(`Common source changed without synchronization: ${file}`);
 if(peer&&digest(readFileSync(resolve(peer,file)))!==hash)throw Error(`Peer common source differs: ${file}`);
}
if(process.argv.includes('--upstream')){
 const headResponse=await fetch('https://api.github.com/repos/yangyeontae-blip/math/git/ref/heads/main',{cache:'no-store'});
 if(!headResponse.ok)throw Error(`Canonical web revision unavailable: ${headResponse.status}`);
 const head=await headResponse.json();const sha=head.object?.sha;
 if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('Invalid canonical web revision');
 const response=await fetch(`https://raw.githubusercontent.com/yangyeontae-blip/math/${sha}/scripts/common-manifest.json`);
 if(!response.ok)throw Error(`Common source manifest unavailable: ${response.status}`);
 const upstream=await response.json();if(upstream.generation!==manifest.generation)throw Error('Web/app common source generations differ. Synchronize both repositories.');
}
console.log(`${Object.keys(manifest.files).length} common sources verified${peer?' against peer':''}.`);
