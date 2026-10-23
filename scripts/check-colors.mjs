import assert from 'node:assert/strict';
import {Game,COLORS,COLOR_NAMES,trajectory} from '../src/experience/game/rules.js';

for(const [score,count] of [[0,5],[9999,5],[10000,6],[19999,6],[20000,7],[30000,8],[100000,15]]){
 const g=new Game();g.score=score;assert.equal(g.colorCount,count);
 assert.ok(COLORS[count-1]);assert.ok(COLOR_NAMES[count-1]);
 const seen=new Set();
 for(let i=0;i<30;i++){
  g.addRandomRow();
  for(const b of g.grid.cells.values())if(b.type==='normal'){assert.ok(b.color<count);seen.add(b.color);}
 }
 assert.equal(seen.size,count,`All ${count} unlocked colors enter fresh rows`);
 const copy=new Game().restore(g.snapshot());assert.equal(copy.colorCount,count);
 assert.deepEqual(copy.snapshot(),g.snapshot());
}
{
 const g=new Game();g.score=9990;
 const untouched=[...g.grid.cells.values()].filter(b=>b.type==='normal');
 const bubble=untouched.shift(),before=untouched.map(b=>[b.id,b.color]);
 g.settle([bubble]);assert.equal(g.score,10000);assert.equal(g.colorCount,6);
 assert.deepEqual(g.events.filter(e=>e.type==='color-unlock'),[{type:'color-unlock',count:6}]);
 for(const [id,color] of before){const b=[...g.grid.cells.values()].find(b=>b.id===id);if(b)assert.equal(b.color,color);}
 const h=new Game();h.score=19990;h.settle([[...h.grid.cells.values()].find(b=>b.type==='normal')]);
 assert.equal(h.colorCount,7);assert.ok(h.events.some(e=>e.type==='color-unlock'&&e.count===7));
}
{
 const g=new Game();g.score=30000;g.grid.cells.clear();g.grid.put(0,9,{type:'normal',color:7});
 assert.equal(g.chooseColor(),7);g.current=7;g.next=7;
 g.inventory.wild=1;g.select('wild');assert.ok(g.fire(trajectory(g.grid,0),7));
 assert.equal(g.inventory.wild,0);
 // New runs remain at five even after another game has expanded the palette.
 g.begin();assert.equal(g.colorCount,5);
 assert.ok([...g.grid.cells.values()].filter(b=>b.type==='normal').every(b=>b.color<5));
 g.inventory.wild=1;g.select('wild');assert.equal(g.fire(trajectory(g.grid,0),5),false);assert.equal(g.inventory.wild,1);
}
console.log('PASS: exact 10,000-point boundaries, unlocked row colors, deterministic restore, no recoloring, Wild support and reset isolation.');
