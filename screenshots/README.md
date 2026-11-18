# A안 전후 화면

각 폴더의 PNG는 PC **1280×800**, 휴대폰 **390×844** 뷰포트 캡처다. 모두 가상 닉네임 ‘베리’를 사용했다. `capture.json`은 촬영 목록이며 after에는 일부 글자 크기·색상·폰트 상태도 들어 있다.

`node scripts/capture-design.mjs before` 또는 `node scripts/capture-design.mjs after`로 촬영한다. 스크립트가 브라우저용 빌드와 4184 포트의 preview를 실행하고 종료한다. 시스템 Chrome을 먼저 사용하며, 독립 브라우저 문맥과 가상 온라인 응답을 사용한다. 랭킹은 목록이 보이도록 창 안을 스크롤했다. 교사 코드·설정 화면은 포함하지 않는다.

before는 변경 전 소스에서, after는 변경 후 소스에서 실행한 결과다. 현재 소스에서 before를 다시 실행하면 보관한 원본 캡처를 덮어쓰므로 주의한다.

| 화면 | PC 전 | PC 후 | 휴대폰 전 | 휴대폰 후 |
|---|---|---|---|---|
| 시작 | [전](before/pc-start.png) | [후](after/pc-start.png) | [전](before/mobile-start.png) | [후](after/mobile-start.png) |
| HUD | [전](before/pc-hud.png) | [후](after/pc-hud.png) | [전](before/mobile-hud.png) | [후](after/mobile-hud.png) |
| 광장 연결 상태 | [전](before/pc-offline.png) | [후](after/pc-offline.png) | [전](before/mobile-offline.png) | [후](after/mobile-offline.png) |
| 문제 풀이 | [전](before/pc-question.png) | [후](after/pc-question.png) | [전](before/mobile-question.png) | [후](after/mobile-question.png) |
| 가방 | [전](before/pc-bag.png) | [후](after/pc-bag.png) | [전](before/mobile-bag.png) | [후](after/mobile-bag.png) |
| 상점 | [전](before/pc-shop.png) | [후](after/pc-shop.png) | [전](before/mobile-shop.png) | [후](after/mobile-shop.png) |
| 살롱 | [전](before/pc-salon.png) | [후](after/pc-salon.png) | [전](before/mobile-salon.png) | [후](after/mobile-salon.png) |
| 직업 | [전](before/pc-career.png) | [후](after/pc-career.png) | [전](before/mobile-career.png) | [후](after/mobile-career.png) |
| 별빛 게시판 | [전](before/pc-expedition.png) | [후](after/pc-expedition.png) | [전](before/mobile-expedition.png) | [후](after/mobile-expedition.png) |
| 랭킹 | [전](before/pc-ranking.png) | [후](after/pc-ranking.png) | [전](before/mobile-ranking.png) | [후](after/mobile-ranking.png) |
| 랭킹 0건 | [전](before/pc-ranking-empty.png) | [후](after/pc-ranking-empty.png) | [전](before/mobile-ranking-empty.png) | [후](after/mobile-ranking-empty.png) |
| 랭킹 연결 실패 | [전](before/pc-ranking-error.png) | [후](after/pc-ranking-error.png) | [전](before/mobile-ranking-error.png) | [후](after/mobile-ranking-error.png) |
| 서버 준비 중 | [전](before/pc-server-unavailable.png) | [후](after/pc-server-unavailable.png) | [전](before/mobile-server-unavailable.png) | [후](after/mobile-server-unavailable.png) |
| 날씨 실패 | [전](before/pc-weather-error.png) | [후](after/pc-weather-error.png) | [전](before/mobile-weather-error.png) | [후](after/mobile-weather-error.png) |
