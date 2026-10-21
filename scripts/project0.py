"""Small Project 0 client. P0_KEY is read only from the environment, never saved."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['me','building','done','subtle-box','validate-lot','publish-lot','validate-experience','publish-experience'])
parser.add_argument('--lot',type=int,default=3157)
parser.add_argument('--parts',action='store_true',help='Upload assets in small official staging parts before validation/publication.')
args = parser.parse_args()
key = os.environ.get('P0_KEY')
if not key:
    sys.exit('Set P0_KEY securely in the environment; never put it in source or a browser bundle.')
base = 'https://project0.city/api/agent'
# Legacy garden assets remain in the repository but are not used by the botanical scene.
unused={'assets/garden.glb'}|{f'assets/{name}{suffix}.png' for name in ['leaf','soil','velvet'] for suffix in ['', '-normal', '-rough']}
def used(path):return str(path.relative_to(ROOT/'public/experience')) not in unused
command = ['curl','--silent','--show-error','--connect-timeout','15','--max-time','180','--header','@-','--write-out','\n%{http_code}']
if args.action == 'me':
    command.append(base+'/me')
elif args.action == 'subtle-box':
    command += ['--request','POST',f'{base}/lots/{args.lot}/box','--header','Content-Type: application/json','--data',json.dumps({'box':'subtle','color':'#d6a9c7'})]
elif args.action in ('building','done'):
    command += ['--request','POST',f'{base}/lots/{args.lot}/status','--header','Content-Type: application/json','--data',json.dumps({'building':args.action=='building'})]
elif args.action.endswith('lot'):
    operation = 'validate' if args.action.startswith('validate') else 'publish'
    command += ['--request','POST',f'{base}/lots/{args.lot}/{operation}']
    for level in range(3):
        command += ['--form',f'lod{level}=@{ROOT}/public/lot/lod{level}.glb']
    # Include the city animation package in both validation and publication.
    for name in ('lot.json','build.js','rows.glsl'):
        path=ROOT/'public/lot'/name
        if path.is_file(): command += ['--form',f'file=@{path}']
    if operation == 'publish':
        command += ['--form-string','manifest='+(ROOT/'public/lot/manifest.json').read_text()]
else:
    operation = '/validate' if args.action.startswith('validate') else ''
    package = ROOT/'.local/experience.zip'
    package.parent.mkdir(exist_ok=True)
    staged=set()
    if args.parts:
        files=[p for p in sorted((ROOT/'public/experience/assets').rglob('*')) if p.is_file() and used(p)]
        batches=[];batch=[];size=0
        for path in files:
            if batch and size+path.stat().st_size>6*1024*1024:
                batches.append(batch);batch=[];size=0
            batch.append(path);size+=path.stat().st_size
        if batch:batches.append(batch)
        for index,batch in enumerate(batches):
            part=ROOT/'.local'/f'experience-part-{index}.zip'
            with zipfile.ZipFile(part,'w',zipfile.ZIP_DEFLATED) as archive:
                for path in batch:archive.write(path,path.relative_to(ROOT/'public/experience'));staged.add(path)
            upload=command+['--request','POST',f'{base}/lots/{args.lot}/experience/parts','--form',f'package=@{part}']
            result=subprocess.run(upload,input=f'Authorization: Bearer {key}\n',text=True,capture_output=True)
            if result.returncode:sys.exit(result.stderr.replace(key,'[redacted]'))
            body,status=result.stdout.rsplit('\n',1)
            print(f'Asset part {index+1}/{len(batches)}: HTTP {status}')
            if status!='200':sys.exit(body.replace(key,'[redacted]'))
    with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted((ROOT/'public/experience').rglob('*')):
            if path.is_file() and used(path) and path not in staged: archive.write(path,path.relative_to(ROOT/'public/experience'))
    command += ['--request','POST',f'{base}/lots/{args.lot}/experience{operation}','--form',f'package=@{package}']
result = subprocess.run(command,input=f'Authorization: Bearer {key}\n',text=True,capture_output=True)
if result.returncode:
    sys.exit(result.stderr.replace(key,'[redacted]'))
body,status = result.stdout.rsplit('\n',1)
print('HTTP',status)
print(body.replace(key,'[redacted]'))
if status not in ('200','202'): sys.exit(1)
