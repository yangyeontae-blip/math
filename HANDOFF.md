# 섬 지도와 상점거리 확대 — Claude가 마무리 (2026-10-19)

## 마무리 결과
- 휴대폰에서 지도가 왼쪽만 보이던 문제 수정: 작은 화면에서는 지도를 화면 너비에 맞추고 지역 버튼을 작게(world-map.css). 375×812에서 섬 전체와 지역 이름 7개가 겹치지 않음을 확인.
- 뒷줄 상점에 가려지던 마을 몬스터 2·3을 두 상점 줄 사이 골목(±8, -8)으로 옮김(village-layout.ts).
- 두 저장소 tsc 통과, 테스트 240/253 통과, build 통과.
- 하지 않은 것: ChatGPT 보조 주소(Sites) 반영. Claude에는 Sites 도구가 없어 하지 않았음. 푸시 뒤 GitHub Pages 배포 확인 필요.
- 다음 작업: 고칠 목록 25개를 C → B → A → D 순서로 진행.

---
아래는 Codex가 남긴 원래 인계 내용입니다.

Codex는 5시간 한도 잔여 10% 조건에 도달해 손을 뗍니다. 기존에 끝난 작업을 다시 만들지 말고 아래 미커밋 변경부터 이어가세요. 새 변경은 아직 공개 배포하지 않았습니다.

## ① 지금 하던 작업의 목표
- 광장 옆 가현이(앱에서는 목장 NPC 가명)와 호빵맨처럼 보이는 마을 안내 캐릭터를 광장에서 없애고, 그 자리까지 상점거리를 크게 조성.
- 사용자가 첨부한 메이플 빅토리아 아일랜드 지도처럼 해안선·지역별 지형과 랜드마크·연결 길·이동 지점이 있는 베리숲 고유 지도로 교체. 카드 세 장 메뉴를 지도라고 제시하지 않기.
- 공통 변경을 berry-forest-app과 형제 math에 적용. 검증 후 커밋/푸시, GitHub Pages 및 기존 ChatGPT 보조 주소 반영, 앱 웹 자산 동기화.

## ② 끝난 것
- 두 저장소의 src/world.ts에서 광장 guide/shepherd 엔티티만 제거. 펫 소유 기록이나 개인 마을 방문 주민은 삭제하지 않음. 조작 안내와 목장 기능은 메뉴에서 그대로 접근.
- 옛 장식 집·목장 화단·중앙 분수 제거. 여섯 점포 중심을 x=-16,0,16의 두 줄(z=-2.8,-13)로 확장. 기존 점포별 독립 조형 유지. 상점 포장 폭 43으로 확장.
- src/village-layout.ts의 시장 좌표·비움 구역·나무 위치 조정. 수확 나무/몬스터/베리 ID와 보상 기록 보존. 건물에 묻히는 베리는 ID 그대로 안전한 z=2.2로 표시.
- src/world-map.ts와 world-map.css 추가. 고유 SVG 섬 지형/나무/산/강/집/길/이동 지점과 HTML 지역 버튼 구성. 현재 지역 및 학년별 잠금 표시. 지도 클릭은 기존 단계 선택 메뉴로 연결.
- src/main.ts의 openNavigation을 섬 지도로 교체. 기존 메뉴 연결 유지. 빌드 식별자 2026-10-19.4.
- tests/world-map.test.ts 추가(1·3·6학년 기록 비변경, 현재 위치 하나, 1학년 나눗셈 잠금). 넓힌 시장 접근성 검사 범위도 확장.
- 격리 앱 빌드 포트 4370에서 실제 지도를 열어 1학년 잠금/현재 위치가 표시되는 것 확인. 이미지 .sites-runtime/island-map-draft.png. 최신 CSS 크기 조정 전 이미지임.
- Sites 공식 helper로 기존 소스 열기 완료. 아직 새 변경은 Sites 체크아웃으로 복사하지 않음. 마지막 opening commit 9e69771120c7dcfe03c447fc5a36dacfbbcf431a.

## ③ 남은 할 일 (순서대로)
1. 두 저장소 CLAUDE.md·작업 상태·위 변경을 읽고 사용자가 제공한 지도 참고 이미지와 실제 지도 시각 품질을 확인. 마지막 지도 CSS 너비/제목 여백 변경 후 빌드 재실행. PC·모바일에서 지도 읽기/팬/지역 버튼/뒤로가기, 넓힌 상점 동선과 제거 캐릭터 부재 확인.
2. 앱/무료판 최종 tsc·전체 test·build 통과를 확인. 앱 Capacitor sync 재실행(마지막 CSS 변경 이후 자산은 아직 재동기화하지 않음). 검사 통과한 상태에서만 커밋.
3. 기존 버전별 차이를 보존해 두 저장소 커밋·푸시. 충돌/원격 새 변경은 보존해 합치고 다시 검사. 강제 푸시나 reset 금지.
4. GitHub Pages 자동 배포 성공 및 2026-10-19.4 실제 파일 확인.
5. ChatGPT 보조 주소는 Sites 공식 skill/helper로만 반영. 현재 Codex 인메모리 자격 증명은 인계하지 않음. Claude에서 Sites MCP가 제공되지 않으면 임의 API/토큰 우회 없이 GitHub 배포와 로컬 검증을 완료하고 보조 주소 미반영을 명확히 남길 것.
6. HANDOFF.md를 실제 최종 상태로 갱신하고 완료/미완료를 사용자에게 정확히 보고.

## ④ 아직 확인 못 한 것·주의할 점
- 현재 변경은 미커밋. 마지막 공개 버전은 .3, Sites v49. 새 .4가 배포됐다고 말하지 않기.
- 마지막 CSS 조정 후 화면 확인/빌드, 모바일 실제 지도 팬과 지역 이동, 확장 상점 수동 동선 검증 미완료. 실제 iOS/Android 기기는 미검증.
- 사용자 마지막 지도 참고 이미지: C:/Users/Yeontae/AppData/Local/Temp/codex-clipboard-976db9fc-debe-40e4-ab38-6fe51d70f8e0.png . 원본 그림을 복제하지 말고 베리숲 고유 아트로 같은 구조와 완성도를 목표로 할 것.
- 기존 v21 저장 키/필드, 교사·치트·복구 코드, 즉시 저장, 오답/중단 무손실, protected-behavior 테스트 유지. src/rules.ts와 src/homestead.ts는 이번 변경에서 수정하지 않았음.
- 앱과 math의 NPC/결제/온라인 차이를 유지. main.ts/world.ts를 서로 통째로 덮어쓰지 말 것.
- Sites skill: C:/Users/Yeontae/.codex/plugins/cache/openai-curated-remote/sites/1.0.0/skills/sites/SKILL.md . 체크아웃은 앱 .sites-runtime/math-publish, 프로젝트 appgprj_6ab0d676806081919ac75a60ec619e01. 기존 Worker/DB/hosting 설정 보존. 자격 증명은 파일/로그에 저장하지 않기.
- 사용자 미리보기 4320은 math dist를 제공하며 유지. 격리 앱 preview 4370도 현재 실행 중. 브라우저 사용자 저장은 수정하지 않았음.
- 기존 pnpm wrapper는 샌드박스 EPERM이 날 수 있음. 설치된 node_modules/typescript/bin/tsc, tsx/dist/cli.mjs, vite/bin/vite.js를 node로 직접 실행해 동일 검사를 할 수 있음.
- math 작성자 설정이 없으면 앱 저장소의 기존 git config user.name/user.email을 해당 git 명령의 -c 옵션에만 사용. 전역 사용자 설정 변경 금지.

## ⑤ 마지막 tsc / test / build 결과
- 앱: tsc 통과 / 전체 테스트 239개 통과 / production build 및 Capacitor sync 통과. 이후 world-map.css의 max-width/제목 여백만 변경하여 최종 build/sync 재실행 필요.
- math: tsc 통과 / 전체 테스트 252개 통과 / production build 통과. 이후 동일 CSS 변경으로 최종 build 재실행 필요.
- Sites: 새 변경 미복사·미검사·미배포. 기존 v49만 정상 배포 상태.
- 로그: 앱 .sites-runtime/island-tests.log, island-build.log; math 루트 island-tests.log, island-build.log.
