"""Browserintegration aus dem aktuellen Spiel mit isoliertem Speicherschlüssel."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
s=(root/'pixxo.html').read_text().replace('href="assets/','href="../assets/').replace('src="assets/','src="../assets/')
s=s.replace("const SAVEKEY='pixxo_v1'", "const SAVEKEY='pixxo-integration-v3'")
s=s.replace('<body>','<body><pre id="pixxo-test-results" style="position:fixed;right:10px;top:110px;z-index:100001;background:#281d16;color:#e8cb85;padding:15px;max-width:650px;white-space:pre-wrap">Integrationstests laufen …</pre>')
s=s.replace('console.error(error);','console.error(error);document.getElementById("pixxo-test-results").textContent=error.stack;')
s=s.replace('</body>', '<script src="pixxo_legacy_fixture.js"></script><script src="pixxo_balance.js"></script><script src="pixxo_checks.js"></script><script>addEventListener("error",e=>{document.getElementById("pixxo-test-results").textContent=e.message+"\\n"+e.filename+":"+e.lineno;});</script></body>')
(root/'pixxo_tests/pixxo-browser.html').write_text(s)
