/* Einziger editierbarer Produktname. Technische Dateinamen und Speicherdaten bleiben stabil. */
window.GAME_BRAND=Object.freeze({name:'Pixxo',logo:'assets/logo.svg',exportFilename:'spielstand.json',donationUrl:'https://ko-fi.com/nailyk'});
document.title=document.title.replace(/^Spiel(?= ·|$)/,window.GAME_BRAND.name);
addEventListener('DOMContentLoaded',()=>{for(const element of document.querySelectorAll('[data-brand-label]'))element.setAttribute('aria-label',window.GAME_BRAND.name);for(const image of document.querySelectorAll('[data-brand-logo]')){image.src=window.GAME_BRAND.logo;image.alt=window.GAME_BRAND.name;}},{once:true});
