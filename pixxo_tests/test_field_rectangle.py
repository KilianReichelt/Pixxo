"""Feldrechtecke: echte Pointer-Eingaben und verbindliche Platzierungsregeln."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start="new"]').click()
    page.wait_for_function('StartScreen.started')
    # Only this isolated test fixture receives resources; no actual save is touched.
    fixture=page.evaluate("""() => {
        const random=Math.random;let seed=7341;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};try{startNew();}finally{Math.random=random;}
        tutorialFinish();setSpeed(0);G.gold=100000;for(const g of GOODS)G.stock[g.id]=500;
        G.quests.u_farm=true;const port=G.blds.find(b=>b.type==='kontor');let owner;
        for(let y=port.y-35;y<port.y+35&&!owner;y++)for(let x=port.x-35;x<port.x+35;x++){
            if(!canPlace('farm',x,y).ok)continue;
            if(!footprintCells(x-2,y-2,B.farm.w+12,B.farm.h+12).every(([a,b])=>INMAP(a,b)&&BUILDABLE(G.tiles[IDX(a,b)])&&!G.occ[IDX(a,b)]&&!G.road[IDX(a,b)]))continue;
            owner=place('farm',x,y).b;break;
        }
        if(!owner)throw Error('Keine freie Testfläche');UI.fieldOwner=owner.id;setTool('build','acker');
        const t={x:owner.x+owner.w+1,y:owner.y};centerOn(t.x+2,t.y+2);setZoom(2,innerWidth/2,innerHeight/2);
        return {owner:owner.id,start:t};
    }""")
    def screen(tile):
        return page.evaluate("""t=>({x:innerWidth/2+((t.x+.5)*16-UI.cam.x)*UI.sc/UI.DR,y:innerHeight/2+((t.y+.5)*16-UI.cam.y)*UI.sc/UI.DR})""",tile)
    start=fixture['start']
    assert page.locator('#hint').is_hidden()
    a=screen(start)
    page.mouse.click(a['x'],a['y'])
    assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==1
    end={'x':start['x']+5,'y':start['y']+3}
    b=screen(end)
    page.mouse.move(a['x'],a['y']);page.mouse.down();page.mouse.move(b['x'],b['y'],steps=10)
    assert page.evaluate("constructionPlan.tool==='fields' && constructionPlan.fields.valid.length===23")
    assert page.locator('#hint').is_hidden()
    assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==1
    page.mouse.up()
    assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==24
    # Reverse drag, overlapping owner, existing fields, water/range, limit and stale state.
    report=page.evaluate("""() => {
        const owner=G.byId.get(UI.fieldOwner),before=fieldModules(owner).length;
        beginConstructionPlan({x:owner.x+20,y:owner.y+20});updateConstructionPlan({x:owner.x-20,y:owner.y-20});
        const proposed=constructionPlan.fields.valid.slice();if(proposed.length>40-before)throw Error('Flächenlimit überschritten');
        if(!constructionPlan.fields.skipped)throw Error('Ungültige Felder nicht übersprungen');
        finishConstructionPlan();const fields=fieldModules(owner);
        if(fields.length>40||fields.some(f=>Math.hypot(cx(f)-cx(owner),cy(f)-cy(owner))>24))throw Error('Reichweite/Limit verletzt');
        for(const f of fields)if(G.road[IDX(f.x,f.y)]||!BUILDABLE(G.tiles[IDX(f.x,f.y)]))throw Error('Ungültiges Gelände');
        const full=fields.length;beginConstructionPlan({x:owner.x+8,y:owner.y+8});cancelConstructionPlan();if(fieldModules(owner).length!==full)throw Error('Abbrechen hat gebaut');
        const removed=fields[0],tile={x:removed.x,y:removed.y};removeBld(removed,false);
        beginConstructionPlan(tile);if(constructionPlan.fields.valid.length!==1)throw Error('Wieder freies Feld fehlt');
        G.road[IDX(tile.x,tile.y)]=1;finishConstructionPlan();if(fieldModules(owner).length!==full-1)throw Error('Veränderte Fläche wurde nicht erneut geprüft');
        G.road[IDX(tile.x,tile.y)]=0;beginConstructionPlan(tile);const previous=UI.fieldOwner;UI.fieldOwner=-1;finishConstructionPlan();UI.fieldOwner=previous;
        if(fieldModules(owner).length!==full-1)throw Error('Veränderte Betriebszuordnung ignoriert');
        centerOn(tile.x+.5,tile.y+.5);return {fields:full,tile};
    }""")
    page.locator('#cv').focus()
    page.keyboard.press('Enter')
    assert page.evaluate("constructionPlan?.tool==='fields'")
    page.keyboard.press('ArrowRight')
    page.keyboard.press('Enter')
    assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==report['fields']
    page.keyboard.press('Enter')
    page.keyboard.press('Escape')
    assert page.evaluate('constructionPlan===null')
    page.evaluate("""() => {
        G.quests.u_schaefer=true;const farm=G.blds.find(b=>b.type==='farm');let owner;
        for(let y=farm.y-24;y<farm.y+24&&!owner;y++)for(let x=farm.x-24;x<farm.x+24;x++)if(canPlace('schaefer',x,y).ok){owner=place('schaefer',x,y).b;break;}
        if(!owner)throw Error('Keine Schäfer-Testfläche');UI.fieldOwner=owner.id;setTool('build','gehege');
        if(fieldRectangleEnabled())throw Error('Gehege erlaubt Rechteck');beginConstructionPlan({x:owner.x,y:owner.y});if(constructionPlan)throw Error('Gehege startet Rechteckplan');
    }""")
    for i in range(4):
        tile=page.evaluate("""()=>{const owner=G.byId.get(UI.fieldOwner),d=buildingSize(UI.type,UI.rotation||0);for(let y=owner.y-15;y<=owner.y+15;y++)for(let x=owner.x-15;x<=owner.x+15;x++)if(canPlace('gehege',x,y).ok){const t={x:x+Math.floor(d.w/2),y:y+Math.floor(d.h/2)};centerOn(t.x+.5,t.y+.5);return t;}throw Error('Keine gültige Gehegeposition');}""")
        pos=screen(tile)
        if i==3:
            page.locator('#cv').focus();page.keyboard.press('Enter')
        else:
            page.mouse.click(pos['x'],pos['y'])
        assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==i+1,(i,tile,page.evaluate('({type:UI.type,owner:UI.fieldOwner,fail:UI.paintFail,gpos:UI.gpos,hover:UI.hover})'))
        assert page.evaluate('constructionPlan===null')
    page.mouse.move(pos['x'],pos['y']);page.mouse.down();page.mouse.move(pos['x']+70,pos['y']+40,steps=5)
    assert page.evaluate('constructionPlan===null')
    page.mouse.up()
    assert page.evaluate('fieldModules(G.byId.get(UI.fieldOwner)).length')==4
    page.evaluate("""()=>{const modules=fieldModules(G.byId.get(UI.fieldOwner)),occupied=new Set();for(const f of modules){if(f.w!==2||f.h!==3)throw Error('Gehegegröße falsch');for(const [x,y] of footprintCells(f.x,f.y,f.w,f.h)){const k=IDX(x,y);if(occupied.has(k))throw Error('Gehege überlappen');occupied.add(k);}}}""")
    assert not errors,errors
    print('PASS: Einzelklick, Pointer-Rechteck, Vorschau, umgekehrtes Ziehen, Gelände, Belegung, Reichweite, Flächenlimit und Abbrechen.',report)
    browser.close()
