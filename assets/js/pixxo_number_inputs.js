/* All numeric fields share the same native-grid arrows and retain native validity. */
let pixxoNumberId=0;
function pixxoNumberArrow(down){return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path '+(down?'transform="rotate(180 8 8)" ':'')+'d="M7 4h2v2h2v2h2v2H3V8h2V6h2Z" fill="currentColor"/></svg>';}
function enhanceNumberInputs(node){
 if(node.nodeType!==1)return;
 const inputs=node.matches('input[type="number"]')?[node]:[...node.querySelectorAll('input[type="number"]')];
 for(const input of inputs){
  if(input.closest('.trade-quantity-control'))continue;
  let control=input.closest('.pixxo-number-control');
  if(!control){
   const focused=document.activeElement===input,label=input.getAttribute('aria-label')||input.labels?.[0]?.textContent.trim()||input.name||'Wert';
   if(!input.id)input.id='pixxo-number-'+(++pixxoNumberId);
   control=document.createElement('span');control.className='pixxo-number-control';input.before(control);control.append(input);
   const steps=document.createElement('span');steps.className='pixxo-number-steps';
   for(const delta of [1,-1]){const button=document.createElement('button');button.type='button';button.className='pixxo-number-step';button.dataset.numberStep=delta;button.setAttribute('aria-label',label+(delta===1?' erhöhen':' verringern'));button.setAttribute('aria-controls',input.id);button.innerHTML=pixxoNumberArrow(delta===-1);steps.append(button);}
   control.append(steps);if(focused)input.focus({preventScroll:true});
  }
  for(const button of control.querySelectorAll('[data-number-step]'))button.disabled=input.disabled||input.readOnly;
 }
}
enhanceNumberInputs(document.body);
new MutationObserver(records=>{for(const record of records){if(record.type==='attributes')enhanceNumberInputs(record.target);else for(const node of record.addedNodes)enhanceNumberInputs(node);}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','readonly']});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-number-step]');if(!button||button.disabled)return;e.preventDefault();
 const input=button.closest('.pixxo-number-control').querySelector('input'),delta=Number(button.dataset.numberStep);
 try{input.stepUp(delta);}catch{const step=Number(input.step)||1,min=input.min===''?-Infinity:Number(input.min),max=input.max===''?Infinity:Number(input.max);input.value=Math.max(min,Math.min(max,(Number(input.value)||0)+step*delta));}
 input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
});
