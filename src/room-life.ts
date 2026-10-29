/** Original, reward-free activities on furniture the player already placed. */
export const ROOM_ACTIONS={0:{kind:'sit',name:'버섯 의자에 앉기'},5:{kind:'read',name:'모험 책장에서 책 읽기'}} as const;
export type RoomActionKind='sit'|'read';
export function roomAction(id:number){return Number.isInteger(id)?ROOM_ACTIONS[id as keyof typeof ROOM_ACTIONS]:undefined;}
export const ROOM_BOOK_PAGES=[
 {title:'작은 씨앗의 여행',text:'작은 씨앗 하나가 바람을 타고 숲에 도착했어요. 햇살과 빗방울을 만날 때마다 새 친구가 생겼지요.'},
 {title:'기다려 주는 나무',text:'씨앗은 큰 나무 그늘에서 잠깐 쉬었어요. 나무가 말했어요. 천천히 자라도 괜찮아. 네 속도로 가면 돼.'},
 {title:'반짝 호수의 친구',text:'호숫가에서 길 잃은 별을 만났어요. 씨앗과 친구들은 작은 등불을 모아 별이 돌아갈 길을 밝혔어요.'},
 {title:'함께 만든 다리',text:'친구들이 작은 나뭇가지를 하나씩 가져왔어요. 혼자서는 닿지 않던 냇가에 튼튼한 다리가 놓였지요.'},
 {title:'도토리 한 알의 선물',text:'다람쥐는 가장 반짝이는 도토리를 친구에게 건넸어요. 친구의 웃음을 보니 숲 전체가 더 따뜻해졌어요.'},
 {title:'우리 집으로 놀러 와',text:'씨앗은 작은 꽃이 되었어요. 친구들을 집으로 초대해 그동안의 모험을 이야기했답니다. 다음 이야기는 네가 만들어 줘!'},
] as const;
