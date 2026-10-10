"""Ganzzahlige Hauskapazität, Ein-/Auszug und Spielstandmigration prüfen."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start="new"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    result=page.evaluate("""() => {
        const check=(ok,message)=>{if(!ok)throw Error(message);};const stages=[];
        for(const tier of [1,2,3]){
            const b={type:'haus',tier,conn:true,fire:0,pop:0,cov:{},sat:{}},needs=pixxoHouseNeeds(b),count=pixxoHouseNeedCount(b),per=pixxoResidentsPerNeed(b);
            check(Number.isInteger(per)&&per>=1,'Bewohner je Bedürfnis');check(TIERS[tier].cap>=[4,8,14][tier-1],'Kapazität nicht verkleinern');
            for(let combination=0;combination<2**count;combination++){
                let i=0;for(const svc of needs.services)b.cov[svc]=!!(combination&(1<<i++));for(const good of needs.goods)b.sat[good]=!!(combination&(1<<i++));
                const supplied=needs.services.filter(s=>b.cov[s]).length+needs.goods.filter(g=>b.cov.markt&&b.sat[g]).length;
                const cap=pixxoHouseCapacity(b);check(Number.isInteger(cap)&&cap===supplied*per,'Kapazität pro Bedürfnis');
            }
            for(const svc of needs.services)b.cov[svc]=true;for(const good of needs.goods)b.sat[good]=true;
            check(pixxoHouseCapacity(b)===TIERS[tier].cap,'Vollversorgung');
            for(const luxury of Object.keys(TIERS[tier].luxury||{})){
                check(!needs.goods.includes(luxury),'Luxus nicht Teil der Belegung');
                b.sat[luxury]=false;check(pixxoHouseCapacity(b)===TIERS[tier].cap,'Ohne Luxus volle Belegung');
                b.sat[luxury]=true;check(pixxoHouseCapacity(b)===TIERS[tier].cap,'Luxus erhöht Belegung nicht');
            }
            check(TIERS[tier].cap===[6,10,16][tier-1],'Kapazität ohne Luxus');
            b.fire=1;check(pixxoHouseCapacity(b)===0,'Brand');b.fire=0;b.conn=false;check(pixxoHouseCapacity(b)===0,'Straßenanschluss');b.conn=true;
            for(let tick=0;tick<800;tick++){pixxoHousePopulationStep(b,TIERS[tier].cap,.05);check(Number.isInteger(b.pop),'Ganzzahliger Einzug');}
            check(b.pop===TIERS[tier].cap,'Einzug nach 40 Sekunden');
            for(let tick=0;tick<1200;tick++){pixxoHousePopulationStep(b,0,.05);check(Number.isInteger(b.pop),'Ganzzahliger Auszug');}
            check(b.pop===0,'Auszug nach 60 Sekunden');
            b.pop=2;pixxoHousePopulationStep(b,TIERS[tier].cap,1);pixxoHousePopulationStep(b,0,1);check(b.populationDirection===-1,'Richtungswechsel');
            stages.push({tier,needs:count,perNeed:per,capacity:TIERS[tier].cap});
        }
        const port=G.blds.find(b=>b.type==='kontor');let home;
        for(let y=port.y-20;y<port.y+20&&!home;y++)for(let x=port.x-20;x<port.x+20;x++)if(canPlace('haus',x,y).ok){home=place('haus',x,y).b;break;}
        check(!!home,'Testhaus platzieren');home.pop=2.6;home.populationProgress=.35;home.populationDirection=1;saveGame();const id=home.id;
        check(loadGame(),'Alten Spielstand laden');setSpeed(0);home=G.byId.get(id);
        check(home.pop===3&&Number.isInteger(home.pop),'Bruchzahl aus altem Spielstand migrieren');check(home.populationProgress===.35&&home.populationDirection===1,'Einzugsfortschritt erhalten');
        saveGame();const saved=JSON.parse(localStorage.getItem(SAVEKEY)).islands[activeIsland].blds.find(b=>b.id===id);
        check(saved.pop===3&&saved.populationProgress===.35,'Ganzzahlige Bewohner speichern');
        return stages;
    }""")
    assert not errors,errors
    browser.close()
    print('PASS: Alle Bedarfskombinationen, ganze Ein-/Auszüge, Kapazitäten und Save-Migration.',result)
