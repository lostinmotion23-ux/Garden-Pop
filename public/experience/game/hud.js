import {ANIMALS,NAMES,POWERS,POWER_NAMES,COLOR_NAMES} from './rules.js';
const BROWN='#503b28',GOLD='#9e783d',SHORT=['Fire','Color','Mix','Star','Bomb','Wild','Bolt'];
function wildChoices(ui,game) {
  const count=game.colorCount;
  if(count<=5)return COLOR_NAMES.slice(0,count).map((label,i)=>({label,id:`color:${i}`,color:i}));
  const pages=Math.ceil(count/4),page=(ui.colorPage??0)%pages;
  const items=COLOR_NAMES.slice(page*4,Math.min(count,page*4+4)).map((label,i)=>({label,id:`color:${page*4+i}`,color:page*4+i}));
  items.push({label:'More',id:'color-next',color:-1});
  return items;
}
export function rescueCard(ui,game,index,x,y,w,h,time){
  const c=ui.ctx,kind=ANIMALS[index],count=game.rescued.filter(a=>a.kind===kind).length;
  const active=[...game.grid.cells.values()].some(b=>b.type==='animal'&&b.kind===kind);
  const began=ui.rescueStarts.get(kind),age=began===undefined?10:time-began;
  const t=Math.max(0,Math.min(1,age/.7)),progress=count?(1-(1-t)**3):0;
  c.fillStyle=active?'#f6e5bd':'#fff9eb';c.strokeStyle=age<1.2?'#cc9a42':active?'#b49456':'#c9b998';c.lineWidth=age<1.2?2.5:1;
  c.beginPath();c.roundRect(x,y,w,h,7);c.fill();c.stroke();
  if(age<1.2){c.save();c.shadowColor='#f6cd72';c.shadowBlur=12;c.fillStyle='#f3d79d';c.beginPath();c.arc(x+25,y+h/2,20,0,Math.PI*2);c.fill();c.restore();}
  if(ui.portraitAtlas)c.drawImage(ui.portraitAtlas,index%4*256,Math.floor(index/4)*256,256,256,x+4,y+3,40,h-6);
  ui.text(NAMES[index],x+50,y+14,16,BROWN);
  // Every existing species has one encounter in the unchanged garden progression.
  ui.text(`${count}/1`,x+w-9,y+14,16,BROWN,'right');
  c.fillStyle='#d7ccb5';c.beginPath();c.roundRect(x+50,y+h-14,w-61,7,3);c.fill();
  if(progress>0){c.fillStyle='#829b65';c.beginPath();c.roundRect(x+50,y+h-14,(w-61)*progress,7,3);c.fill();}
}
export function drawGardenHud(ui,game,state,time,w,h,phone){
  const c=ui.ctx;
  if(phone){
    const header=h<740?80:120,compact=header<100;
    ui.panel(8,8,w-16,header);
    ui.text('Bubble Critter Garden',w/2,compact?27:31,compact?21:24,BROWN,'center');
    ui.text(`Endless garden · ${game.score.toLocaleString()} points`,w/2,compact?53:60,18,BROWN,'center');
    ui.text(`${game.rescued.length} pets · Misses ${game.pendingMisses}/2`,w/2,compact?78:88,16,BROWN,'center');
    if(!compact)ui.text(`${game.colorCount} colors · ${game.ground.length} fallen treats`,w/2,113,16,GOLD,'center');
    const row=header+16;
    if(game.selected==='wild'){
      const chip=(w-108)/5;
      wildChoices(ui,game).forEach(({label,id,color},i)=>ui.button(id,label,8+i*(chip+2),row,chip,38,{font:16,selected:state.selectedColor===color}));
      ui.button('cancel','Cancel',w-88,row,80,38,{font:16,secondary:true});
    }else{
      ui.button('pause','Pause',10,row,83,38,{font:18});
      ui.button(game.selected?'cancel':'journal',game.selected?'Cancel':'Pet journal',103,row,w-206,38,{font:16,secondary:true});
      ui.button('sound',state.audio.sfx?'Sfx on':'Sfx off',w-93,row,83,38,{font:18,secondary:true});
    }
    const bw=(w-26)/4,top=h-125;
    for(let i=0;i<7;i++)ui.button(`power:${POWERS[i]}`,SHORT[i],
      10+i%4*(bw+2),top+Math.floor(i/4)*48,bw,42,{font:16,icon:i,iconSize:19,quantity:game.inventory[POWERS[i]],
        disabled:!game.inventory[POWERS[i]],selected:game.selected===POWERS[i],flash:ui.powerFeedback.get(POWERS[i])>time});
    ui.button('swap','Swap',10+3*(bw+2),top+48,bw,42,{font:18,secondary:true});
    const food=game.rescued.slice(0,2).map(a=>`${a.name} ${a.eaten}/10`).join(' · ');
    if(food){
      c.fillStyle='#fff5e5eb';c.beginPath();c.roundRect(10,h-161,w-20,28,7);c.fill();
      ui.regions.push({x:10,y:h-161,w:w-20,h:28});ui.text(food,w/2,h-146,16,BROWN,'center');
    }
    c.fillStyle='#fff5e5eb';c.beginPath();c.roundRect(10,h-30,w-20,25,7);c.fill();
    ui.text(game.selected?'Choose a target · Cancel is free':'Drag to aim · release to fire',w/2,h-16,16,BROWN,'center');
    ui.hudLayout={phone:true,header};return;
  }
  const pw=w<800?160:Math.min(270,Math.max(210,w*.18)),x=14,top=14,compact=h<580;
  const count=compact?0:Math.min(ANIMALS.length,h<700?4:8),cardH=h>=900?54:46;
  const panelH=compact?Math.min(h-52,292):Math.min(h-28,266+count*(cardH+4)+(count<8?34:0));
  ui.panel(x,top,pw,panelH);
  if(compact){
    ui.text('Bubble Critter',x+pw/2,38,19,BROWN,'center');ui.text('Garden',x+pw/2,63,21,BROWN,'center');
    ui.text(game.score.toLocaleString()+' points',x+pw/2,96,20,BROWN,'center');
    ui.text(`${game.rescued.length} pets · Miss ${game.pendingMisses}/2`,x+pw/2,128,16,BROWN,'center');
    ui.button('journal','Pet journal',x+10,150,pw-20,34,{font:16,secondary:true});
    ui.button('pause','Pause',x+10,192,pw-20,34,{font:18});
    ui.button('sound',state.audio.sfx?'Sound on':'Sound off',x+10,234,pw-20,32,{font:16,secondary:true});
  }else{
    ['Bubble','Critter','Garden'].forEach((title,i)=>ui.text(title,x+pw/2,35+i*27,25,BROWN,'center'));
    ui.text(`Endless garden · ${game.colorCount} colors`,x+pw/2,117,17,GOLD,'center');
    ui.text(game.score.toLocaleString()+' points',x+pw/2,146,25,BROWN,'center');
    ui.text(`${game.rescued.length} pets · Misses ${game.pendingMisses}/2`,x+pw/2,175,16,BROWN,'center');
    ui.journalPages=Math.ceil(ANIMALS.length/count);
    const first=Math.min(ui.journalPages-1,Math.max(0,ui.journalPage))*count;
    for(let i=0;i<count&&first+i<ANIMALS.length;i++)rescueCard(ui,game,first+i,x+10,194+i*(cardH+4),pw-20,cardH,time);
    let yy=194+count*(cardH+4)+5;
    if(count<ANIMALS.length){ui.button('journal-prev','‹',x+10,yy,40,28,{font:18,secondary:true});ui.text(`${first+1}–${Math.min(first+count,ANIMALS.length)} of ${ANIMALS.length}`,x+pw/2,yy+14,16,BROWN,'center');ui.button('journal-next','›',x+pw-50,yy,40,28,{font:18,secondary:true});yy+=35;}
    ui.button('pause','Pause',x+10,yy,pw-20,32,{font:18});
    ui.button('sound',state.audio.sfx?'Sound on':'Sound off',x+10,yy+39,pw-20,30,{font:16,secondary:true});
  }
  const rx=w-pw-14,rh=compact?h-74:Math.min(h-154,550),gap=(rh-58)/7;
  ui.panel(rx,14,pw,rh);
  ui.text('Garden powers',rx+pw/2,40,compact?19:23,BROWN,'center');
  for(let i=0;i<7;i++)ui.button(`power:${POWERS[i]}`,(w<800?SHORT[i]:POWER_NAMES[i]),
    rx+10,65+i*gap,pw-20,gap-5,{font:compact?16:17,icon:i,quantity:game.inventory[POWERS[i]],disabled:!game.inventory[POWERS[i]],
      selected:game.selected===POWERS[i],flash:ui.powerFeedback.get(POWERS[i])>time});
  ui.button(game.selected?'cancel':'swap',game.selected?'Cancel power':'Swap colors',rx,14+rh+9,pw,34,{font:17,secondary:true});
  if(game.selected==='wild' && compact){
    const width=w-2*(pw+24),bw=(width-8)/5;
    wildChoices(ui,game).forEach(({label,id,color},i)=>ui.button(id,label,w/2-width/2+i*(bw+2),5,bw,30,{font:16,selected:state.selectedColor===color}));
  }else if(game.selected==='wild'){
    const bw=(pw-12)/3;
    wildChoices(ui,game).forEach(({label,id,color},i)=>ui.button(id,label,rx+i%3*(bw+4),14+rh+51+Math.floor(i/3)*34,bw,29,{font:16,selected:state.selectedColor===color}));
  }
  ui.hudLayout={phone:false,rx,pw,leftBottom:top+panelH,compact,inventoryBottom:14+rh};
  c.fillStyle='#fff5e5e8';c.beginPath();c.roundRect(w/2-210,h-32,420,28,8);c.fill();
  ui.text(game.selected?'Choose the power target':'Aim · click to shoot · right-click to swap',w/2,h-18,16,BROWN,'center');
}
export function drawRescueJournal(ui,game,time,x,y,w,h){
  const capacity=Math.max(2,Math.min(4,Math.floor((h-135)/57))),pages=Math.ceil(ANIMALS.length/capacity);
  ui.journalPages=pages;ui.journalPage=Math.max(0,Math.min(pages-1,ui.journalPage));
  for(let i=0;i<capacity;i++){
    const index=ui.journalPage*capacity+i;if(index>=ANIMALS.length)break;
    rescueCard(ui,game,index,x+18,y+75+i*57,w-36,49,time);
  }
  const by=y+h-48;ui.button('journal-prev','Previous',x+18,by,100,32,{font:16,secondary:true});
  ui.button('back','Back',x+w/2-46,by,92,32,{font:16});ui.button('journal-next','Next',x+w-118,by,100,32,{font:16,secondary:true});
}
