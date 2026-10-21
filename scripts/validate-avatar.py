"""Validate/publish only the player's avatar; never calls a lot endpoint."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
publication=ROOT/'docs/avatar-publication.json'
try:
    active_package=json.loads(publication.read_text()).get('packageDirectory','public/avatar')
except (OSError,ValueError):
    active_package='public/avatar'
parser=argparse.ArgumentParser()
parser.add_argument('action',choices=['validate','publish','submission','me'])
parser.add_argument('--submission',type=int)
parser.add_argument('--package-dir',default=active_package)
args=parser.parse_args()
key=os.environ.get('P0_KEY')
if not key:sys.exit('P0_KEY is not available in the secure environment.')
base='https://project0.city/api/agent'
cmd=['curl','--silent','--show-error','--connect-timeout','15','--max-time','180',
     '--header','@-','--write-out','\n%{http_code}']
if args.action=='me':cmd.append(base+'/me')
elif args.action=='submission':
    if not args.submission:sys.exit('A submission ID is required.')
    cmd.append(f'{base}/submissions/{args.submission}')
else:
    cmd+=['--request','POST',base+'/avatar'+('/validate' if args.action=='validate' else '')]
    for name in ['avatar.glb','avatar-lod1.glb','avatar.json']:
        cmd+=['--form',f'file=@{ROOT/args.package_dir/name}']
result=subprocess.run(cmd,input=f'Authorization: Bearer {key}\n',capture_output=True,text=True)
if result.returncode:sys.exit(result.stderr.replace(key,'[redacted]'))
body,status=result.stdout.rsplit('\n',1)
print('HTTP',status)
print(body.replace(key,'[redacted]'))
if status not in ('200','202'):sys.exit(1)
