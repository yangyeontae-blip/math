/** 운영자 공지. 수정 후 두 게임과 보조 주소를 다시 배포합니다. */
export interface VillageNotice {
  id: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  body: string;
  pinned: boolean;
}

export const VILLAGE_NOTICES: readonly VillageNotice[] = [
  {"id":"workshop-2026-11-21","title":"⚗️ 수학 몬스터 보상 대폭 강화 & 물약 공방 오픈!","publishedAt":"2026-11-21","pinned":true,"body":"수학숲이 훨씬 든든해졌어요!\n\n🍓 수학 몬스터 보상 대폭 강화\n힌트 없이 맞힌 수학 몬스터 한 판마다 「내 레벨 × 4」베리를 더 받아요. 레벨 60이면 한 판에 +240베리, 레벨 200이면 +800베리, 레벨 500이면 +2,000베리예요. 여러 판짜리 몬스터는 판 수만큼 더 받아요.\n\n⚗️ 물약 공방 오픈\n상점거리 왼쪽 앞, 이끼 지붕의 작은 공방을 찾아보세요. 수학 정답 한 판마다 「지혜 구슬」이 1개 모여요(최대 60개). 구슬을 가마솥에 넣으면 베리 없이 물약을 만들 수 있어요.\n· 황금 베리물약·쑥쑥 경험물약·긴밤 베리차·별빛 집중물약은 이제 공방에서만 만들어요.\n· 물약 가게의 달콤 베리물약·포근 공부물약은 하루 3병까지 살 수 있어요.\n· 음식과 회복물약은 지금처럼 얼마든지 살 수 있어요.\n· 이미 가방에 있는 물약은 그대로 쓸 수 있어요.\n\n⚔ 사냥 보상 안내\n사냥터마다 하루 첫 100마리는 온전한 보상을 받고, 그 뒤에는 25%만 받아요. 다음 날이 되면 다시 100마리가 채워져요. 수학숲 보상은 줄지 않아요.\n\n사냥으로 힘을 키우고, 수학으로 물약을 만들어 더 멀리 모험해요! 🌳"},
  {id:'dawn-careers-2026-11-17',title:'✦ 5차 전직과 별노래 음유시인, 새벽서약 컬렉션',publishedAt:'2026-11-17',pinned:true,body:'수학숲에서 경험치를 듬뿍 모아 새로운 길을 열어요!\n\n문제 경험치는 내 레벨에 비례해요. 레벨 100의 기본 문제는 400 XP, 레벨 200에서는 800 XP! 학년과 난도에 맞는 문제를 힌트 없이 처음 맞혔을 때의 기본값이며 장비와 문제 종류에 따라 달라져요. 틀리거나 힌트를 써도 가진 것은 줄지 않아요.\n\n모험학교에서 레벨 10·30·60·100·200에 실습을 마치고 1~5차 전직을 해요. 여섯 직업 모두 5차 전용 스킬을 배워요. 새 직업 별노래 음유시인은 하프의 음표와 꽃잎 화음으로 모험해요.\n\n상점거리에서 새벽서약 컬렉션을 만나요. 무기 3종, 옷 3종, 펫 2종, 탈것 2종을 3D로 미리 보고 살 수 있어요. 전직 비용은 없고 기존 전직·장비·학습 기록은 이어져요.'},
  {"id": "feedback-2026-11-16", "title": "🍓 여러분의 의견으로 넓어진 베리숲", "publishedAt": "2026-11-16", "pinned": true, "body": "보내 주신 의견을 반영했어요!\n\n🌱 모험학교: 정령술사와 경로로 여는 별길 연금술사, 레벨 100의 4차 전직과 새 스킬이 생겼어요. 무기는 +10, 공격 스킬은 +5까지 확정 강화해요.\n\n🌈 지도: 세계 3 「새벽의 세계수」에서 새 숲 세 곳과 세계수 수호자를 만나요. 세계 2의 마지막 지역을 마치고 레벨 600부터 들어가요.\n\n👋 친구: 지도에서 길드를 만들고 초대 코드로 만나요. 친구 대전은 두 친구가 같은 수학 문제 다섯 개를 푸는 시합이에요. 틀려도 가진 것은 그대로예요.\n\n🍓 베리: 일반 몬스터 100마리 이후 감액을 없앴어요. 칭호를 장착하면 사냥 효과가 생기고, 상점거리의 베리 풍차는 모험하며 베리를 더 모아 줘요.\n\n🛍️ 상점에 다녀와도 별빛 원정 진행이 남아요. 채팅 입력 후 이동을 다시 할 수 있고, 그래픽 화면이 끊길 때에는 기록을 보관하고 복구를 안내해요.\n\n모임 이름에는 실명·학교·연락처를 쓰지 말고, 모험을 옮기기 전에는 저장 파일을 보관해 주세요."},
  {id:'hall-party-2026-11-10',title:'🏆 명예의 전당과 수학숲 파티가 생겼어요!',publishedAt:'2026-11-10',body:'새로운 기능을 소개할게요.\n\n1. 🏆 명예의 전당\n친구들의 레벨 순위와 베리 순위를 볼 수 있어요. 중앙광장 「운영자 소식」 공지판 바로 옆에 있는 살구빛 곱슬털 강아지 뽀짝이에게 말을 걸면 열려요. 연태쌤 안내에서도 열 수 있어요.\n· 내 순위는 목록에 없어도 맨 위에 따로 보여요.\n· 내 이름이 안 보이면 숲이나 광장을 잠깐 돌아다닌 뒤 「새로고침」을 눌러 주세요.\n\n2. 🌳 수학숲 파티\n같은 학년·같은 숲·같은 단계에 있는 친구와 수학숲에서 저절로 만나요. 파티를 만들면 친구와 같은 문제를 함께 풀고 몬스터를 함께 물리칠 수 있어요. 보상은 한 번씩만 받아요.\n\n3. 🌟 더 높은 성장\n레벨 500·1000 칭호와 세계 2의 새 지역 네 곳이 열렸어요. 캐릭터 상태 창과 「할 일 카드만 숨기기」 설정도 생겼어요.\n\n※ 명예의 전당과 파티는 기본 주소(yangyeontae-blip.github.io/math)에서 쓸 수 있어요. 보조 주소도 곧 같은 버전으로 맞출게요.',pinned:true},
  {"id":"lag-help-2026-11-05","title":"🌿 게임이 느리거나 끊길 때 이렇게 해 보세요","publishedAt":"2026-11-05","body":"렉이 걸린다는 의견을 확인했어요. 화면이 끊기거나 조작이 늦게 반응한다면 아래 순서로 하나씩 해 보세요.\n\n1. 오른쪽 위 ⚙ 「설정과 저장」을 열어 「가벼운 화면」을 켜 주세요.\n2. 같은 설정에서 「계절과 날씨 이벤트」를 꺼 주세요.\n3. 광장에 친구가 많아 느리다면 오른쪽 위 「함께하는 광장」을 누르고 「혼자 다니기」를 선택해 보세요. 혼자서도 모험과 학습을 계속하고 저장할 수 있어요. 다시 만나고 싶을 때는 「친구들과 만나기」를 눌러 주세요.\n4. 사용하지 않는 브라우저 탭이나 앱을 닫아 주세요.\n5. 그래도 계속 느리면 ⚙ 설정에서 「저장 파일 내려받기」로 현재 모험을 보관한 뒤, 게임을 새로고침하거나 다시 열어 주세요.\n\n여전히 불편하다면 「의견 보내기」로 휴대폰·태블릿·PC 중 어떤 기기인지, 사용한 브라우저, 느려진 장소와 상황을 알려 주세요. 이름·학교·연락처는 적지 않아도 돼요. 보내주신 의견을 살펴보며 더 편안하게 모험할 수 있도록 개선하겠습니다.\n\n베리숲 운영자 드림","pinned":true},
  {id:'world-two-plan-2026-11-03',title:'🌌 여러분의 의견으로 준비하는 세계 2와 친구 모험',publishedAt:'2026-11-03',body:'의견 보내기를 검토한 결과 ‘세계 2의 지역 3곳 + 새 장비 12종 + 혼자 도전 가능한 보스 1종’를 추가하고, 이후에 서버를 만들어 친구들과 만날 수 있도록 하겠습니다.',pinned:true},
  {
    id: 'welcome-2026-10-24',
    title: '🌳 베리숲에 오신 모험가 여러분, 환영합니다!',
    publishedAt: '2026-10-24',
    body: '안녕하세요, 모험가 여러분! 베리숲 운영자입니다. 🍓\n\n베리숲에 찾아와 주셔서 정말 반갑습니다. 숲길을 따라 모험하고, 귀여운 펫과 친구가 되고, 나만의 마을도 꾸미며 즐거운 시간을 보내 주세요. 어려운 문제가 나와도 괜찮아요. 힌트를 보며 천천히, 여러분만의 속도로 모험하시면 됩니다.\n\n모험하다 불편했던 순간이 있었나요? 마음에 쏙 들었던 점이나 “이런 것도 있으면 좋겠어요!” 하는 아이디어도 들려주세요. 게임 화면의 「의견 보내기」를 눌러 편하게 남겨주시면 됩니다. 함께하시는 보호자님의 의견도 환영합니다.\n\n보내주신 이야기는 하나하나 소중히 살펴보고, 더 즐겁고 편안한 베리숲이 되도록 최대한 개선해 나가겠습니다. 의견을 적으실 때는 이름이나 학교, 연락처 같은 개인정보는 넣지 말아 주세요.\n\n여러분의 작은 한마디가 베리숲을 더 좋은 모험의 공간으로 만들어 줍니다. 오늘도 베리숲에서 즐거운 추억을 만들어 가세요!\n\n따뜻한 마음을 담아,\n베리숲 운영자 드림',
    pinned: true,
  },
  {
    id: 'notice-board-2026-10-18',
    title: '마을 공지판에 오신 것을 환영해요!',
    publishedAt: '2026-10-18',
    body: '이곳은 운영자가 베리숲의 새로운 소식과 이용 안내를 전하는 공지판이에요.\n\n글을 골라 운영자의 소식을 읽어 보세요. 모험을 떠나려면 공지판을 닫고 「지도 → 숲으로 모험」을 선택해 주세요.',
    pinned: true,
  },
];

export function sortedNotices(notices: readonly VillageNotice[] = VILLAGE_NOTICES): VillageNotice[] {
  return [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}

function text(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function noticeListHtml(notices: readonly VillageNotice[] = VILLAGE_NOTICES): string {
  const list = sortedNotices(notices);
  return `<p class="notice-intro">운영자가 전하는 베리숲의 소식이에요.</p><div class="notice-list">${list.length ? list.map(n => `<button class="secondary notice-card" data-notice="${text(n.id)}"><span>${n.pinned ? '<small class="notice-pin">📌 중요 공지</small>' : ''}<strong>${text(n.title)}</strong><time datetime="${text(n.publishedAt)}">${text(n.publishedAt)}</time></span><span aria-hidden="true">›</span></button>`).join('') : '<p class="notice-empty" role="status">아직 등록된 소식이 없어요.</p>'}</div>`;
}

export function noticeDetailHtml(notice: VillageNotice): string {
  return `<article class="notice-article" aria-labelledby="notice-title"><h3 id="notice-title" tabindex="-1">${text(notice.title)}</h3><time datetime="${text(notice.publishedAt)}">${text(notice.publishedAt)}</time><p class="notice-body">${text(notice.body)}</p></article><button class="secondary wide" id="notice-back">← 공지 목록</button>`;
}
