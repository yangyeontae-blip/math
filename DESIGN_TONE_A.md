# 베리숲 A안 디자인 작업 보고

작업 위치는 `C:\w\math-design`, 브랜치는 `design/tone-a`, 비교 기준 커밋은 `4ee86d9`이다. 크림 종이·나무·잎의 분위기를 유지하면서 ‘펼친 모험 수첩’이라는 구성 의도로 다듬었다. 커밋·푸시·병합은 하지 않았다.

## 단계별 변경과 파일

| 단계 | 변경 내용 | 파일 |
|---|---|---|
| 0 | 시스템 Chrome 우선, 독립 저장소·가상 온라인 응답, 두 화면 크기의 캡처 스크립트. 폰트와 살롱 초상화 생성 완료 후 촬영 | `scripts/capture-design.mjs`, `screenshots/before/` |
| 1 | A안 `--color-*` 토큰, 진초록 주요 버튼, 14px 이상 안내·상태 글자와 진한 보조색 | `src/design-tokens.css`, `src/style.css` 및 아래 CSS 목록 |
| 2 | 24px 상자·1.75px 선·currentColor·장식용 aria-hidden SVG를 한 파일에 정의. 메뉴·HUD·랭킹·가격·오류·칭호·문제창 조작 아이콘에 적용 | `src/ui-icons.ts`, `src/main.ts`, `src/plaza-controller.ts`, `src/plaza-chat-view.ts`, `src/forest-party-controller.ts`, `src/titles.ts` |
| 3 | 일반 버튼 14px, 카드 16px, 창 24px 모서리와 역할별 그림자 3단계. 일반 UI 여백을 4px 단위로 정리 | 아래 CSS 목록 |
| 4 | PC는 왼쪽 소개·날씨와 오른쪽 등록, 휴대폰은 세로 한 줄. 저장·이동 같은 보조 조작보다 출발을 먼저 배치 | `src/main.ts`, `src/style.css` |
| 4 보완 | 외부 웹폰트 실패를 확인해 OFL 글꼴의 로컬 WOFF2 서브셋 추가. 제목은 수첩풍 세리프, 본문은 실제 굵기 축을 가진 가변 산세리프. 두 파일 합계 1,349,288바이트 | `index.html`, `src/design-tokens.css`, `public/fonts/`, `scripts/generate-design-fonts.py`, `THIRD_PARTY_NOTICES.md` |
| 5 | 랭킹 0건·연결 실패, 서버 준비 중, 광장 연결 끊김, 날씨 실패에 문제와 다음 행동을 함께 안내. 기존 새로고침·접기·숨김 조작 유지 | `src/main.ts`, `src/hall-controller.ts`, `src/plaza-controller.ts` |
| 6 | 같은 스크립트로 변경 후 28장, 원래 커밋의 격리 사본에서도 변경 전 28장 촬영 | `screenshots/after/`, `screenshots/before/`, `screenshots/README.md` |
| 7 | 실제 흐름 E2E 추가·수정, 공용 파일 해시·generation 재계산, Windows 제한 환경용 실행 보조 | `e2e/design-tone-a.spec.mjs`, `e2e/dawn-release.spec.mjs`, `playwright.design.config.mjs`, `scripts/common-manifest.json`, `scripts/sandbox-user-info.mjs`, `.gitignore` |

수정한 기존 CSS 전체:

```text
src/academy.css          src/account.css          src/adventure.css
src/astral-study.css     src/career.css           src/community.css
src/dawn-collection.css  src/feedback-ui.css      src/feedback.css
src/forest-party.css     src/forest-trail.css     src/garden.css
src/graphics-recovery.css src/hall.css            src/home-editor.css
src/homestead.css        src/item-icons.css       src/item-rarity.css
src/navigation.css       src/notices.css          src/plaza.css
src/salon.css            src/save-status.css      src/skyward-collection.css
src/style.css            src/world-map.css
```

색·글자·모서리·그림자는 기존 구성 요소의 선언에 연결했다. 시작 화면의 중복 규칙은 같은 파일 안의 한 구간으로 모았다. 지도 좌표·학습 도형·스킬 그림·원형 조작부·칭호 장식은 일반 카드 규격의 예외다. 캐릭터나 상품의 그림 자산을 탐색 아이콘으로 바꾸지 않았다.

기존 ID·class·data-* 선택자와 숨김·접기 동작을 유지했다. `keepQuestClearOfProfile`은 그대로 두었다. 게임 규칙·저장 구조·서버·문제 생성과 `tests/protected-behavior.test.ts`는 수정하지 않았다.

## 대비 전후

수치는 지정된 전경색·배경색의 sRGB 상대 휘도로 계산했다. 그라데이션이었던 버튼은 양 끝 값을 표시했다. 이는 전체 게임의 모든 픽셀에 대한 접근성 인증을 의미하지 않는다.

| 대상 | 변경 전 | 변경 후 색상 | 변경 후 |
|---|---:|---|---:|
| 주요 버튼 | 1.89~3.11:1 | `#FFFEF0` / `#36774B` | **5.31:1** |
| 일반 안내문 | 3.76:1 | `#6D624F` / `#FFF3D6` | **5.43:1** |
| 시작 캐릭터 설명 | 3.22:1 | `#6D624F` / `#FFFAEE` | **5.74:1** |
| 시작 저장 안내 | 3.02:1 | `#6D624F` / `#FFFAEE` | **5.74:1** |
| 살롱 리본 | 2.51:1 | `#FFFEF0` / `#9C5264` | **5.44:1** |
| 전당 보조 글자 | 3.59:1 | `#6D624F` / `#FFFDF3` | **5.87:1** |
| 랭킹 오류 안내 | — | `#9C3F4B` / `#FFF3D6` | **5.90:1** |

캡처의 표본 안내·상태 요소에서는 14px 미만과 페이지 가로 넘침이 없었다. Chrome에서 로컬 본문·제목 글꼴의 `loaded` 상태도 확인했다. 390×844 첫 화면에서 출발 버튼은 y=610~664px 범위에 들어온다.

## 남은 이모지와 이유

탐색·HUD·메뉴·가격·랭킹 오류에서 교체 대상으로 지정한 색 이모지는 SVG로 바꿨다. 소스의 기존 이모지 데이터는 저장·콘텐츠 구조를 건드리지 않도록 남겨 두고, 해당 UI를 그릴 때 변환한다.

| 남은 범위와 목록 | 남긴 이유 |
|---|---|
| 수학 문제 속 몬스터 그림: `🌱 🍄 ☁️ 🌰 🐝 🐱 🦊 🐑 🐻` | 문제 속 캐릭터·학습 맥락이다. 문제 본문·그림·정답 선택지에는 아이콘 변환을 적용하지 않았다. |
| 학습 교구·문제 데이터의 기호·그림: `🐾 ☀ 📖 ♻ 🔢 📏 🕰️ 🧪 📦 🔟 🍕 🧩 🟡` | 학습 자료 자체는 유지했다. 같은 데이터가 단원 지도나 메뉴의 표지로 쓰일 때는 선화 SVG로 표시한다. |
| 광장 인사 말풍선의 `👋 💛 ✨ 🌿` | 학생 사이에 전달되는 표현 내용과 프로토콜을 유지했다. 인사를 고르는 버튼은 SVG로 바꿨다. 학생이 직접 쓴 채팅은 변환하지 않는다. |
| `↗ → ← ✓ × ✦` 등의 문자 기호 | 이동 방향·완료·닫기·별 기록을 뜻하는 문자다. 색 이모지 아이콘과 구분해 유지했다. 캡처의 메뉴 검사에 남은 `↗` 두 건은 같은 상점 이동 화살표다. |

## 전후 이미지와 대표 비교 5쌍

각 폴더에 28장, 합계 56장이다. PC는 1280×800, 휴대폰은 390×844이며 가상 닉네임은 모두 ‘베리’다. 시스템 Chrome 157.0.8103.79를 사용했다. 교사 코드·설정 창은 촬영하지 않았다.

전체 14개 화면의 PC·휴대폰 경로는 [캡처 목록](screenshots/README.md)에 있다. 랭킹은 내용이 보이도록 창 안을 스크롤했다. 기상청·랭킹·서버 응답은 촬영용 가상 응답으로, 실제 서비스의 상태를 주장하는 증거가 아니다.

| 대표 비교 | 변경 전 | 변경 후 | 확인할 점 |
|---|---|---|---|
| PC 시작 | [before](screenshots/before/pc-start.png) | [after](screenshots/after/pc-start.png) | 긴 단일 카드에서 수첩 소개·등록의 두 영역으로 변경 |
| 휴대폰 시작 | [before](screenshots/before/mobile-start.png) | [after](screenshots/after/mobile-start.png) | 첫 화면 안의 출발 버튼, 읽을 수 있는 저장·날씨 안내 |
| PC 문제 풀이 | [before](screenshots/before/pc-question.png) | [after](screenshots/after/pc-question.png) | 주요 조작 대비, 문제 그림 보존, 조작 아이콘 구분 |
| 휴대폰 살롱 | [before](screenshots/before/mobile-salon.png) | [after](screenshots/after/mobile-salon.png) | 설명·착용 상태의 글자, 공통 종이색과 열매색 포인트 |
| 휴대폰 랭킹 실패 | [before](screenshots/before/mobile-ranking-error.png) | [after](screenshots/after/mobile-ranking-error.png) | 선화 상태 아이콘, 실패 이유와 다음 행동 |

## CHECKLIST.md 초안

항목 8개의 `항목 | AI가 처음 준 것 | 내가 바꾼 것 | 바꾼 이유` 표는 [CHECKLIST-design-draft.md](CHECKLIST-design-draft.md)에 따로 준비했다. 기존 과제 체크리스트에 옮길 수 있는 초안이며 실제 체크리스트를 임의로 채점하지 않았다.

## 검사 결과와 한계

| 검사 | 결과 |
|---|---|
| `pnpm exec tsc --noEmit` | 통과 |
| `pnpm test` | 482개 통과, 실패·건너뜀 0 |
| `pnpm build` | 통과. 브라우저·서버 산출물 생성과 서버 구문 검사 완료 |
| `node scripts/check-common.mjs` | 공용 파일 374개 검증. 해시와 generation만 이 worktree에서 재계산했고 피어로 복사하지 않음 |
| 관련 E2E | PC·휴대폰 합계 20개 통과. core-flows 6개, 디자인 6개, 살롱·칭호·보유품 4개, 전당 2개, 지도·직업 터치 크기 2개 |
| 전후 화면 | 원본 커밋 격리 사본과 수정본을 같은 스크립트로 촬영. 폰트 로드·표본 글자 크기·화면 넘침·남은 메뉴 문자를 캡처 JSON에도 기록 |

초기 실행 실패와 처리:

- 이 Windows 제한 환경의 `uv_os_get_passwd` 실패로 tsx 초기화가 중단됐다. OS 계정 조회가 실패한 경우만 환경변수를 쓰는 `scripts/sandbox-user-info.mjs`로 해결했다. 테스트·단언을 변경하지 않았다.
- 새 디자인 테스트가 처음에는 휴대폰도 펼침으로 시작한다고 가정했다. 기존 휴대폰 접힘 기본값을 읽고 두 방향의 전환을 확인하도록 고쳤다.
- 기존 dawn E2E의 이모지 포함 텍스트 단언은 새 텍스트와 나침반 SVG 존재 단언으로 갱신했다. 크기·진도·동작 검사는 유지했다.
- 자동 서버 실행의 Windows 종료 단계가 대기하는 환경 문제가 있었다. 최종 검사는 테스트 서버를 별도 실행하고 외부 서버 모드로 수행해 정상 종료했다.
- 외부 웹폰트 네트워크 실패는 로컬 OFL 글꼴 서브셋으로 해결했다.

전체 E2E 디렉터리의 모든 spec, 실제 휴대기기, 실제 서비스에 기록을 쓰는 온라인 검사는 실행하지 않았다. 브라우저의 휴대폰 에뮬레이션과 격리된 로컬 테스트 서버 범위다. Vite의 기존 대형 청크·중복 정적/동적 import 경고는 남아 있다.

재현 시 PowerShell에서는 `pnpm.cmd`를 사용했다. 제한 환경의 테스트 실행 예시는 다음과 같다.

```powershell
$env:TEMP = 'C:\w\math-design\.design-tmp'
$env:TMP = $env:TEMP
$env:NODE_OPTIONS = '--import=file:///C:/w/math-design/scripts/sandbox-user-info.mjs'
pnpm.cmd test
```

최종 로그는 `design-test-final.log`, `design-e2e-final.log`, `design-build.log`, `design-capture-final.log`에 있다. 로그와 `.design-tmp/`는 Git에 포함되지 않는다. 임시 사본·프로필을 제외한 제출 자료는 이 보고서, 체크리스트 초안, `screenshots/`와 변경 소스다.
