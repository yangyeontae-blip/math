# UI와 전직 수학 수련 변경 · 2026-11-20

오른쪽 위 메뉴와 상태창에 원본 메이플스토리 Light·Bold를 내장했습니다. 지갑의 선 아이콘을 새로 생성한 컬러 베리로 바꾸고, 왼쪽 ‘지금 할 일’ 안내판과 설정 토글을 제거했습니다. 오늘의 모험·미션·수첩·의견 보내기는 지도에서 열 수 있습니다. 휴대폰 메뉴는 프로필 패널 높이에 맞춰 내려가며 상태창은 이름·직업·능력치·장비 순서로 표시합니다.

## 전직 수련

| 차수 | 필요 레벨 | 맞힐 문제 |
| --- | --- | --- |
| 1차 | 10 | 5 |
| 2차 | 30 | 10 |
| 3차 | 60 | 15 |
| 4차 | 100 | 20 |
| 5차 | 200 | 25 |

모험학교에서 직업을 선택하고 전직 수련을 시작합니다. 시작 이후 수학숲 친구와의 시합과 신비의 대련장에서 직접 맞힌 정답을 합산합니다. 오답 후 다시 맞히거나 힌트를 써도 한 문제로 세며, 같은 문제의 중복 제출은 세지 않습니다. 허수아비 연습으로 전직 수련을 완료하지 않습니다. 진행은 직업별로 저장되어 새로고침·직업 변경 후에도 이어집니다. 목표를 채운 뒤 모험학교에서 전직을 완료합니다. 이미 받은 직업·전직·수련 완료 기록은 보존됩니다. 저장 키와 게임 저장 형식 v26을 유지하고 career.mathTrials를 선택 필드로 추가했습니다.

## 이미지 자산

- 도구: 내장 image_gen (CLI/API 우회 사용 없음)
- 최종 파일: public/art/berry-watercolor.png (웹판과 앱에 동일한 PNG 복사)
- 투명 배경 유지. 40px 지갑 아이콘과 상태창 엠블럼에 사용.
- 글꼴 이용조건: public/fonts/LICENSE-Maplestory.txt

생성 프롬프트:

```text
Use case: illustration-story. Asset type: small currency icon for a Korean cozy forest adventure game, displayed at 36-44 pixels. Primary request: one adorable colorful wild berry, Studio Ghibli inspired hand-painted woodland storybook art. Subject: a plump ruby-red strawberry-shaped woodland berry with a few tiny golden seeds, two lush emerald green leaves and a curled short stem, soft rosy highlights, appealing slightly asymmetrical organic silhouette. Composition: single isolated berry centered, fills 88 percent of square canvas, bold readable shape at small size, absolutely transparent background. Style: charming hand-painted animation cel with restrained watercolor texture, warm delicate dark-red outlines, soft dimensional shading, rich natural colors. Constraints: no face, no eyes, no arms, no text, no watermark, no surrounding objects, no frame, no background or cast shadow. Transparent background with clean alpha edges.
```

## 검증

웹판 단위 테스트 505개, 앱 단위 테스트 458개 통과. 양쪽 타입 검사·제작 빌드 통과. Android·iOS Capacitor 자산 동기화 완료. 화면 및 전직 시나리오 검사는 로컬 Chrome의 기본 그래픽 설정으로 실행합니다. Windows에서 강제 CPU 렌더러로 여러 3D 장면을 연속 실행할 때 시작 버튼 작업이 지연되는 환경 문제가 있어, 실제 로컬 GPU 경로로 확인합니다. 실제 iOS·Android 기기 및 스토어 배포는 이 작업의 검증 범위에 포함하지 않습니다.

PC·휴대폰 브라우저 검사 18개 통과: 수학숲·대련장 합산, 오답 후 재도전, 진행 저장·복원, 직업 전환, 1~5차 전직, 새 직업, 글꼴·베리·상태창, 390px·가로·태블릿 화면 조작을 확인했습니다.

추가 확인: 가로 화면 광장 이름표·인사말 검사 PC·휴대폰 2개 통과, 웹·앱 광장 서버 검사 각 27개 통과. 삭제된 목표 안내판 대신 현재 보이는 프로필을 기준으로 이름표 겹침을 검증하며, 앱의 광장 검사에 필요한 기존 거래 모듈 두 파일을 공통 동기화 목록에 포함했습니다.

앱 글꼴에서 기존 광장 이름표 높이 추정값이 실제 높이보다 작아 칭호가 겹치는 문제를 재현했습니다. 이름·칭호·대화·글꼴·화면 너비가 바뀔 때만 실제 크기를 측정해 캐시에 보관하고 배치에 반영했습니다. 앱의 PC·휴대폰 두 기기 이름표·대화·가로 화면 검사 4개와 최종 웹 505개·앱 458개 단위 검사를 다시 통과했습니다.
