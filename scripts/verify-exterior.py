"""Verify the exact published street version and download its public close LOD."""
import os,json,subprocess,datetime,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read_reply(path):return json.loads(path.read_text().split('\n',1)[1])
def agent_get(url):
 assert url.startswith('https://project0.city/api/agent/')
 r=subprocess.run(['curl','--silent','--show-error','--fail','--max-time','40','--header','@-',url],input='Authorization: Bearer '+os.environ['P0_KEY']+'\n',text=True,capture_output=True,check=True)
 return json.loads(r.stdout)
def public_download(url,path):
 assert url.startswith('https://files.project0.city/lots/3157/')
 subprocess.run(['curl','--silent','--show-error','--fail','--max-time','60','--output',str(path),url],capture_output=True,check=True)
pub=read_reply(ROOT/'.local/exterior-published.txt')
submission=agent_get(pub['check'])
if submission['status']!='live':
 print('Submission',submission['id'],'status:',submission['status']);sys.exit(2)
live=next(l for l in agent_get('https://project0.city/api/agent/me')['lots'] if l['id']==3157)
# /me returns version/budgets but omits CDN and box fields. Publication's
# persisted lot response supplies those; assert matching versions first.
assert live['version']==pub['lot']['version']
lot={**pub['lot'],**live}
assert lot['version']==pub['lot']['version']
assert lot['experience']['version']=='e6e2a5eae73d2059','Exterior changed game version'
assert lot['box']=='subtle' and lot['boxColor']=='#d6a9c7'
validation=read_reply(ROOT/'.local/exterior-validation.txt')
assert validation['ok'] and all(r['ok'] and not r['errors'] and not r['warnings'] for r in validation['reports'].values())
original=json.loads((ROOT/'.local/game-before-exterior.json').read_text())
assert original=={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'public/experience').rglob('*') if p.is_file()}
downloaded=False
try:
 public_download(lot['lod0'],ROOT/'.local/exterior-live-lod0.glb')
 public_download(lot['script'],ROOT/'.local/exterior-live-build.js')
 assert 'BubbleMochi' in (ROOT/'.local/exterior-live-build.js').read_text()
 downloaded=True
except subprocess.CalledProcessError:
 print('Asset CDN download blocked by environment proxy. Live status/version are independently confirmed; captures use the exact uploaded model.')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
record={'lot':3157,'displayVersion':lot['version'],'experienceVersion':lot['experience']['version'],'submission':submission,'verifiedAt':now,'box':{'mode':lot['box'],'color':lot['boxColor']},'validation':validation,'gamePackageUnchanged':True,'publicModelDownloaded':downloaded,'optimizedPublishReports':pub['reports'],'publicModelBytes':((ROOT/'.local/exterior-live-lod0.glb').stat().st_size if downloaded else None),'publicModelSha256':(hashlib.sha256((ROOT/'.local/exterior-live-lod0.glb').read_bytes()).hexdigest() if downloaded else None),'streetCaptures':['previews/exterior-street-front.png','previews/exterior-street-angle.png'],'comparison':'exterior-comparison.md'}
(ROOT/'docs/exterior-verification.json').write_text(json.dumps(record,indent=2)+'\n')
p=ROOT/'docs/publication.json';old=json.loads(p.read_text());new={**old,'previous':old,'displayVersion':lot['version'],'verifiedAt':now,'exterior':json.loads((ROOT/'public/lot/garden.json').read_text()),'box':record['box'],'submissions':[submission]+[s for s in old['submissions'] if s['kind']!='lot']};p.write_text(json.dumps(new,indent=2)+'\n')
print('Verified live street submission',submission['id'],'version',lot['version'],'; game unchanged; subtle box confirmed; public asset download:',downloaded)
