param([switch]$Review,[switch]$Roads,[switch]$Art,[switch]$Perf)
$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$chrome='C:/Program Files/Google/Chrome/Application/chrome.exe'
if(-not (Test-Path -LiteralPath $chrome)){throw 'Google Chrome wurde nicht gefunden.'}
$kind=if($Perf){'perf'}elseif($Art){'art'}elseif($Roads -or $Art){'roads'}elseif($Review){'review'}else{'tests'}
$html=Join-Path $workspace ('.gameplay-'+$kind+'.html')
$dom=Join-Path $PSScriptRoot ($kind+'_dom.html')
$profile=Join-Path $PSScriptRoot ($kind+'-profile')
$source=Get-Content -Raw -Encoding utf8 (Join-Path $workspace 'pixxo.html')
$source=$source.Replace('<head>','<head><script>window.addEventListener("error",e=>{const p=document.createElement("pre");p.id="runtime-error";p.textContent=e.message+" "+e.filename+":"+e.lineno;document.body?.append(p);});</script>')
$script=if($Perf){'perf_tests.js'}elseif($Art){'art_review.js'}elseif($Roads -or $Art){'road_review.js'}else{'gameplay_'+$kind+'.js'}
if($Roads -or $Art){$source=$source.Replace('<script>init();','<script>')}
$source=$source.Replace('</script></body></html>',('</script><script src="pixxo_tests/'+$script+'"></script></body></html>'))
Set-Content -LiteralPath $html -Value $source -Encoding utf8
$url='file:///'+$html.Replace('\','/')
$argsList=@('--headless','--disable-gpu','--allow-file-access-from-files',('--user-data-dir='+$profile),'--window-size=1440,1000','--dump-dom','--virtual-time-budget=3000',$url)
if($Review){$argsList+=('--screenshot='+ (Join-Path $PSScriptRoot 'gameplay_review.png'))}
try{
 $ErrorActionPreference='Continue'
 & $chrome @argsList 2> (Join-Path $PSScriptRoot ($kind+'_chrome.log')) | Set-Content -LiteralPath $dom -Encoding utf8
 $ErrorActionPreference='Stop'
 $rendered=Get-Content -Raw -Encoding utf8 $dom
 $errors=[regex]::Matches($rendered,'id="runtime-error">([^<]+)')
 if($errors.Count){throw ($errors | ForEach-Object {$_.Groups[1].Value} | Out-String)}
 $pattern=if($Roads -or $Art){'(?s)<script type="application/json" id="road-image">(.*?)</script>'}elseif($Review){'(?s)<script type="application/json" id="ui-audit">(.*?)</script>'}else{'(?s)<pre id="test-results">(.*?)</pre>'}
 $result=[regex]::Match($rendered,$pattern)
 if(-not $result.Success){throw 'Der Browser hat keine Prüfergebnisse zurückgegeben.'}
 $data=$result.Groups[1].Value | ConvertFrom-Json
 if($Roads -or $Art){[IO.File]::WriteAllBytes((Join-Path $PSScriptRoot ($(if($Art){'art_review.png'}else{'road_review.png'}))),[Convert]::FromBase64String($data.data));Write-Output 'Grafikvorschau gerendert';return}
 $data | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($kind+'_results.json')) -Encoding utf8
 if($Review){$data | ConvertTo-Json -Depth 12}else{Write-Output ($data.passed.ToString()+'/'+$data.total+' Tests bestanden');if($data.passed -ne $data.total){$data.results | Where-Object {-not $_.ok} | Format-List;throw 'Regressionstest fehlgeschlagen.'}}
}finally{
 if(Test-Path -LiteralPath $html){Remove-Item -LiteralPath $html}
}





