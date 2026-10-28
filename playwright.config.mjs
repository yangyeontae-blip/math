import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./e2e', timeout:90000, globalTimeout:720000, maxFailures:1, workers:1, retries:0, reporter:'list',
 use:{baseURL:'http://127.0.0.1:4173',channel:'chromium',headless:true,actionTimeout:15000,trace:'retain-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
 projects:[{name:'desktop',use:{viewport:{width:1280,height:800}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
 webServer:{command:'pnpm run build:browser && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:120000}
});
