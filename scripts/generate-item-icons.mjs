/** Original, crisp storybook RPG inventory illustrations. Rebuild: node --import tsx scripts/generate-item-icons.mjs */
import {mkdirSync,writeFileSync} from 'node:fs';
import {WEAPONS,OUTFITS,PETS,RIDES,POTIONS} from '../src/rules.ts';
const out='public/art/berry-items-v1';mkdirSync(out,{recursive:true});
const ink='#543648',cream='#fff5d9',gold='#ffcc56',pink='#ff9ab5';
const P=(d,fill='url(#body)',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const E=(x,y,rx,ry,fill='url(#body)',extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const C=(x,y,r,fill='url(#body)',extra='')=>E(x,y,r,r,fill,extra);
const R=(x,y,w,h,r,fill='url(#body)',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const L=(d,color=ink,w=2)=>P(d,'none',`stroke="${color}" stroke-width="${w}"`);
const G=(s,transform)=>`<g transform="${transform}">${s}</g>`;
function star(x,y,r=10,fill=gold){const a=Array.from({length:10},(_,i)=>{const t=i*Math.PI/5-Math.PI/2,q=i%2?r*.46:r;return [x+Math.cos(t)*q,y+Math.sin(t)*q];});return P(a.map((v,i)=>(i?'L':'M')+v.map(n=>n.toFixed(1)).join(' ')).join(' ')+'Z',fill);}
function leaf(x,y,size=14,fill='#8ed96a',angle=0){return G(P(`M0 0 Q${-size} ${-size} 0 ${-size*2} Q${size} ${-size} 0 0Z`,fill)+L(`M0 -2V${-size*1.65}`,'#568c54',1.6),`translate(${x} ${y}) rotate(${angle})`);}
function flower(x,y,r=12,fill=pink){return Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return C(x+Math.sin(a)*r*.68,y+Math.cos(a)*r*.68,r*.55,fill);}).join('')+C(x,y,r*.4,gold);}
const moon=(x,y,r=12)=>P(`M${x+r*.3} ${y-r} A${r} ${r} 0 1 0 ${x+r*.6} ${y+r*.85} A${r*.82} ${r*.82} 0 0 1 ${x+r*.3} ${y-r}Z`,cream);
const gem=(x,y,r=12,fill='#95e8ed')=>P(`M${x} ${y-r} L${x+r} ${y-r*.25} L${x+r*.7} ${y+r*.6} L${x} ${y+r} L${x-r*.7} ${y+r*.6} L${x-r} ${y-r*.25}Z`,fill)+L(`M${x-r} ${y-r*.25}H${x+r} M${x} ${y-r}L${x-r*.3} ${y-r*.25}L${x} ${y+r}L${x+r*.3} ${y-r*.25}Z`,'#fff',1.5);
function motif(name,x,y,r=10){if(name==='leaf')return leaf(x,y+r*.8,r*.7);if(name==='flower')return flower(x,y,r);if(name==='moon')return moon(x,y,r);if(name==='gem')return gem(x,y,r);if(name==='berry')return P(`M${x} ${y+r}Q${x-r*1.6} ${y-r*.2} ${x-r*.6} ${y-r*.6}Q${x} ${y-r} ${x+r*.6} ${y-r*.6}Q${x+r*1.6} ${y-r*.2} ${x} ${y+r}Z`,'#ff7295')+leaf(x,y-r*.55,r*.3,'#90d66c',-55)+C(x-3,y,1,cream,'stroke="none"')+C(x+3,y+3,1,cream,'stroke="none"');if(name==='paw')return E(x,y+3,r*.68,r*.55,pink)+[-.75,-.25,.25,.75].map((q,i)=>E(x+q*r,y-r*(i===0||i===3?.35:.65),r*.24,r*.3,pink)).join('');if(name==='cloud')return C(x-r*.55,y,r*.55,cream)+C(x,y-r*.3,r*.7,cream)+C(x+r*.6,y,r*.55,cream)+R(x-r*.65,y,r*1.3,r*.5,4,cream,'stroke="none"');if(name==='snow')return [0,60,120].map(a=>G(L(`M${x-r} ${y}H${x+r}`,'#fff',2.2),`rotate(${a} ${x} ${y})`)).join('');if(name==='sun')return flower(x,y,r,gold);if(name==='note')return L(`M${x-3} ${y+4}V${y-r}L${x+7} ${y-r+3}V${y+6}`,cream,3)+E(x-6,y+5,4,3,cream)+E(x+4,y+7,4,3,cream);return star(x,y,r);}
function eyes(x=64,y=49,spread=12){return E(x-spread,y,4.7,6.8,ink,'stroke="none"')+E(x+spread,y,4.7,6.8,ink,'stroke="none"')+C(x-spread-1.5,y-2.3,1.8,'#fff','stroke="none"')+C(x+spread-1.5,y-2.3,1.8,'#fff','stroke="none"')+E(x-spread-8,y+9,5,2.8,'#ffb1b9','stroke="none" opacity=".8"')+E(x+spread+8,y+9,5,2.8,'#ffb1b9','stroke="none" opacity=".8"');}
const smile=(x=64,y=61)=>L(`M${x-6} ${y}Q${x} ${y+7} ${x+6} ${y}`,ink,2.1);
const wings=(y=65,fill='#c9f3ff')=>P(`M46 ${y}Q13 ${y-34} 14 ${y-11}Q5 ${y+2} 25 ${y+5}Q19 ${y+18} 45 ${y+13}Z`,fill)+P(`M82 ${y}Q115 ${y-34} 114 ${y-11}Q123 ${y+2} 103 ${y+5}Q109 ${y+18} 83 ${y+13}Z`,fill);
const bow=(x,y,fill=pink)=>P(`M${x} ${y}Q${x-18} ${y-15} ${x-17} ${y+3}Q${x-15} ${y+14} ${x} ${y+3}Q${x+17} ${y+15} ${x+18} ${y+1}Q${x+17} ${y-14} ${x} ${y}Z`,fill)+C(x,y+2,4,gold);
function hex(n){return '#'+n.toString(16).padStart(6,'0');}
function mix(color,other,amount){const c=parseInt(color.slice(1),16),o=parseInt(other.slice(1),16);return '#'+[16,8,0].map(n=>Math.round(((c>>n)&255)*(1-amount)+((o>>n)&255)*amount).toString(16).padStart(2,'0')).join('');}

function sword(mark='star',variant=0){const blade=variant===1?P('M53 70L50 30Q59 14 77 10L72 69Z'):P('M54 72L51 29L64 12L77 29L74 72Z');return G(R(58,77,12,31,4,'#ac7588')+C(64,109,7,'url(#gold)')+blade+P('M64 18L58 33L62 66L66 33Z','#fff','stroke="none" opacity=".8"')+P('M37 71Q49 63 64 70Q79 63 91 71L87 79Q72 82 64 77Q55 83 41 79Z','url(#gold)')+motif(mark,64,73,8)+L('M60 87L68 90M60 96L68 99','#e7bbce',2),`rotate(31 64 64)`);}
function staff(mark='star',orbit=false){return G(R(59,39,11,70,5,'#b486b7')+R(56,80,17,7,3,gold)+C(64,109,6,gold)+(orbit?E(64,33,29,12,'none','stroke="#ffcf66" stroke-width="4" transform="rotate(-25 64 33)"'):'')+P('M43 37Q44 57 64 55Q84 56 85 36L77 40Q65 50 51 39Z','url(#gold)')+C(64,31,20,'url(#body)')+motif(mark,64,30,13)+L('M52 21Q57 15 64 17','#fff',3.2),`rotate(26 64 64)`);}
function hammer(mark='star',acorn=false){return G(R(59,53,12,57,5,'#b77d64')+R(56,94,18,9,3,gold)+(acorn?E(64,43,31,24)+P('M29 35Q35 17 64 20Q93 17 99 35L95 45Q65 36 32 45Z','#b78259')+R(61,14,7,10,3,'#a0714c'):R(29,25,70,35,11)+R(28,25,10,35,5,gold)+R(90,25,10,35,5,gold))+motif(mark,64,43,12)+L('M42 30H82','#fff',3),`rotate(30 64 64)`);}
function archery(mark='star',feather=false){return G(P('M54 14Q106 64 54 112L43 100Q81 63 43 27Z','url(#gold)')+L('M48 21L38 64L48 105',cream,2.5)+R(51,53,13,24,4,'#986c98')+L('M22 62H105','#875b58',3)+P('M107 62L95 53V71Z',cream)+(feather?[-1,1].map(s=>G(P('M63 30Q81 11 95 24L81 29L89 34L72 40Z','#d9f6ff'),`translate(0 ${s===1?61:0})`)).join(''):'')+motif(mark,68,37,8),`rotate(15 64 64)`);}
function book(open=false,mark='star'){return G((open?P('M16 31Q40 24 64 38Q88 24 112 31V96Q87 86 64 100Q41 86 16 96Z','url(#body)')+P('M24 32Q45 29 64 41Q83 29 104 32V84Q85 79 64 93Q43 79 24 84Z',cream)+L('M64 42V92','#b58ab0',2)+L('M32 47L52 52M32 59L52 63M77 50L97 45M77 62L96 57','#b493a4',2):R(29,20,72,88,9)+R(29,22,12,83,4,'url(#gold)')+R(45,28,48,69,5,'none','stroke="#fff0b4" stroke-width="2"')+P('M68 95L68 115L76 109L84 115V95Z',pink))+motif(mark,open?85:68,open?68:59,15),`rotate(-12 64 64)`);}
const weaponSpecs=[['sword','leaf',1],['hammer','leaf',1],['fan'],['staff','flower'],['sword','berry'],['axe'],['water'],['staff','star'],['ladle'],['sword','cloud'],['spear','leaf'],['staff','candy'],['umbrella'],['flail'],['book','star'],['staff','sun'],['paw'],['sword','star'],['pencil'],['harp'],['bell'],['spear','sun'],['staff','berry'],['hammer','star',1],['twin'],['bow','sun',1],['sword','star'],['sword','leaf'],['staff','sun'],['bow','leaf',1],['sword','gem'],['staff','gem'],['bow','gem'],['sword','star'],['staff','star',1],['bow','moon',1],['sword','moon',1],['staff','gem',1],['bow','star',1],['hammer','leaf'],['scythe'],['book','snow',1],['sword','sun'],['harp'],['bow','star',1]];
function weaponArt(id){const [shape,mark,v]=weaponSpecs[id];
 if(shape==='sword'){
  let art=id===36?G(R(58,77,12,31,4,'#ac7588')+P('M51 72Q30 36 77 10Q52 37 77 64L71 74Z')+L('M64 23Q45 44 61 65',cream,3)+P('M39 72Q64 61 89 72L84 80H44Z','url(#gold)')+moon(64,74,9)+C(64,109,7,gold),'rotate(31 64 64)'):sword(mark,v);
  if([26,33,42].includes(id))art+=G(P('M46 69Q25 49 24 63L34 76L30 83L51 80Z','url(#gold)')+P('M82 69Q103 49 104 63L94 76L98 83L77 80Z','url(#gold)')+gem(64,74,9,id===42?'#ffb1ad':'#b6c3ff')+(id===33?E(64,29,21,8,'none','stroke="#ffd46d" stroke-width="3"'):'')+(id===26?P('M54 49L50 37L61 42L65 32L71 42L82 37L77 49Z',gold):''),'rotate(31 64 64)');
  if(id===27)art+=G(leaf(45,75,10,'#b9e38f',-40)+leaf(84,75,10,'#b9e38f',40),'rotate(31 64 64)');
  return art;
 }
 if(shape==='staff')return staff(mark,v);if(shape==='hammer')return hammer(mark,v);if(shape==='bow')return archery(mark,v);if(shape==='book')return book(v,mark);
 if(shape==='twin')return G(sword('snow'),'translate(-12 6) scale(.84)')+G(sword('gem'),'translate(108 7) scale(-.84 .84)');
 if(shape==='harp')return G(P('M30 25Q17 59 35 102Q64 119 95 99L101 25L86 21L83 89Q60 105 44 90L49 31Z','url(#gold)')+P('M39 25Q63 9 95 25L88 37Q67 24 44 40Z')+[48,57,66,75,84].map(x=>L(`M${x} 35V91`,cream,2)).join('')+gem(42,28,12)+motif(id===43?'note':'star',83,98,10)+C(98,24,7,pink),'rotate(12 64 64)');
 if(shape==='scythe')return G(R(59,28,10,82,5,'#8d7ab3')+P('M65 32Q102 21 111 60Q105 5 53 13Q23 19 22 48Q36 27 65 32Z')+L('M35 28Q68 6 95 30',cream,3)+moon(62,44,11)+R(55,82,18,8,3,gold),'rotate(22 64 64)');
 if(shape==='spear')return G(R(60,49,9,62,4,'#a27b6b')+P('M64 9L84 39L65 62L45 39Z')+L('M64 16V56','#fff',3)+P('M43 58Q64 48 86 58L82 65H46Z',gold)+motif(mark,64,58,9),'rotate(30 64 64)');
 if(shape==='fan')return P('M65 105L18 46Q65 3 110 46Z')+L('M65 105L20 47M65 105L41 29M65 105L64 21M65 105L86 30M65 105L108 47',cream,2.5)+moon(66,52,18)+R(60,96,10,17,4,gold);
 if(shape==='water')return R(30,49,58,48,13)+P('M85 63L106 45L114 53L92 82Z',gold)+P('M41 49V35Q66 18 86 42L79 49Q67 30 49 40V51Z','none',`stroke="${ink}" stroke-width="8"`)+motif('flower',57,73,13)+[0,1,2].map(i=>P(`M${105-i*9} ${69+i*11}q-9 13 0 13q9 0 0-13Z`,'#7bdbef')).join('');
 if(shape==='ladle')return G(R(59,16,10,66,5,'#a36c62')+E(64,89,27,23)+E(64,82,24,12,'#ffafbd')+motif('berry',64,87,13)+R(56,12,17,13,5,gold),'rotate(24 64 64)');
 if(shape==='paw')return G(R(59,63,12,47,5,'#b38cba')+P('M35 64Q22 53 30 42Q33 24 45 33Q42 12 57 13Q67 9 73 27Q86 12 95 23Q106 30 91 43Q110 40 108 55Q106 69 87 73L69 87Z',cream)+motif('paw',64,51,22),'rotate(24 64 64)');
 if(shape==='pencil')return G(P('M53 30L64 10L76 30V101H53Z','#ffd677')+P('M53 30L64 10L76 30Z',cream)+P('M60 18L64 10L68 18Z',ink)+R(53,92,23,16,5,pink)+L('M60 35V87','#fff3b2',3)+star(66,57,12),'rotate(29 64 64)');
 if(shape==='axe')return G(R(59,31,11,78,5,'#aa7862')+P('M61 25Q28 9 20 35L32 62Q42 42 61 46L81 50Q90 63 107 47L103 20Q80 38 67 24Z')+R(57,22,17,32,4,gold)+motif('sun',41,31,8),'rotate(27 64 64)');
 if(shape==='umbrella')return P('M17 59Q21 14 64 14Q109 14 113 59Q99 45 88 59Q76 44 64 59Q52 44 40 59Q27 45 17 59Z')+L('M64 16Q42 33 40 57M64 16Q86 33 88 57',cream,2)+L('M64 54V99Q64 117 49 108Q44 104 47 98','#97735b',6)+flower(64,35,12,'#ffdc69');
 if(shape==='flail')return G(R(59,64,12,45,5,'#ab7961')+L('M64 64Q31 61 37 37','#94746b',7)+R(26,18,47,37,10,'url(#gold)')+P('M26 30Q35 21 44 33Q52 24 61 33L71 28V43Q63 38 59 46Q49 35 40 44L27 38Z','#ffe99a')+motif('sun',50,25,9),'rotate(26 64 64)');
 return G(R(59,40,12,71,5,'#ad7a85')+P('M39 60Q42 22 64 25Q86 23 90 60L96 70Q63 85 32 70Z')+C(64,75,8,gold)+motif('cloud',64,29,15)+L('M47 47Q52 34 58 35',cream,3),'rotate(25 64 64)');
}

const outfitTypes=['tunic','hanbok','cloak','robe','robe','wizard','samurai','hanbok','overall','duck','bunny','ranger','cat','sheep','frog','fairy','dress','bee','robe','suit','armor','dress','space','suit','armor','queen','armor','wizard','ranger','armor','queen','ranger','armor','bard','cloak'];
const outfitMotifs=['leaf','flower','leaf','cloud','flower','star','moon','flower','berry','cloud','moon','leaf','paw','cloud','leaf','star','sun','sun','cloud','star','paw','flower','star','berry','moon','star','leaf','star','leaf','moon','gem','star','sun','note','leaf'];
function outfitArt(id){const type=outfitTypes[id],mark=outfitMotifs[id];let back='',body='',top='';
 const boots=R(41,94,18,16,5,'#a47a68')+R(69,94,18,16,5,'#a47a68')+L('M43 104H56M71 104H84',gold,2);
 const cape=P('M38 35Q61 24 88 35L107 100L80 107L64 98L46 108L22 98Z','url(#shade)');
 const torso=P('M44 37L32 44L20 69L34 78L42 63L42 98Q64 106 87 98L87 63L96 78L109 69L96 44L83 37Q64 46 44 37Z');
 const collar=P('M46 37L64 55L82 37L75 32Q64 40 53 32Z',cream);
 if(['cloak','queen','armor','wizard','ranger','bard','fairy'].includes(type))back=cape;
 if(type==='fairy'||type==='bee')back=wings(66,type==='bee'?'#e3fbff':'#f4d9ff');
 body=boots+torso+collar;
 if(['robe','wizard','dress','hanbok','queen','bard'].includes(type))body=boots+P('M44 37L27 45L17 70L34 78L43 63L31 100Q65 119 99 100L85 63L96 78L111 70L99 45L82 37Z')+P('M45 65L64 70L85 65L93 99Q65 107 37 99Z','url(#shade)')+collar+L('M48 80L44 98M63 80V102M79 80L84 98',cream,2)+P('M36 98Q63 109 94 98L97 105Q64 119 32 105Z','url(#trim)');
 if(type==='overall')body=boots+torso+R(43,49,42,48,7,'url(#shade)')+R(42,36,9,41,3,'#90bee9')+R(77,36,9,41,3,'#90bee9')+R(53,68,23,18,4,cream)+C(47,59,3,gold)+C(82,59,3,gold);
 if(type==='suit'||type==='bard')body+=P('M44 40L58 61L64 51L70 61L85 40L79 76H49Z','url(#trim)')+bow(64,49,id===33?'#ef91c1':pink)+[70,83,95].map(y=>C(64,y,2.4,gold)).join('');
 if(type==='armor')body=boots+torso+P('M43 42L64 50L86 42L83 79L65 90L45 79Z','url(#trim)')+P('M48 49L64 55L80 49L76 76L64 82L51 75Z')+P('M23 45L41 35L48 54L36 62L20 57Z','url(#trim)')+P('M105 45L87 35L80 54L92 62L108 57Z','url(#trim)')+R(40,88,48,9,4,'#826477')+R(57,86,15,13,3,gold);
 if(type==='samurai')body+=P('M45 40L79 79L84 65L57 35Z',cream)+R(39,79,51,12,3,'url(#trim)')+L('M49 91L45 106M79 91L83 106',cream,3);
 if(type==='hanbok')body+=P('M39 38L61 59L88 38L83 72H45Z','url(#trim)')+L('M47 43L70 69',cream,3)+bow(65,64,pink)+[0,1,2].map(i=>P(`M${22+i*3} ${56-i*5}L${35+i*3} ${64-i*5}`,['#79d6cc','#ffcc77','#ed9aba'][i],'stroke-width="5"')).join('');
 if(type==='cloak')body=boots+P('M43 33Q64 12 85 33L104 96L83 109L65 94L46 109L23 96Z')+P('M64 41L39 99L62 93L87 101Z','url(#shade)')+E(64,34,22,17,'url(#trim)')+E(64,35,15,11,'url(#shade)')+R(48,51,32,10,5,'url(#trim)');
 if(type==='ranger')body+=P('M42 37L79 93L88 88L51 34Z','url(#trim)')+R(65,77,21,20,4,'#b98767')+L('M68 84H83',gold,2);
 if(['duck','bunny','cat','sheep','frog','bee'].includes(type)){top=E(64,31,25,23)+E(64,34,18,14,cream);if(type==='bunny')top=G(E(49,13,7,16)+E(49,13,3,11,pink,'stroke="none"'),'rotate(-12 49 13)')+G(E(79,13,7,16)+E(79,13,3,11,pink,'stroke="none"'),'rotate(12 79 13)')+top;if(type==='cat')top=P('M40 20L38 5L56 13M73 13L91 5L89 24')+top;if(type==='sheep')top=[39,51,64,77,89].map((x,i)=>C(x,16+Math.abs(2-i)*3,9,cream)).join('')+top;if(type==='frog')top=C(47,15,10)+C(81,15,10)+C(47,13,4,ink)+C(81,13,4,ink)+top;if(type==='duck')top+=P('M52 36Q64 28 77 36L73 44H56Z','#ffb44e');if(type==='bee')top=L('M49 13L44 4M79 13L84 4',ink,3)+C(44,4,4,gold)+C(84,4,4,gold)+top+L('M44 68H85M43 84H86','#786076',7);}
 if(type==='wizard')top=P('M41 28L60 2L83 27L99 34Q63 49 28 34Z')+P('M44 27L81 26L86 35L39 35Z','url(#trim)')+star(67,20,7);
 if(type==='ranger')top=P('M36 27Q44 4 76 11L86 25L100 31Q69 39 28 32Z')+leaf(86,20,11,'#e4efff',45)+R(42,25,44,8,4,'url(#trim)');
 if(type==='queen')top=P('M40 26L36 7L53 17L64 3L76 17L92 7L87 28Z','url(#gold)')+gem(64,18,7);
 if(type==='armor')top=P('M40 26Q41 5 65 5Q87 5 89 26L78 37H50Z','url(#trim)')+P('M45 22L64 29L83 22L78 34H50Z','url(#shade)')+motif(mark,64,15,7);
 if(id===24)top=E(49,10,6,13,cream)+E(79,10,6,13,cream)+top;
 if(id===20)top=P('M41 17L37 2L54 11M75 11L92 2L88 19Z','url(#trim)')+top;
 if(type==='space'){body=boots+torso+R(40,57,49,39,12,cream)+R(49,70,13,13,3,'#9ee4ee')+C(77,76,4,pink);top=E(64,28,29,26,cream)+E(64,28,21,18,'#6d88b7')+L('M48 22Q53 13 66 14','#e7faff',4)+R(42,47,45,9,5,'url(#trim)');}
 body+=motif(mark,64,['armor','cloak'].includes(type)?65:76,9);
 if(['dress','fairy','bard'].includes(type))body+=bow(64,59,'url(#trim)');
 return back+body+top+L('M31 48L25 63M95 48L102 63','#fff',2.5);
}

function animalEars(type){if(type==='panda')return C(42,26,11,'#756277')+C(86,26,11,'#756277');if(['bunny','alpaca'].includes(type))return [-1,1].map(s=>G(E(64+s*15,17,8,20)+E(64+s*15,17,3.8,14,pink,'stroke="none"'),`rotate(${s*10} ${64+s*15} 17)`)).join('');if(['cat','fox','unicorn'].includes(type))return P('M37 34L35 7L58 25Z')+P('M91 34L93 7L70 25Z')+P('M41 26L40 16L50 25Z',pink,'stroke="none"')+P('M87 26L88 16L78 25Z',pink,'stroke="none"');if(['dog','poodle'].includes(type))return E(34,44,12,23,'url(#shade)','transform="rotate(15 34 44)"')+E(94,44,12,23,'url(#shade)','transform="rotate(-15 94 44)"');if(type==='dragon')return P('M39 30L40 7L52 26Z',cream)+P('M89 30L88 7L76 26Z',cream);return C(42,26,10)+C(86,26,10)+C(42,26,5,pink,'stroke="none"')+C(86,26,5,pink,'stroke="none"');}
function animalFace(type,body=true){let tail='',b='',head='',extra='';
 if(['fox','squirrel','raccoon','dragon'].includes(type))tail=P('M83 101Q120 103 109 65Q97 47 94 70Q111 82 83 84Z','url(#shade)')+(type==='fox'?P('M110 80Q111 62 101 61Q94 67 98 76Z',cream):'');
 if(type==='raccoon')tail+=L('M96 94L111 88M99 80L109 74','#ab7184',5);
 if(body)b=E(64,84,23,24)+E(64,88,14,18,cream)+E(47,105,12,7,'url(#shade)')+E(81,105,12,7,'url(#shade)')+E(41,83,7,12)+E(87,83,7,12);
 head=animalEars(type)+E(64,47,30,26,type==='panda'?'#fff7e8':'url(#body)');
 if(['hamster','otter','raccoon','fox','dog','poodle','alpaca'].includes(type))head+=E(64,60,20,13,cream,'stroke-width="2"');
 if(type==='fox')head+=P('M34 45L50 56L64 54L78 56L94 45L87 66L73 72H55L41 65Z',cream,'stroke-width="2"');
 if(type==='raccoon')head+=P('M37 42Q51 34 64 44Q79 34 92 42L85 58Q70 64 64 53Q54 64 42 57Z','#a48a9e','stroke="none"');
 if(type==='panda')head+=E(50,48,11,14,'#65576c','transform="rotate(22 50 48)"')+E(78,48,11,14,'#65576c','transform="rotate(-22 78 48)"');
 if(type==='sheep'||type==='poodle')head=[35,42,53,65,77,88,94].map((x,i)=>C(x,29-Math.sin(i/6*Math.PI)*17,10,type==='sheep'?cream:'url(#body)')).join('')+head+(type==='poodle'?[41,53,66,79,87].map((x,i)=>C(x,27-Math.sin(i/4*Math.PI)*9,8)).join(''):'');
 if(type==='owl')head=E(64,49,31,31)+P('M36 31L30 13L52 25M77 25L98 13L92 33Z')+E(50,50,17,20,cream)+E(78,50,17,20,cream);
 if(type==='bird'||type==='griffin')head=E(64,48,29,27,type==='griffin'?cream:'url(#body)')+P('M49 22L54 8Q62 14 64 23L69 11Q76 16 77 27Z');
 head+=eyes(64,48,type==='owl'?14:12);
 if(['bird','owl','griffin'].includes(type))head+=P('M56 59L64 67L72 59L64 54Z','#ffc45e');else head+=E(64,58,3,2,ink,'stroke="none"')+smile(64,64);
 if(type==='unicorn')extra=P('M58 27L65 2L73 27Z','url(#gold)')+L('M63 15L69 18M61 23L71 25','#fff6ce',1.5)+P('M37 26Q40 13 59 19Q56 36 37 38Z',pink)+P('M83 22Q100 36 90 65L82 60Q93 42 77 28Z',pink);
 if(type==='dragon')extra=P('M94 72L108 68L103 82L113 90L99 96Z','url(#trim)');
 return tail+b+head+extra;
}
const petTypes=['hamster','bunny','cat','owl','dragon','bee','fox','squirrel','star','otter','alpaca','bread','bird','dragon','cat','raccoon','dog','sheep','jelly','fox','poodle','unicorn','panda','griffin','fox','whale'];
function petArt(id){const type=petTypes[id];if(type==='star')return star(64,65,47,'url(#body)')+eyes(64,60,13)+smile(64,76)+C(39,61,4,cream,'stroke="none" opacity=".7"');
 if(type==='bee')return E(41,44,23,17,'#d9f6ff','transform="rotate(-24 41 44)"')+E(88,44,23,17,'#d9f6ff','transform="rotate(24 88 44)"')+E(64,78,27,29)+L('M40 75H88M43 89H85','#826078',8)+C(64,45,27)+L('M51 20L45 10M78 20L84 10',ink,3)+C(45,10,5,gold)+C(84,10,5,gold)+eyes(64,44)+smile(64,58)+flower(83,94,10);
 if(type==='whale')return P('M90 70Q109 32 118 47Q118 68 105 77Q124 82 110 98L86 90Z','url(#shade)')+E(59,75,42,30)+E(51,87,29,14,cream,'stroke="none"')+P('M35 73Q8 69 14 85Q25 99 42 90Z')+eyes(54,71,13)+smile(54,85)+motif('cloud',59,33,15)+star(80,94,10);
 if(type==='jelly')return [0,1,2,3,4].map(i=>L(`M${35+i*14} 74Q${24+i*16} 92 ${34+i*14} 107`,['#f6a8ca','#9cddeb','#cab0ef','#ffce7d','#a4dea2'][i],7)).join('')+P('M20 71Q18 24 64 23Q110 24 108 71Q96 81 87 72Q76 83 65 74Q52 84 41 73Q30 81 20 71Z')+eyes(64,51,13)+smile(64,65)+L('M33 45Q39 31 51 31','#fff',4);
 if(type==='bread')return P('M43 55L30 94L54 108L69 97L90 108L102 94L87 53Z','#a187cc')+P('M31 29Q23 5 65 9Q105 5 98 30L95 78Q63 90 33 78Z','#d9a268')+P('M39 32Q30 17 65 18Q95 15 90 34L88 71Q65 80 41 71Z',cream)+eyes(64,43)+smile(64,57)+star(65,84,16)+E(48,106,13,7,'#cd956b')+E(83,106,13,7,'#cd956b');
 let back='';if([4,12,13,14,19,23].includes(id))back=wings(70,id===14?'#c3eefa':id===23?'#ffdf8d':'#d5c2f3');
 let art=back+animalFace(type);
 if(id===0)art+=motif('berry',64,86,14);if(id===1)art+=motif('cloud',66,91,12)+bow(64,76);if(id===2)art+=P('M39 73L88 73L78 84L63 78L47 85Z','#9bda8b');if(id===3)art+=star(83,26,9)+bow(64,82,'#ae96de');if(id===4||id===13)art+=moon(64,83,11);
 if(id===6)art+=flower(88,29,12,'#ffd263');if(id===7)art+=E(64,21,23,8,'#b48254')+P('M43 20Q44 2 64 4Q84 2 86 20Z','#c79b6d')+R(61,0,6,9,3,'#a77750')+leaf(80,16,7);if(id===9)art+=moon(65,84,13)+L('M36 61L25 58M91 61L102 58','#98717a',1.6);if(id===10)art+=bow(64,77,'#a9baf5')+flower(90,28,8);if(id===12)art+=motif('cloud',64,84,11);if(id===14)art+=gem(64,81,9)+flower(87,28,8);
 if(id===15)art+=motif('berry',64,87,12);if(id===16)art+=flower(64,80,13,'#ffe093');if(id===17)art+=bow(64,78,'#a4d8f3');if(id===19)art+=star(99,87,16)+star(64,78,9);if(id===20)art=P('M39 68L22 102L52 113L65 98L82 113L107 102L88 68Z','#a791da')+art+P('M45 19L42 3L55 11L64 0L75 11L87 3L83 19Z','url(#gold)')+star(64,81,13);
 if(id===21)art+=flower(84,78,11);if(id===22)art+=gem(91,83,12)+bow(64,77,'#a5dbb2');if(id===23)art+=R(69,77,28,23,5,'#ba8d6a')+R(72,82,22,15,2,cream)+L('M73 83L83 90L93 83','#d5a68a',1.8);if(id===24)art+=star(98,83,17)+flower(87,28,8)+bow(64,78,'#c2b4e9');
 return art;
}

function wheels(xs=[35,91],y=99,r=12){return xs.map(x=>C(x,y,r,'#80697c')+C(x,y,r*.55,'#e4deee')+C(x,y,r*.18,'#b18c9d')).join('');}
function mountAnimal(type,id){const horns=type==='deer'?[-1,1].map(s=>G(L('M84 30L90 10M88 18L81 12M90 13L98 7','#9e7466',4),s===-1?'translate(152 0) scale(-1 1)':'')).join(''):'';
 let b=(id===4||id===6||id===23?wings(67,id===4?cream:'#d5b8ee'):'')+P('M32 70Q13 52 13 76Q12 91 34 87Z','url(#shade)')+[35,51,76,91].map(x=>R(x,83,10,26,4)+R(x-1,103,13,8,4,'#a47b72')).join('')+E(62,75,37,23)+E(56,64,18,10,'#c69b7b')+R(50,62,15,24,5,'url(#trim)')+star(57,72,6)+G(animalFace(type,false),'translate(40 3) scale(.8)')+horns;
 if(type==='sheep')b=[32,46,61,76].map(x=>C(x,63,13,cream)).join('')+b;
 if(type==='lion')b=G(Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return C(90+Math.cos(a)*25,43+Math.sin(a)*25,12,'#e8a15d');}).join(''),'translate(-3 3)')+b;
 if(id===3)b+=[0,1,2].map(i=>C(36+i*12,72,4,['#f7a0b9','#b6a3e6','#8cdad0'][i])).join('');if(id===8)b+=flower(91,81,10,gold);if(id===24)b+=flower(88,18,9)+flower(106,22,7);return b;
}
function rideArt(id){if([1,3,4,6,8,23,24].includes(id))return mountAnimal(({1:'sheep',3:'deer',4:'unicorn',6:'dragon',8:'lion',23:'dragon',24:'deer'})[id],id);
 if(id===7)return G(petArt(25),'translate(0 4) scale(.96)')+R(43,48,32,14,6,'url(#trim)')+L('M50 49V62M69 49V62',gold,2);
 if(id===5||id===15)return (id===5?E(64,40,35,33)+E(64,40,18,33,'url(#trim)')+P('M30 40Q64 53 98 40L85 61H44Z','url(#shade)'):P('M11 57Q64 -3 117 57L96 64L64 45L32 65Z')+L('M64 19L33 61M64 19L94 61',cream,3)+flower(64,27,11,gold))+L('M42 62L49 96M86 62L79 96','#c49d7c',2.5)+R(44,91,40,22,7,'#d9ac77')+star(64,101,8);
 if(id===21)return P('M64 39Q38 25 8 66L37 78L64 71L91 78L120 66Q90 25 64 39Z')+P('M64 50L64 98L80 111','none',`stroke="${ink}" stroke-width="5"`)+P('M64 38L45 70L64 83L83 70Z','url(#trim)')+eyes(64,60,10)+smile(64,73)+L('M25 64L49 52M103 64L80 52','#e6fcff',3);
 if(id===19)return P('M20 82Q45 66 75 79L103 95Q108 111 86 111H30Q11 108 20 82Z','#f6d2a3')+E(76,69,35,33,'#efbd98')+P('M35 52Q38 13 76 14Q111 15 116 53Q79 69 35 52Z','#f78b9e')+[[-1,0],[1,0]].map(([s])=>C(76+s*23,41,9,cream)).join('')+C(73,27,8,cream)+L('M27 91L23 68M43 92L49 68',ink,3)+C(23,66,7,'#fff2d9')+C(49,66,7,'#fff2d9')+C(23,66,3,ink)+C(49,66,3,ink)+smile(34,94);
 if(id===25)return P('M14 77Q66 96 113 61L100 97Q60 120 26 102Z','url(#gold)')+P('M27 82Q65 94 102 77L94 94Q59 109 34 96Z')+L('M64 23V90','#a48476',4)+P('M61 18Q36 33 34 66L60 62Z',cream)+P('M69 27L103 62L69 66Z','#e8e2ff')+star(65,16,11)+C(49,94,5,'#ffeeb4')+C(74,94,5,'#ffeeb4');
 if(id===20)return wheels()+P('M34 53Q49 44 76 54L97 92H34Z')+P('M36 55Q66 20 96 55L90 62H42Z','url(#trim)')+G(animalFace('bunny',false),'translate(-9 33) scale(.55)')+moon(78,75,12);
 if(id===22)return wheels([28,62,97],100,12)+R(16,61,75,36,9)+R(75,34,34,62,6)+R(72,27,40,11,5,'url(#trim)')+R(82,43,20,24,4,'#c6f1ff')+R(23,43,14,23,4,'url(#gold)')+P('M18 39H44L39 48H23Z','url(#trim)')+motif('cloud',25,24,13)+C(43,77,20,'url(#shade)')+star(43,77,11)+L('M89 47H97','#fff',3);
 if(id===16)return G(P('M43 83L40 105L52 96L64 115L77 96L88 106L85 81Z','#ffc667')+P('M45 77Q33 32 64 12Q96 32 83 77L96 98L77 92H51L32 99Z',cream)+E(64,53,16,19)+C(64,51,10,'#a4deec')+P('M47 28L40 6Q58 9 60 22M68 22Q70 9 88 6L81 28Z',pink)+star(64,80,9),'rotate(19 64 64)');
 if(id===10)return wheels([26,99],104,10)+L('M23 94H79L94 32M90 32H107','#ac8acc',7)+R(74,89,31,9,4)+star(90,50,10);
 if(id===11)return wheels([25,102],96,21)+L('M25 95L47 56L77 95H25L58 76L72 48L102 95M43 51H58M72 48L80 33H96','#b685c1',6)+R(80,40,25,20,4,'url(#trim)')+flower(92,49,7);
 if(id===14)return wheels([30,53,77,101],104,8)+P('M22 60L64 57L69 80L107 86L109 99H20Z')+R(29,44,34,37,7,'url(#trim)')+G(animalFace('raccoon',false),'translate(13 -8) scale(.63)')+star(78,89,8);
 if(id===18)return P('M19 93Q72 112 112 74L104 95Q69 124 21 107Z','url(#gold)')+P('M25 62Q50 81 98 59L92 88Q60 104 31 87Z')+P('M98 59Q97 36 112 42Q119 57 105 63Z','url(#trim)')+star(58,78,14)+L('M13 56L28 61M8 74L22 76',pink,5);
 if(id===9)return wheels([31,95],103,11)+wings(58)+R(27,63,76,31,12,'url(#gold)')+L('M43 64V91M61 64V93M80 64V91','#ba8c61',5)+P('M31 55Q66 15 102 55Z')+L('M44 47L34 73M88 47L98 73',cream,3)+star(65,73,12);
 if(id===17)return wheels([30,97],104,11)+R(13,50,104,48,17)+[23,46,69,92].map(x=>R(x,60,17,19,5,'#8fcfe8')).join('')+motif('cloud',60,45,32)+L('M25 65H31M48 65H54M71 65H77M94 65H100','#fff',2)+smile(103,91);
 const body=wheels([29,97],101,id===12?18:13)+P(id===0?'M18 67L98 45L112 83Q106 100 83 100H26Z':id===2?'M16 65Q64 39 112 67L106 95H21Z':id===12?'M21 75L58 49L92 69L112 85L97 95H27Z':'M13 77L34 51L89 51L113 81V97H18Z')+R(44,52,41,26,7,'#b5e3ef')+L('M52 57L46 68','#fff',3)+star(69,87,11);
 return id===0?body+leaf(102,48,16,'#93d67a',38)+leaf(101,43,11,'#b4e58a',65):id===2?body+P('M24 53Q29 21 65 24Q98 21 105 53Z','#b38264')+R(61,14,8,17,4,'#9b6b53')+leaf(82,27,9):id===12?body+L('M81 50L88 37H105','#827190',5)+motif('star',51,68,9):body;
}
function potionArt(id){if(id===6)return C(64,66,42,'#dfad75')+C(64,66,34,'#f4cf94','stroke-width="2"')+[[47,50],[78,42],[83,77],[52,89],[37,72],[65,67]].map(([x,y])=>C(x,y,5,'#a57562')).join('')+leaf(64,32,9)+L('M36 44Q45 30 58 31','#fff1cc',3);
 if(id===7)return P('M19 65L65 19L111 65L70 110L23 94Z','#d8a776')+P('M17 57L64 12L112 58L66 100Z',cream)+P('M22 69L64 103L107 69L105 80L65 116L23 84Z','#9bd184')+P('M23 73L64 108L107 74L100 86L65 115L29 91Z','#ef9c9b')+L('M35 56L59 35','#fff',4)+motif('leaf',66,65,12);
 if(id===3)return E(64,106,43,7,'#d7c4e2')+P('M29 51H91L86 90Q61 113 36 91Z')+P('M92 56Q121 50 111 75L89 84Z','none',`stroke="${ink}" stroke-width="6"`)+E(60,52,31,10,'#bda1c8')+moon(61,76,15)+L('M45 35Q34 24 45 13M71 34Q59 20 70 8','#d4c3e8',3);
 const flask=id===2||id===5;const label=id===0?'berry':id===1?'sun':id===2?'leaf':id===4?'star':id===5?'star':id===8?'leaf':'star';
 return P(flask?'M48 20H80V47L107 91Q110 111 92 114H35Q16 111 22 91L48 47Z':'M47 20H81V42Q107 53 104 86Q106 114 64 114Q23 114 24 86Q20 55 47 42Z','#e1f6ff')+P(flask?'M37 77H91L101 95Q103 107 89 108H39Q24 107 29 95Z':'M31 74Q63 83 97 74L98 91Q95 109 64 108Q34 109 30 91Z')+R(43,13,42,14,5,'#c79a7c')+R(45,30,38,9,4,'url(#trim)')+motif(label,64,85,14)+L('M36 60Q29 72 33 86','#fff',4)+C(82,63,4,'#fff','stroke="none" opacity=".8"');
}
const data={weapon:WEAPONS,outfit:OUTFITS,pet:PETS,ride:RIDES,potion:POTIONS};const draw={weapon:weaponArt,outfit:outfitArt,pet:petArt,ride:rideArt,potion:potionArt};
const sky={weapon:[36,38],outfit:[29,31],pet:[21,23],ride:[19,23]},dawn={weapon:[42,44],outfit:[32,34],pet:[24,25],ride:[24,25]};
const paths={};let total=0;
for(const [kind,items]of Object.entries(data)){paths[kind]=[];for(const [id,item]of items.entries()){
 const base=hex(item.color??[0xef86aa,0xf3c25b,0x8cce92,0x9987c9,0x9da2df,0xe9bf69,0xd9a776,0xf2cc9b,0x80c8ab,0xb4a0dd][id]);const accent=hex(item.accent??0xffd882),dark=mix(base,'#7c507b',.35);
 const file=(sky[kind]&&id>=sky[kind][0]&&id<=sky[kind][1]?'skyward-':dawn[kind]&&id>=dawn[kind][0]&&id<=dawn[kind][1]?'dawn-':'')+kind+'-'+id+'.svg';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><title>${kind} ${id} · Berry Forest storybook icon</title><defs><linearGradient id="body" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="${mix(base,'#fff9df',.5)}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${mix(base,'#9b6389',.25)}"/></linearGradient><linearGradient id="shade" x2=".5" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="trim" x2=".3" y2="1"><stop stop-color="${mix(accent,'#fff',.35)}"/><stop offset="1" stop-color="${accent}"/></linearGradient><linearGradient id="gold" x2=".2" y2="1"><stop stop-color="#fff1ab"/><stop offset=".5" stop-color="#ffd566"/><stop offset="1" stop-color="#e9aa4f"/></linearGradient></defs><ellipse cx="64" cy="112" rx="36" ry="5" fill="#735773" opacity=".15"/><g transform="translate(5 6) scale(.91)" stroke="${ink}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${draw[kind](id)}</g><path d="M111 15v10m-5-5h10M16 88v6m-3-3h6" fill="none" stroke="${mix(base,'#fff',.2)}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
 writeFileSync(out+'/'+file,svg+'\n');paths[kind].push('art/berry-items-v1/'+file);total++;
}}
writeFileSync('src/item-icon-paths.ts','// Generated by scripts/generate-item-icons.mjs. Catalogue order preserves saved item IDs.\nexport const ITEM_ICON_PATHS = '+JSON.stringify(paths,null,2)+' as const;\n');
console.log(`Prepared ${total} original storybook icons: ${Object.entries(paths).map(([k,v])=>k+' '+v.length).join(', ')}`);
