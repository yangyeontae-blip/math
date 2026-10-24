import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./e2e', timeout:60000, workers:1, retries:process.env.CI?1:0,
 use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
 projects:[{name:'desktop',use:{viewport:{width:1280,height:800}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
 webServer:{command:'pnpm run build:browser && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:120000}
});
