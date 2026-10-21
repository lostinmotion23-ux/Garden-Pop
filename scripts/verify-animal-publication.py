"""Independently verify both authorized animal-art publications without CDN credentials."""
from pathlib import Path
import json,os,subprocess,datetime,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
def reply(name):return json.loads((ROOT/'.local'/name).read_text().split('\n',1)[1])
def get(url):
 assert url.startswith('https://project0.city/api/agent/')
 r=subprocess.run(['curl','-sS','--fail','--max-time','40','--header','@-',url],input='Authorization: Bearer '+os.environ['P0_KEY']+'\n',text=True,capture_output=True,check=True)
 return json.loads(r.stdout)
a=reply('animals-lot-published.txt');b=reply('animals-game-published.txt');submissions=[get(p['check']) for p in (a,b)]
for s in submissions:
 if s['status']!='live':print('Submission',s['id'],s['status']);sys.exit(2)
lot=next(l for l in get('https://project0.city/api/agent/me')['lots'] if l['id']==3157)
assert lot['version']==a['lot']['version']
assert lot['experience']['version']==b['lot']['experience']['version']
assert a['lot']['box']=='subtle'
assert (ROOT/'src/experience/game/rules.js').read_bytes()==(ROOT/'.local/before-expressive-animals/source/game/rules.js').read_bytes()
for level,r in a['reports'].items():
 assert r['ok'] and not r['errors'] and not r['warnings'];assert r['stats']['bytes']<=r['budget']['fileBytes']
assert not b.get('warnings')
now=datetime.datetime.now(datetime.timezone.utc).isoformat();p=ROOT/'docs/publication.json';old=json.loads(p.read_text());d={**old,'previous':old,'displayVersion':lot['version'],'experienceVersion':lot['experience']['version'],'verifiedAt':now,'submissions':submissions,'exterior':json.loads((ROOT/'public/lot/garden.json').read_text()),'cityAnimation':a.get('look'),'animalArt':'animated-animal-art.md'};p.write_text(json.dumps(d,indent=2)+'\n')
record={'verifiedAt':now,'lot':3157,'displayVersion':lot['version'],'experienceVersion':lot['experience']['version'],'submissions':submissions,'gameplayRulesUnchanged':True,'optimizedReports':a['reports'],'cityAnimation':a.get('look'),'gameWarnings':b.get('warnings',[]),'streetPreview':'previews/exterior-street-front.png','actualMeshPosePreviews':['previews/mesh-animals-smile.png','previews/mesh-animals-shock.png','previews/mesh-animals-sad.png','previews/mesh-animals-blink.png']};(ROOT/'docs/animal-publication.json').write_text(json.dumps(record,indent=2)+'\n')
print('Verified LIVE:',[(s['kind'],s['id']) for s in submissions]);print('Street version:',lot['version']);print('Game version:',lot['experience']['version']);print('Optimized LOD bytes:',[r['stats']['bytes'] for r in a['reports'].values()]);print('Gameplay rules unchanged; subtle box retained.')
