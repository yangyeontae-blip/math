# 베리숲 모험학교 작업 규칙

초등학교 3학년 수학 학습 RPG(TypeScript · Three.js · Vite). 사용자는 현직 교사이며 학생은 초3입니다.

## Protected behaviors (허락 없이 바꾸지 않기)
아래는 버그가 아니라 **의도된 설계**입니다. 개선·리뷰·리팩터링 중에도 사용자가 명시적으로 요청하기 전에는 바꾸지 마세요. 바꾸는 게 좋겠다 싶으면 수정하지 말고 "제안"으로 따로 적어 허락을 구하세요.
- 교사용 코드는 `teacher`입니다(`src/rules.ts`의 `TEACHER_CODE_HASH`는 이 코드의 SHA-256).
- `levelup`, `levelup1`, `levelup10`, `showmethemoney`, `greedisgood`은 교사 모드 없이도 누구나 쓸 수 있습니다. 교사 모드 뒤로 숨기지 마세요.
- 오답·대련 중단에 손실이 없고, 몬스터 보상과 레벨업은 바로 저장됩니다.
- 저장 키 `berry-forest-save-v1`과 저장 파일 구조(version 12)는 마이그레이션 없이 바꾸지 마세요.
- 이 동작들은 `tests/protected-behavior.test.ts`가 고정합니다. 테스트를 고쳐서 통과시키지 마세요.

## 작업 방식
- "리뷰하고 개선해줘" 같은 넓은 요청에는 **먼저 번호 목록으로 제안만** 하고, 사용자가 고른 번호만 구현합니다. 동작이 바뀌는 항목은 따로 표시하세요.
- 변경 후에는 `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`를 모두 통과시킨 뒤 끝났다고 보고하세요.
- 사용자가 눈으로 보는 변경은 빌드 결과를 브라우저에서 직접 열어 확인하고, 확인하지 못한 부분은 못 했다고 말하세요.

## 환경 (Windows · PowerShell · 한국어)
- 셸은 PowerShell(5.1)입니다. `&&` 대신 `;`를 쓰고, 파일은 UTF-8로 저장하세요(메모장 붙여넣기를 시키지 마세요).
- 경로가 길어지면 git이 실패합니다. 작업 복사본은 `C:\w\math`처럼 짧은 경로에 두세요.
- 이 PC에는 GitHub 로그인 정보가 없습니다. 푸시는 사용자가 PowerShell에서 `git push origin main`을 직접 실행합니다(로그인 창은 사용자가 조작). 로그인·토큰 입력을 대신하지 마세요.
- git `--amend` 같은 히스토리 변경은 쓰지 말고 새 커밋을 만드세요.

## 배포
- 게임(프런트): `main`에 푸시하면 GitHub Actions(`deploy-pages.yml`)가 타입체크·테스트·빌드 후 GitHub Pages에 배포합니다.
- 랭킹·협동 보스 서버(`worker/index.js`, D1 `drizzle/`): `*.chatgpt.site` 호스팅에 따로 배포해야 하며 Claude는 접근할 수 없습니다. 서버 코드를 바꾸면 바뀐 파일과 수동 배포 방법을 안내하세요. 새 테이블이 필요하면 `drizzle/*.sql` 마이그레이션이 함께 적용되어야 합니다.
- 서버가 옛 버전이어도 게임이 깨지지 않게 만드세요(클라이언트는 서버 오류를 "준비 중"으로 처리).

## 구조 빠른 안내
`src/rules.ts` 규칙·저장 검증 / `src/curriculum.ts` 단원 문제 / `src/world.ts` 3D 월드 / `src/main.ts` 화면·입력 / `src/boss.ts`·`report.ts`·`speech.ts`·`backup.ts` 보조 기능 / `worker/index.js` 서버. 자세한 내용은 README.md.