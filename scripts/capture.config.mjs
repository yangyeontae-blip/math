import { defineConfig } from '@playwright/test';
// 화면 확인 캡처 전용 설정(검사용 아님). 포트 4183, 광장 서버 없이 실행.
export default defineConfig({ testDir:'.', testMatch:/capture-.*\.spec\.mjs/, timeout:180000, workers:1, reporter:'list',
 use:{baseURL:'http://127.0.0.1:4183',channel:'chromium',headless:true,launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
 projects:[{name:'desktop',use:{viewport:{width:1280,height:800}}}],
 webServer:[{command:'pnpm run build:browser && pnpm exec vite preview --host 127.0.0.1 --port 4183 --strictPort',cwd:'..',url:'http://127.0.0.1:4183',env:{...process.env,VITE_PLAZA_URL:'ws://127.0.0.1:5999',VITE_COMMUNITY_URL:'http://127.0.0.1:5998/api/community'},reuseExistingServer:false,timeout:180000}] });
