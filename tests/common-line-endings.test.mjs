import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
test('common-source verification accepts Windows line endings but detects real source changes',()=>{
 const root=mkdtempSync(join(tmpdir(),'berry-common-'));
 try{
  mkdirSync(join(root,'scripts'));mkdirSync(join(root,'src'));const source='export const answer = 42;\n';
  const hash=createHash('sha256').update(source).digest('hex');writeFileSync(join(root,'scripts/common-manifest.json'),JSON.stringify({files:{'src/sample.ts':hash}}));writeFileSync(join(root,'src/sample.ts'),source.replaceAll('\n','\r\n'));
  const checker=resolve('scripts/check-common.mjs');assert.match(execFileSync(process.execPath,[checker],{cwd:root,encoding:'utf8'}),/verified/);
  writeFileSync(join(root,'src/sample.ts'),source.replace('42','41'));assert.throws(()=>execFileSync(process.execPath,[checker],{cwd:root,stdio:'pipe'}));
 }finally{rmSync(root,{recursive:true,force:true});}
});