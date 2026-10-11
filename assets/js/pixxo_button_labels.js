/* Native browser tooltips interrupt play. Keep accessible button names. */
function removeButtonTitles(node){
 if(node.nodeType!==1)return;
 const titles=node.matches('[title]')?[node,...node.querySelectorAll('[title]')]:[...node.querySelectorAll('[title]')];
 for(const element of titles){
  const button=element.closest('button,[role="button"],input[type="button"],input[type="submit"]');
  if(!button)continue;
  if(element===button&&!button.hasAttribute('aria-label')&&!button.hasAttribute('aria-labelledby')&&!button.textContent.trim())button.setAttribute('aria-label',button.title);
  element.removeAttribute('title');
 }
}
removeButtonTitles(document.documentElement);
new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='attributes'){if(record.target.hasAttribute('title'))removeButtonTitles(record.target);}
  else for(const node of record.addedNodes)removeButtonTitles(node);
 }
}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['title']});
