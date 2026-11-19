# 아이템 디자인 검수 기록

작업 위치: `C:\w\math-items`, 브랜치 `visual/items`, 기준 커밋 `2912dc8`. 커밋·푸시·병합은 하지 않았다. 이전 세션의 완성된 아이콘·카드·모델과 전후 이미지는 보존하고, 누락된 검증·공용 해시·문서를 마무리했다. 광장 모델 병합에서 새 외곽선이 검은 표면으로 합쳐지는 호환 문제도 보완했다.

## 디자인

- v2 SVG 142개: 무기 45, 옷 35, 탈것 26, 펫 26, 보급품 10. 진한 윤곽선, 3단 명암, 하이라이트, 등급별 슬롯·광채·반짝임을 적용했다. v1 파일은 그대로 둔다.
- 검·창·활·망치·지팡이·마도서 등 실루엣과 재질·장식을 표현하고, 의상은 정면 상하의·망토·모자·벨트를 그렸다. 아이콘과 착용 모델은 공통 실루엣 목록을 사용한다.
- 상점·가방에 등급 슬롯, 강화 배지, SVG 장착 표시, 가격 배지, 현재 장비 대비 상승·하락 수치를 표시한다. 비교는 기존 규칙 함수와 실제 보유 강화 수치를 사용한다.
- 3D 장비에 셀 셰이딩과 외곽선, 커진 무기, 벨트·견장·망토 장식을 적용했다. 상위 장비의 반짝임은 저사양에서 숨긴다. 광장 병합에서도 Toon 재질과 뒷면 외곽선 재질을 보존한다.
- 이름·가격·능력치·저장 구조·게임 규칙, `tests/protected-behavior.test.ts`는 바꾸지 않았다. 캡처는 가상 기록과 격리된 Chrome 컨텍스트를 사용했다.

## 파일 목록

| 구분 | 파일 |
| --- | --- |
| SVG 생성·연결 | `scripts/generate-item-icons.mjs`, `src/equipment-art.ts`, `src/item-icon-paths.ts`, `public/art/berry-items-v2/*.svg` (142개) |
| 카드·장비 비교 | `src/main.ts`, `src/item-presentation.ts`, `src/item-equipment.css` |
| 디자인 토큰·아이콘 | `src/design-tokens.css`, `src/ui-icons.ts` |
| 3D 모델·광장 호환 | `src/world.ts`, `src/equipment-models.ts`, `src/plaza-world.ts` |
| 검증 | `tests/item-presentation.test.ts`, `scripts/capture-items.mjs`, `scripts/verify-items-production.mjs`, `scripts/local-node-host.cjs` |
| 문서·공용 해시·임시 파일 제외 | `README.md`, `scripts/common-manifest.json`, `.gitignore` |
| 이미지·증거 | `screenshots/items/before/`, `screenshots/items/after/`, 이 문서 |

공용 manifest는 기존 파일과 새 공용 모듈·v2 아트의 LF 정규화 SHA-256 및 `JSON.stringify(manifest.files)`의 SHA-256으로 갱신했다. 526개 파일을 검증했고 피어 저장소에는 복사하지 않았다. generation: `c405472036f4bcd72ad567bdfc5d01f8506678da64fcceac010d56a86f8ab111`.

## 대표 비교 4쌍

| 화면 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 무기 상점 | [전](before/desktop-shop-weapons.png) | [후](after/desktop-shop-weapons.png) |
| 의상 상점 | [전](before/desktop-shop-outfits.png) | [후](after/desktop-shop-outfits.png) |
| 가방의 무기 | [전](before/desktop-bag-weapons.png) | [후](after/desktop-bag-weapons.png) |
| 착용 의상·무기 3D 미리보기 | [전](before/desktop-shop-outfits-preview.png) | [후](after/desktop-shop-outfits-preview.png) |

기존 전후 캡처는 PC 1440×1000, 모바일 390×844에서 상점 무기·옷·펫, 가방 무기·옷·탈것 및 각각의 3D 미리보기로 총 24쌍이다. 이전 세션의 before를 다시 만들지 않았다. 각 폴더의 `evidence.json`은 12개 화면에서 페이지 오류와 가로 넘침이 없음을 기록한다.

최종 배포용 빌드의 추가 확인은 `after/production-*.png` 8개다. 테스트 전용 API가 없는 것을 확인한 뒤, 저장된 가상 시작 위치에서 E로 상점거리에 들어가 일반 메뉴로 무기·옷 상점과 가방을 열었다. PC는 일반 품질, 모바일은 저사양을 사용했다. [배포용 검증 결과](after/production-evidence.json): 두 화면 크기 모두 페이지 오류·가로 넘침 없음.

## 검사 결과

| 검사 | 결과 |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit` | 통과, 종료 코드 0 |
| `pnpm.cmd test` | 502개 통과, 실패 0, 종료 코드 0 |
| `pnpm.cmd build` | 통과, 종료 코드 0. Vite·법적 고지 복사·Worker 생성·서버 구문 검사 포함 |
| `node scripts/check-common.mjs` | 526개 통과 |
| `git diff --check` | 통과 |
| 시스템 Chrome E2E | 새벽서약 collection, legendary-style의 펫·미용실, skyward-collection을 PC·모바일에서 총 8사례 통과. 사례 종료 후 Windows 테스트 서버 정리가 끝나지 않아 실행기를 중단함 |
| 최종 소스 E2E 재확인 | 별도 서버에서 `skyward-collection.spec.mjs --project desktop` 실행, `1 passed (1.9m)`, 종료 코드 0 |
| 배포용 브라우저 확인 | 일반 메뉴로 PC·모바일 8화면 캡처, 종료 코드 0 |

새 회귀 검사 3개는 능력치 비교의 정확성·저장 불변성, 모든 ID의 v1 보존·v2 파일 연결, 광장 외곽선 보존·저사양 효과 숨김을 확인한다.

PowerShell의 실행 정책으로 `pnpm.ps1`을 실행할 수 없어 같은 CLI의 `pnpm.cmd`를 썼다. 제한된 Windows 환경의 `uv_os_get_passwd` 오류는 명시적으로 불러오는 `scripts/local-node-host.cjs`로 우회했다. 테스트·캡처 시 `NODE_OPTIONS=--require=C:/w/math-items/scripts/local-node-host.cjs`, `TEMP`·`TMP`는 작업 폴더의 `.tmp`를 사용했다. 이 보조 파일은 게임 번들·규칙·검사 내용을 바꾸지 않는다. 검사 로그와 임시 Playwright 설정은 `.tmp/items-*.log`, `.tmp/playwright-items*.config.mjs`에 있다.

빌드에는 기존의 500kB 초과 청크·정적/동적 import 혼용 경고가 남는다. 전체 E2E, 실제 휴대전화의 터치·GPU 성능, 운영 서버 연동은 이번 검증 범위에 포함하지 않았다.

## 다시 확인하기

- 테스트 빌드에서 기존 비교 캡처: `node --import tsx scripts/capture-items.mjs after http://127.0.0.1:4175/` (`VITE_BROWSER_TEST=1` 빌드 필요).
- 배포용 확인: `pnpm.cmd build` 후 `pnpm.cmd exec vite preview --host 127.0.0.1 --port 4177 --strictPort`를 실행하고 `node --import tsx scripts/verify-items-production.mjs` 실행.
- `before`는 이전 세션 원본이므로 덮어쓰지 않는다.
