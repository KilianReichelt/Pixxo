from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
baseline='--baseline' in sys.argv
code=(Path(__file__).resolve().parent/'balancing_simulation.js').read_text(encoding='utf-8')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
 page=browser.new_page();page.set_default_timeout(300000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 game=root/'Sicherung'/'pixxo.vor_balancing.html' if baseline else root/'pixxo.html'
 page.goto(game.as_uri());page.evaluate('G.speed=0');page.evaluate(code)
 results=[]
 for seed in [int(x) for x in sys.argv[1:] if not x.startswith('--')] or [1234]:
  result=page.evaluate('seed=>simulateCampaign(seed,360)',seed);results.append(result)
  print(json.dumps({k:result[k] for k in ['seed','fert','minutes','failure','milestones','minimum','counts','workers','islands','finished']},ensure_ascii=False),flush=True)
  print('LAST',json.dumps(result['samples'][-3:],ensure_ascii=False),flush=True)
 out=root/'pixxo_tests'/('balancing_vorher_final.json' if baseline else 'balancing_simulation_results.json');out.write_text(json.dumps({'results':results,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
 print('ERRORS',errors);browser.close()
