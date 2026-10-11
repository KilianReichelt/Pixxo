"""Firefox check via Mozilla's local Marionette protocol, in an isolated profile.
Protocol: https://firefox-source-docs.mozilla.org/remote/marionette/Protocol.html
"""
import base64,json,socket,subprocess,time
from pathlib import Path
root=Path(__file__).resolve().parent.parent
profile=root/'pixxo_tests/.runtime/firefox-ui-profile';profile.mkdir(parents=True,exist_ok=True)
with socket.socket() as candidate:
 candidate.bind(('127.0.0.1',0));port=candidate.getsockname()[1]
(profile/'user.js').write_text('user_pref("marionette.port",'+str(port)+');\nuser_pref("browser.shell.checkDefaultBrowser",false);\nuser_pref("browser.startup.homepage_override.mstone","ignore");\n',encoding='utf-8')
process=subprocess.Popen([r'C:\Program Files\Mozilla Firefox\firefox.exe','--headless','--no-remote','--profile',str(profile),'--marionette'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
connection=None
try:
 deadline=time.monotonic()+25
 while time.monotonic()<deadline:
  try:connection=socket.create_connection(('127.0.0.1',port),timeout=1);break
  except OSError:time.sleep(.1)
 assert connection,'Firefox Marionette did not start';connection.settimeout(40)
 def receive():
  length=b''
  while True:
   char=connection.recv(1)
   if char==b':':break
   if not char:raise RuntimeError('Firefox disconnected')
   length+=char
  data=b''
  while len(data)<int(length):data+=connection.recv(int(length)-len(data))
  return json.loads(data)
 print('Firefox handshake:',receive());sequence=0
 def command(name,params={}):
  global sequence
  sequence+=1;data=json.dumps([0,sequence,name,params],ensure_ascii=False).encode();connection.sendall(str(len(data)).encode()+b':'+data)
  response=receive();assert response[1]==sequence,response
  if response[2]:raise RuntimeError(response[2])
  result=response[3];return result.get('value',result) if isinstance(result,dict) else result
 def execute(script):return command('WebDriver:ExecuteScript',{'script':'return window.eval('+json.dumps('(function(){'+script+'})()')+');','args':[],'sandbox':None,'newSandbox':False})
 command('WebDriver:NewSession',{'capabilities':{}})
 command('WebDriver:SetWindowRect',{'width':1920,'height':1080})
 command('WebDriver:Navigate',{'url':(root/'pixxo.html').as_uri()})
 deadline=time.monotonic()+40
 while not execute('return typeof StartScreen!=="undefined"&&StartScreen.ready;'):
  if time.monotonic()>=deadline:
   print(execute('return {url:location.href,scripts:document.scripts.length,text:document.body.innerText.slice(0,500),local:typeof StartScreen,global:window.eval("typeof StartScreen"),loading:document.querySelector("#pixxo-loading")?.innerText};'))
   screenshot=command('WebDriver:TakeScreenshot',{'full':False});(root/'pixxo_tests/firefox-load-diagnostic.png').write_bytes(base64.b64decode(screenshot))
   raise AssertionError('Game did not load in Firefox')
  time.sleep(.2)
 execute('document.querySelector("[data-start=new]").click();')
 deadline=time.monotonic()+40
 while not execute('return StartScreen.started&&!StartScreen.loading;'):
  assert time.monotonic()<deadline,'Game did not start in Firefox';time.sleep(.2)
 execute('tutorialFinish();setSpeed(0);openWin_pins();updatePixelScrollbars();')
 print(execute('const el=WINS.pins.body,s=pixelScrollbars.get(el);return {browser:navigator.userAgent,rail:!s.y.rail.hidden&&s.y.rail.isConnected,paint:getComputedStyle(s.y.rail,"::before").width,native:getComputedStyle(el).scrollbarWidth};'))
 assert execute('const el=WINS.pins.body,s=pixelScrollbars.get(el);return !s.y.rail.hidden&&s.y.rail.isConnected&&getComputedStyle(s.y.rail,"::before").width==="14px"&&getComputedStyle(el).scrollbarWidth==="none";')
 execute('const s=pixelScrollbars.get(WINS.pins.body);s.y.thumb.focus();s.y.thumb.dispatchEvent(new KeyboardEvent("keydown",{key:"PageDown",bubbles:true,cancelable:true}));updatePixelScrollbars();')
 assert execute('return WINS.pins.body.scrollTop>0;')
 screenshot=command('WebDriver:TakeScreenshot',{'full':False});(root/'pixxo_tests/pixel-scrollbar-firefox.png').write_bytes(base64.b64decode(screenshot))
 execute('closeWin("pins");UI.barMode="deko";UI.cat=null;renderBar();updateDekoNavigation();')
 assert execute('return !!document.querySelector("#bar .deko-viewport")&&!document.querySelector("[data-deko-scroll=right]").hidden;')
 command('WebDriver:DeleteSession')
 print('PASS: Firefox uses the 14px game scrollbar, hides the native scrollbar, scrolls by keyboard, and shows Deko category arrows.')
finally:
 if connection:connection.close()
 if process.poll() is None:process.terminate()
 try:process.wait(timeout=5)
 except subprocess.TimeoutExpired:process.kill()
