"""MP3s über HTTP samt GitHub-Pages-artigem Unterpfad und Autoplay testen."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith('/Pixxo/'):
            self.send_error(404)
            return
        self.path = self.path[len('/Pixxo'):]
        try:
            super().do_GET()
        except ConnectionError:
            pass  # Metadata probes intentionally cancel the remaining download.

    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True, args=['--autoplay-policy=no-user-gesture-required'])
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'http://127.0.0.1:{server.server_port}/Pixxo/pixxo.html')
        page.wait_for_function('StartScreen.ready && musicPlayer && !musicPlayer.paused && musicPlayer.currentTime>0', timeout=30000)
        assert '/Pixxo/assets/music/compressed/' in page.evaluate('musicPlayer.src')
        print('Musik startet ohne Klick bei erlaubtem Autoplay, auch im Repository-Unterpfad.')
        tracks = page.evaluate("PIXXO_MUSIC.map(t=>'assets/music/compressed/'+encodeURIComponent(t.replace('.wav','.mp3')))")
        for track in tracks:
            metadata = page.evaluate("""src=>new Promise((resolve,reject)=>{
                const a=new Audio();a.preload='metadata';
                a.onloadedmetadata=()=>{resolve({duration:a.duration});a.removeAttribute('src');a.load();};
                a.onerror=()=>reject(new Error('Track nicht ladbar: '+src));a.src=src;
            })""", track)
            assert metadata['duration'] > 30, (track, metadata)
        page.locator('[data-audio-mute]').click()
        assert page.evaluate('musicPlayer.paused')
        assert not errors, errors
        browser.close()
        print('Alle zwölf MP3s über HTTP geladen; sofortige Stummschaltung funktioniert.')
finally:
    server.shutdown()
    server.server_close()
