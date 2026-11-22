/** 2026-11-22 상점거리 메뉴: 줄무늬 차양 아래 가게 배너 카드(상점 안쪽과 같은 Codex 그림). */
const SHOPS:[string,string,string][]=[['weapon','무기 대장간','반짝이는 무기와 강화'],['outfit','옷가게','입혀 보고 고르는 의상'],['pet','펫 오두막','함께 다니는 동물 친구'],['ride','마구간','달리고 나는 탈것'],['beauty','미용실','헤어와 얼굴 꾸미기'],['potion','물약 가게','음식·회복물약·베리 물약']];
export function shopStreetHtml(base:string,extra:string){
 const cards=SHOPS.map(([id,name,detail])=>'<button data-nav="'+id+'" class="street-shop" style="background-image:linear-gradient(0deg,#fbf3dcfa 0,#fbf3dce6 42%,#fbf3dc00 62%),url('+base+'art/market/banner-'+id+'.webp)"><strong>'+name+'</strong><small>'+detail+'</small></button>').join('');
 return '<div class="street-sheet"><div class="street-awning" aria-hidden="true"></div><div class="nav-intro street-intro"><h3>모험가의 취향을 골라요</h3><p>옷, 꾸미기, 펫, 탈것, 무기, 물약 가게가 모여 있어요. 여기서 바로 구경해도 좋아요.</p></div><div class="nav-list street-list">'+cards+extra+'</div></div>';
}
