"""Start, Audio und Einführung in einem isolierten Chrome-Profil prüfen."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
results = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        headless=True,
        args=["--autoplay-policy=document-user-activation-required"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((root / "pixxo.html").as_uri())
    page.wait_for_function("StartScreen.ready")
    page.wait_for_selector("#pixxo-loading", state="detached")
    page.wait_for_function("musicAwaitingGesture && musicPlayer.paused")
    assert page.locator("#pixxo-start").is_visible()
    assert page.locator('[data-start="continue"]').count() == 0
    assert page.evaluate("localStorage.getItem(SAVEKEY)") is None
    if os.environ.get('PIXXO_VERIFY_PREVIEW','1')=='1':
        page.wait_for_function("sceneryImage.complete && sceneryImage.naturalWidth>0")
    assert page.locator("[data-scenery-motion]").count() == 0
    page.emulate_media(reduced_motion="reduce")
    assert page.evaluate("getComputedStyle(sceneryImage).animationName") == "none"
    page.emulate_media(reduced_motion="no-preference")
    results.append("Erstbesuch zeigt das Startmenü und erzeugt keinen Spielstand.")

    page.locator('[data-start="credits"]').click()
    assert "Kilian Reichelt" in page.locator("#pixxo-start").inner_text()
    assert page.locator("#pixxo-start a").get_attribute("href") == "https://vacuous2409.itch.io/open-world-field-bgm-series-vol01"
    page.keyboard.press("Escape")
    page.locator('[data-start="settings"]').click()
    page.locator('[data-start-background]').uncheck()
    assert page.evaluate('sceneryUserPaused && startScenery.classList.contains("scenery-paused")')
    page.locator('[data-start-background]').check()
    assert not page.evaluate('sceneryUserPaused')
    axe = os.environ.get("PIXXO_AXE_SCRIPT")
    if axe:
        page.add_script_tag(path=axe)
        accessibility = page.evaluate("""async () => (await axe.run(document.querySelector('#pixxo-start'), {
            runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
        })).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))""")
        assert not accessibility, accessibility
    page.locator("#start-music-volume").fill("40")
    page.locator("#start-effects-volume").fill("70")
    page.locator("#start-ambient-volume").fill("53")
    assert page.evaluate("Sound.prefs.ambient") == .53
    assert page.evaluate("Sound.prefs.music") == .4
    assert page.evaluate("Sound.prefs.effects") == .7
    page.wait_for_function("musicPlayer && !musicPlayer.paused && musicPlayer.currentTime>0", timeout=20000)
    assert page.evaluate("musicPlayer.volume") == .26
    assert page.evaluate("Sound.beat") == 0
    assert page.evaluate("PIXXO_MUSIC.length") == 12
    assert page.locator("[data-audio-mute]").count()==0
    page.locator('[data-audio-channel-mute="music"]').click()
    assert page.evaluate("musicPlayer.paused")
    assert page.evaluate('Sound.prefs.music')==.4
    page.locator('[data-audio-channel-mute="music"]').click()
    page.wait_for_function("!musicPlayer.paused")
    previous_track=page.evaluate('musicIndex')
    page.evaluate("musicPlayer.dispatchEvent(new Event('ended'))")
    page.wait_for_function('(previous)=>musicIndex!==previous && !musicPlayer.paused',arg=previous_track)
    assert page.evaluate("musicPlayer.src.endsWith(encodeURIComponent(PIXXO_MUSIC[musicIndex].replace('.wav','.mp3')))")
    results.append("Lokale MP3-Musik, Titelwechsel, unabhängige Lautstärken und Stummschaltung funktionieren.")
    for width, height in [(1440,768),(768,768),(390,667),(320,568)]:
        page.set_viewport_size({"width":width,"height":height})
        assert page.evaluate("startDialog.scrollHeight<=startDialog.clientHeight"), (width,height,page.locator('.start-settings-card').evaluate("e=>[...e.querySelectorAll('h1,h2,p,label,input,button,section,img')].map(x=>({tag:x.tagName,text:x.textContent,height:x.getBoundingClientRect().height,padding:getComputedStyle(x).padding,margin:getComputedStyle(x).margin}))"))
        if width in [1440,320]:
            page.screenshot(path=str(root / f'pixxo_tests/pixxo-settings-{width}.png'))
    page.set_viewport_size({"width":1440,"height":1000})

    for width in [1440, 768, 390, 320]:
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("""() => {
            const card=document.querySelector('.start-card').getBoundingClientRect();
            return card.left>=0&&card.right<=innerWidth&&document.querySelector('#pixxo-start').scrollWidth<=innerWidth;
        }""")
        small = page.evaluate("""() => [...document.querySelectorAll('#pixxo-start *')].filter(e=>{
            const r=e.getBoundingClientRect();return r.width&&r.height&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<14;
        }).map(e=>e.tagName)""")
        assert not small, small
    page.set_viewport_size({"width": 320, "height": 900})
    page.evaluate("document.documentElement.style.fontSize='200%'")
    assert page.evaluate("document.querySelector('#pixxo-start').scrollWidth<=innerWidth")
    page.locator('[data-start="home"]').click()
    assert page.evaluate("document.querySelector('#pixxo-start').scrollWidth<=innerWidth")
    page.evaluate("document.documentElement.style.fontSize=''")
    page.locator('[data-start="settings"]').click()
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.keyboard.press("Escape")
    page.keyboard.press("Escape")
    assert page.locator("#pixxo-start").is_visible(), page.evaluate("({open:startDialog.open,page:StartScreen.page,errors:document.querySelector('#pixxo-start').textContent})")
    results.append("Startmenü bleibt bei Escape offen und passt auf 320 bis 1440 Pixel.")

    page.locator('[data-start="new"]').click()
    page.wait_for_function("StartScreen.started && WORLD && !tutorialPanel.hidden", timeout=30000)
    assert not page.locator("#pixxo-start").is_visible()
    assert page.evaluate("WORLD.tutorial.version") == 2
    page.wait_for_function("!tutorialOutline.hidden")
    page.set_viewport_size({'width':320,'height':568})
    page.evaluate("document.documentElement.style.fontSize='200%'")
    assert page.evaluate("""() => {const b=document.querySelector('[data-tour=skip]').getBoundingClientRect();return b.width>=44&&b.height>=44&&b.bottom<=innerHeight&&b.right<=innerWidth;}""")
    page.evaluate("document.documentElement.style.fontSize=''")
    page.set_viewport_size({'width':1440,'height':1000})
    if axe:
        page.add_script_tag(path=axe)
        violations=page.evaluate("""async()=> (await axe.run(document.querySelector('#pixxo-tour'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    assert page.evaluate("!!localStorage.getItem(SAVEKEY)")
    assert page.evaluate("G.speed") == 0
    before_tour = page.evaluate("G.time")
    page.evaluate("setSpeed(2);stepWorld(2)")
    assert page.evaluate("G.speed") == 0
    assert page.evaluate("G.time") == before_tour
    page.locator('[data-tour="next"]').click()
    if page.locator('[data-tour="map"]').count():
        page.locator('[data-tour="map"]').click()
    else:
        page.locator('#cv').focus()
    camera = page.evaluate("UI.cam.x")
    page.keyboard.press("ArrowRight")
    assert page.evaluate("UI.cam.x") > camera
    page.locator('[data-tour="next"]').click()
    assert page.evaluate("WORLD.tutorial.step") == 2
    page.screenshot(path=str(root / "pixxo_tests/pixxo-start-tutorial.png"))
    page.reload()
    page.wait_for_function("StartScreen.ready")
    assert page.locator('[data-start="continue"]').is_visible()
    page.locator('[data-start="continue"]').click()
    page.wait_for_function("StartScreen.started")
    assert page.evaluate("WORLD.tutorial.step") == 2
    results.append("Neue Partie startet die Einführung; Fortschritt bleibt nach Reload erhalten.")

    for step in range(2, 15):
        assert page.evaluate("WORLD.tutorial.step") == step
        page.wait_for_timeout(220)
        assert page.evaluate("!tutorialOutline.hidden"), f"Fehlende Hervorhebung in Schritt {step}"
        if step == 3:
            for width in [390, 320]:
                page.set_viewport_size({"width": width, "height": 900})
                assert page.locator('[data-tour="skip"]').is_visible()
                assert page.evaluate("""() => {
                    const r=document.querySelector('[data-tour="skip"]').getBoundingClientRect();
                    return r.bottom<=innerHeight&&r.right<=innerWidth&&r.height>=44;
                }""")
            page.screenshot(path=str(root / "pixxo_tests/pixxo-start-tutorial-mobile.png"))
            page.set_viewport_size({"width": 1440, "height": 1000})
        if step < 14:
            page.locator('[data-tour="next"]').click()
    page.locator('[data-tour="next"]').click()
    assert page.locator("#pixxo-tour").is_hidden()
    assert page.evaluate("WORLD.tutorial.done")
    assert page.evaluate("!document.querySelector('.tour-target')")
    assert page.evaluate('G.speed') == 1  # Reload restores the normal resume speed.
    assert page.locator('#map-key-cursor').is_hidden()
    page.evaluate('setSpeed(0)')
    page.locator('#cv').focus()
    assert page.locator('#map-key-cursor').is_hidden()
    page.keyboard.press('ArrowRight')
    assert page.locator('#map-key-cursor').is_visible()
    page.mouse.move(710,410)
    assert page.locator('#map-key-cursor').is_hidden()
    page.keyboard.press('ArrowRight')
    assert page.locator('#map-key-cursor').is_visible()
    page.mouse.wheel(0,20)
    assert page.locator('#map-key-cursor').is_hidden()
    page.keyboard.press('ArrowRight')
    page.mouse.click(700,400)
    assert page.locator('#map-key-cursor').is_hidden()
    page.locator('#cv').focus()
    assert page.locator('#map-key-cursor').is_hidden()
    results.append('Kachelmarkierung nur bei Tastatursteuerung; Maus und Tutorialabschluss blenden sie aus.')
    fog = page.evaluate("""() => {
        dayClock().system=false;dayClock().minutes=720;
        const sample=()=>Array.from(prepareFog().getContext('2d').getImageData(0,0,1,1).data);
        const day=sample();dayClock().minutes=0;const night=sample();
        dayClock().minutes=1260;const dusk=sample();dayClock().minutes=720;
        return {day,night,dusk};
    }""")
    assert sum(fog['night'][:3]) < sum(fog['dusk'][:3]) < sum(fog['day'][:3]), fog
    assert fog['day'][3] == fog['night'][3] == fog['dusk'][3], fog
    results.append('Nachtnebel mit Dämmerung; Aufdeckungsalpha bleibt unverändert.')
    page.evaluate("startShow('settings')")
    page.set_viewport_size({'width':320,'height':568})
    assert page.locator('[data-start="tutorial"]').is_visible()
    assert page.locator('.start-back').inner_text() == 'Spiel fortsetzen'
    assert page.evaluate('startDialog.scrollHeight<=startDialog.clientHeight')
    page.set_viewport_size({'width':1440,'height':1000})
    page.locator('.start-back').click()
    assert page.locator('#pixxo-start').is_hidden()
    assert page.evaluate('G.speed') == 0  # Preserve a deliberate player pause.
    page.evaluate('setSpeed(1)')
    page.evaluate("startShow('settings')")
    stopped = page.evaluate('G.time')
    page.locator('.start-back').click()
    page.evaluate('stepWorld(2)')
    assert page.evaluate('G.time') > stopped
    page.evaluate("startShow();startRender('settings')")
    assert page.locator('.start-back').inner_text() == 'Zurück zum Startmenü'
    page.locator('.start-back').click()
    assert page.evaluate("StartScreen.page==='home' && startDialog.open")
    page.locator('[data-start="continue"]').click()
    results.append('Einstellungen kehren abhängig vom Aufruf ins Spiel oder ins Startmenü zurück.')
    results.append("Alle 15 Tutorial-Schritte heben ihr Ziel hervor; Abschluss räumt die Hervorhebung auf.")

    page.evaluate("openWin_menu()")
    page.locator('[data-act="tutorial-open"]').click()
    page.locator('[data-tour="collapse"]').click()
    assert page.locator("#tour-content").is_hidden()
    page.locator('[data-tour="skip"]').click()
    assert page.evaluate("WORLD.tutorial.dismissed")
    page.evaluate("startShow()")
    before = page.evaluate("G.time")
    page.evaluate("stepWorld(2)")
    assert page.evaluate("G.time") == before
    page.locator('[data-start="new"]').click()
    assert page.locator('[data-start="confirm-new"]').is_visible()
    page.keyboard.press("Escape")
    page.locator('[data-start="continue"]').click()
    assert page.locator("#pixxo-tour").is_hidden()
    page.evaluate("setSpeed(1)")
    page.evaluate("stepWorld(2)")
    assert page.evaluate("G.time") > before
    results.append("Tutorial ist einklappbar und überspringbar; Startmenü pausiert die Welt, Abbrechen bewahrt die Partie.")

    played = page.evaluate("Sound.played")
    page.evaluate("soundEffect('build')")
    assert page.evaluate("Sound.played") > played
    assert page.evaluate("Sound.music.gain.value") >= 0
    assert not errors, errors
    results.append("SFX bleiben parallel zur Musik aktiv; keine JavaScript-Laufzeitfehler.")
    page.evaluate("startShow('credits')")
    page.screenshot(path=str(root / "pixxo_tests/pixxo-start-credits.png"))
    page.evaluate("startRender()")
    page.screenshot(path=str(root / "pixxo_tests/pixxo-start-menu.png"))
    if axe:
        page.add_script_tag(path=axe)
        for view in ["home", "settings", "credits", "confirm"]:
            page.evaluate("(view)=>startRender(view)", view)
            accessibility = page.evaluate("""async () => (await axe.run(document.querySelector('#pixxo-start'), {
                runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
            })).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))""")
            assert not accessibility, (view, accessibility)
        results.append("Startmenü, Einstellungen, Credits und Bestätigung bestehen die automatisierten WCAG-Prüfungen.")
    # Bestehende Regeln, Speicherung und Legacy-Migration bleiben geprüft.
    page.evaluate("startRender()")
    page.locator('[data-start="new"]').click()
    page.locator('[data-start="confirm-new"]').click()
    page.locator('[data-tour="skip"]').click()
    page.evaluate("setSpeed(0)")
    page.add_script_tag(path=str(root / "pixxo_tests/pixxo_balance.js"))
    page.add_script_tag(path=str(root / "pixxo_tests/pixxo_legacy_fixture.js"))
    regression = (root / "pixxo_tests/pixxo_checks.js").read_text(encoding="utf-8").split("setTimeout(()=>")[0]
    page.add_script_tag(content=regression)
    checks = page.evaluate("runPixxoChecks().passed")
    results.append(str(checks) + " bestehende Spielregressionen bestanden.")
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
