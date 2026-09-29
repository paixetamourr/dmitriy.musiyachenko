'use strict';
const {projects,assets}=window.PORTFOLIO;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,app=$('#content'),nav=$('#navigation');
function stored(key,fallback){try{return localStorage.getItem(key)||fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem(key,value)}catch{}}
let lang=stored('portfolio-lang','ru')==='en'?'en':'ru';
let route='',homeScroll=0,stageOpen=false,carouselIndex=0,scrollPending=false,stageObserver;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const tr=(ru,en)=>lang==='ru'?ru:en;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function typography(s){
 if(lang!=='ru')return s;
 return s.replace(/(^|[\s(«])((?:в|во|к|ко|с|со|у|о|об|обо|от|ото|до|на|за|по|из|изо|без|для|при|над|под|не|ни|и|а|но))\s+/giu,'$1$2\u00a0').replace(/(\d)\s+(?=[а-я])/giu,'$1\u00a0').replace(/т\.\s+([пд])\./gu,'т.\u00a0$1.');
}
const txt=s=>escape(typography(s));
const catalogue=[
 ['lumen','product','064f6.png','люмин','lumen','приложение для чтения','reading app'],
 ['pulse','product','46f8f.png','пульс 4','pulse 4','музыкальное приложение','music app'],
 ['olf','web','3e60c.png','ольфакторный код','olfactory code','многостраничный сайт','multi-page website'],
 ['button','web','60664.png','кнопка','button','лонгрид','interactive longread'],
 ['proto','graphic','5cd43.png','прото','proto','айдентика','brand identity'],
 ['time','vibe','2d3af.png','время и дизайн','time and design','выставка в Координате','exhibition at Koordinata'],
 ['books','vibe','e3d8b.png','коллекция книг','book collection','выставка в Координате','exhibition at Koordinata'],
 ['poster','vibe','86790.png','30 дней','30 days','30 плакатов','30 posters']
];
function image(asset,alt='',eager=false,style='',sizes='(max-width: 650px) calc(100vw - 36px), (max-width: 1100px) 85vw, 64vw'){
 const a=assets[asset];if(!a)throw Error('Missing asset '+asset);
 return `<img src="${a.src}" ${a.variants?`srcset="${a.variants.map(v=>`${v.src} ${v.width}w`).join(',')}" sizes="${sizes}" width="${a.width}" height="${a.height}"`:''} alt="${escape(alt)}" loading="${eager?'eager':'lazy'}" decoding="async" ${eager?'fetchpriority="high"':''} ${style?`style="${style}"`:''}>`;
}
function media(m,alt='',eager=false){
 const style=Object.entries(m.crop||{}).map(([k,v])=>`${k}:${v}`).join(';');
 return `<figure class="media" data-design-node="${m.id||''}" style="aspect-ratio:${m.w}/${m.h}">${image(m.asset,alt,eager,style)}</figure>`;
}
function external(url,label,cls='action'){return `<a class="${cls}" href="${escape(url)}" ${url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}>${txt(label)}</a>`}
function themed(light,dark,cls,alt=''){return `<img class="${cls} light-image" src="assets/design/${light}" alt="${alt}"><img class="${cls} dark-image" src="assets/design/${dark}" alt="${alt}">`}
function footer(){return `<footer class="page-footer">${themed('d6274.svg','6b8bc.svg','footer-mark')}<p>${txt(tr('воу, вы долистали! спасибо!','wow, you made it to the end! thank you!'))}</p>${themed('adcdf.svg','c68fb.svg','wordmark','dm')}<a class="action" href="#top" data-scroll="top">${tr('наверх','back to top')}</a></footer>`}
function navLink(id,label){return `<a href="#${id}" data-scroll="${id}">${txt(label)}</a>`}
function navigation(){
 const p=projects[route];
 let links=navLink('info','info');
 if(p){if(route==='button')links+=navLink('project-link',tr('ссылка на проект','visit project'));links+=navLink('interface',tr(p.stages.length?'интерфейс':'проект',p.stages.length?'interface':'project'));if(p.more.length)links+=navLink('more',tr('больше о проекте','about the project'));if(p.stages.length)links+=navLink('stages',tr('этапы работы','process'));}
 else links+=navLink('projects',tr('проекты','projects'));
 nav.innerHTML=`${p?`<a class="back" href="#/" aria-label="${tr('на главную','back to home')}"><img src="assets/design/4108a.svg" alt=""></a>`:''}<nav aria-label="${tr('навигация по странице','page navigation')}" class="side-nav ${p?'case-nav':''}"><div class="nav-primary">${links}</div>${!p?`<div class="nav-categories">${['product','web','graphic','vibe'].map(c=>navLink(c,c)).join('')}</div>`:''}</nav><div class="preferences"><div class="language" role="group" aria-label="${tr('язык','language')}"><span class="language-slider" aria-hidden="true"></span><button data-lang="en" aria-pressed="${lang==='en'}" aria-label="English">en</button><button data-lang="ru" aria-pressed="${lang==='ru'}" aria-label="Русский">ру</button></div><button class="theme-toggle" aria-label="${tr('сменить цветовую тему','change colour theme')}" aria-pressed="${root.dataset.theme==='dark'}"><img class="sun" src="assets/design/71675.svg" alt=""><img class="moon" src="assets/design/50cc9.svg" alt=""></button></div>${p?.stages.length?`<button class="action hide-stages" data-close-stages hidden>${tr("скрыть этапы","hide process")}</button>`:""}`;
}
function card(c){return `<a class="project-card" href="#/${c[0]}">${media({asset:c[2],w:600,h:510},tr(c[3],c[4]))}<p class="project-caption"><span>${txt(tr(c[3],c[4]))}</span><span class="dash">–</span><span>${txt(tr(c[5],c[6]))}</span></p></a>`}
function home(){
 const rows=[
 [tr('хард-скиллы','hard skills'),tr('figma, ui/ux, прототипирование, дизайн-системы, адаптивный дизайн, нейросети, программы adobe','figma, ui/ux, prototyping, design systems, responsive design, ai tools, adobe applications')],
 [tr('софт-скиллы','soft skills'),tr('эмпатия, работа в команде, критическое мышление, самоорганизация, насмотренность','empathy, teamwork, critical thinking, self-organisation, visual awareness')],
 ['email',external('mailto:dmitriymusiyachenko@gmail.com','dmitriymusiyachenko@gmail.com','underlined'),true],
 ['telegram',external('https://t.me/paixetamourr','@paixetamourr','underlined'),true]
 ];
 return `<div class="shell" id="top"><section id="info" class="section-anchor"><div class="home-hero"><div class="intro-name"><p>${tr('привет, я','hello, i’m')}</p><h1>${tr('мусияченко дима','dima musiyachenko')}</h1></div><div class="portrait">${image('3ebac.png',tr('дима мусияченко','dima musiyachenko'),true,'','280px')}<span class="hero-mark"><spinning-mark aria-hidden="true"></spinning-mark></span></div><p class="intro-role">product designer</p></div><p class="lead">${txt(tr('я разрабатываю мобильные интерфейсы и продуктовые проекты, внимательно работая с логикой продукта, пользовательскими сценариями и деталями взаимодействия. также я работаю с вебом, чуть реже — с айдентикой и моушеном.','i design mobile interfaces and digital products, paying close attention to product logic, user flows and interaction details. i also work with the web, and occasionally with brand identity and motion.'))}</p><dl class="facts">${rows.map(([a,b,raw])=>`<div class="fact"><dt>${txt(a)}</dt><dd>${raw?b:txt(b)}</dd></div>`).join('')}</dl><div class="home-actions"><a class="action" href="resume.pdf" download>${tr('скачать резюме','download cv')}</a><div class="actions">${external('https://dprofile.ru/dmitriymusiyachenko',tr('смотреть dprofile','view dprofile'))}${external('https://www.behance.net/dmitriymusiyac',tr('смотреть behance','view behance'))}</div></div></section><section class="project-groups section-anchor" id="projects" aria-label="${tr('проекты','projects')}">${['product','web','graphic','vibe'].map(c=>`<section class="project-group" id="${c}" aria-label="${c}">${catalogue.filter(x=>x[1]===c).map(card).join('')}</section>`).join('')}</section>${footer()}</div>`;
}
function carousel(stage){
 const pics=stage.images.filter((m,i,a)=>a.findIndex(x=>x.asset===m.asset)===i);
 const rotations={'6c7be.png':90,'53de2.png':-90,'a7643.png':90};
 return `<div class="carousel" tabindex="0" role="region" aria-roledescription="carousel" aria-label="${tr('поиск стилистики — фотографии книг','visual exploration — book photographs')}"><div class="carousel-window">${pics.map((m,i)=>`<div class="carousel-slide ${i===0?'active':''} ${rotations[m.asset]?'rotated':''}" style="--rotation:${rotations[m.asset]||0}deg" data-slide="${i}" aria-hidden="${i!==0}">${image(m.asset,tr('книга — источник вдохновения','a book used as visual inspiration'))}</div>`).join('')}</div><button class="carousel-control prev" data-slide-dir="-1" aria-label="${tr('предыдущее фото','previous photo')}"><img src="assets/design/4108a.svg" alt=""></button><button class="carousel-control next" data-slide-dir="1" aria-label="${tr('следующее фото','next photo')}"><img src="assets/design/4108a.svg" alt=""></button><p class="carousel-count" aria-live="polite">1 / ${pics.length}</p></div>`;
}
function stages(p,t){return `<section class="stages section-anchor" id="stages"><button class="stages-heading" aria-expanded="${stageOpen}" aria-controls="stage-content" data-toggle-stages><img src="assets/design/f3c32.svg" alt=""><span>${tr('этапы работы','process')}</span><img src="assets/design/f3c32.svg" alt=""></button><div class="stages-body ${stageOpen?'':'closed'}" id="stage-content" ${stageOpen?'':'inert'}><div class="stages-inner">${p.stages.map((s,i)=>`<section class="stage"><h3>${txt(lang==='ru'?s.label:t.stages[i])}</h3><div class="stage-images">${s.carousel?carousel(s):s.images.map(m=>media(m,tr(s.label,t.stages[i]))).join('')}</div></section>`).join('')}</div></div></section>`}
function related(){return `<section class="related"><h2>${tr('другие проекты','other projects')}</h2><div class="related-grid">${catalogue.filter(c=>c[0]!==route).map(c=>`<a href="#/${c[0]}" aria-label="${txt(tr(c[3],c[4]))}">${media({asset:c[2],w:290,h:246.5},tr(c[3],c[4]))}</a>`).join('')}</div></section>`}
function pointingCharacter(){return `<svg class="pointing-character" aria-hidden="true" preserveAspectRatio="none" overflow="visible" style="display: block;" width="123.994" height="86" viewBox="0 0 123.994 86" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group 145401">
<ellipse cx="80.9" cy="42.4" rx="23" ry="13" fill="white"/><g id="Frame" clip-path="url(#clip0_0_171)">
<path id="Vector" d="M58.8707 10.4993C56.0161 1.08835 69.2447 -4.32033 73.8013 4.39436C76.8161 10.1611 85.0564 10.1995 88.1244 4.46106C92.7605 -4.2121 105.94 1.31733 102.999 10.7018C101.054 16.9114 106.853 22.7647 113.08 20.8762C122.491 18.0217 127.9 31.2506 119.185 35.807C113.418 38.822 113.381 47.0624 119.12 50.13C127.793 54.7661 122.263 67.9453 112.879 65.0051C106.669 63.0594 100.816 68.8586 102.704 75.0857C105.559 84.4969 92.3288 89.9061 87.7724 81.1907C84.7572 75.424 76.517 75.3863 73.4494 81.1252C68.8132 89.798 55.6352 84.2686 58.5755 74.8844C60.5215 68.6747 54.721 62.821 48.4936 64.7099C39.0827 67.5643 33.6737 54.3344 42.3887 49.7781C48.1555 46.763 48.1941 38.5228 42.4554 35.455C33.7822 30.8189 39.3116 17.6401 48.6962 20.5811C54.9059 22.5269 60.7594 16.7265 58.8707 10.4993ZM91.6036 30.3529C88.7099 30.3531 86.0562 31.3767 83.9832 33.0812C82.3964 34.3858 79.4515 34.3858 77.8647 33.0812C75.7917 31.3767 73.1381 30.3529 70.2443 30.3529C63.6088 30.3529 58.2296 35.7321 58.2296 42.3677C58.2296 49.0032 63.6088 54.3824 70.2443 54.3824C73.138 54.3824 75.7918 53.3587 77.8647 51.6541C79.4516 50.3493 82.3963 50.3495 83.9832 51.6541C86.0561 53.3587 88.7099 54.3824 91.6036 54.3824C98.2391 54.3824 103.618 49.0032 103.618 42.3677C103.618 35.7321 98.2391 30.3529 91.6036 30.3529Z" fill="#0C26E6"/>
</g>
<circle id="Ellipse 821" cx="65.494" cy="38.5" r="7.5" fill="#0C113B"/>
<circle id="Ellipse 822" cx="88.4941" cy="38.5" r="7.5" fill="#0C113B"/>
<g class="pointing-hand" id="one-one" clip-path="url(#clip1_0_171)">
<path id="Vector_2" d="M35.7781 47.4103L36.0521 46.821C37.6468 43.3907 37.4056 39.3877 35.4103 36.1739L33.8762 33.7028C32.7874 31.9491 30.5617 31.2827 28.6883 32.1495L26.7139 33.063C26.4887 33.1672 26.2291 33.1669 26.0041 33.0623L15.3314 28.1003C14.1497 27.5509 12.7464 28.0635 12.197 29.2452C11.6476 30.4269 12.1601 31.8303 13.3419 32.3797L19.2671 35.1344C18.0854 34.585 16.682 35.0976 16.1326 36.2793C15.5832 37.461 16.0958 38.8643 17.2775 39.4137L18.265 39.8729C17.0833 39.3235 15.68 39.8361 15.1306 41.0177C14.5812 42.1994 15.0938 43.6028 16.2755 44.1522L18.9089 45.3765C17.7272 44.8271 16.3239 45.3397 15.7745 46.5214C15.2251 47.7031 15.7377 49.1064 16.9193 49.6558L23.6469 52.7836C24.7325 53.2883 25.9453 53.4533 27.1262 53.2568L28.361 53.0513C31.6129 52.5104 34.3883 50.3995 35.7781 47.4103Z" fill="white" stroke="#0C26E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</g>
<defs>
<clipPath id="clip0_0_171">
<rect width="86" height="86" fill="white" transform="translate(37.9942)"/>
</clipPath>
<clipPath id="clip1_0_171">
<rect width="34.8495" height="34.8495" fill="white" transform="matrix(-0.421587 0.906788 0.906788 0.421587 14.6921 17)"/>
</clipPath>
</defs>
</svg>`;}
function casePage(){
 const p=projects[route],t=lang==='en'?p.en:p;
 let title=txt(t.title);
 if(route==='time'||route==='books')title=title.replace(tr('Координате','Koordinata'),external('https://t.me/koordinata_space',tr('Координате','Koordinata'),'underlined'));
 if(route==='books')title=title.replace(tr('Александра Гачкова','Alexander Gachkov'),external('https://t.me/tutitamizdat',tr('Александра Гачкова','Alexander Gachkov'),'underlined'));
 const gallery=p.gallery.map((m,i)=>{
  const label=tr(`${t.title}: изображение ${i+1}`,`${t.title}: image ${i+1}`);
  const visual=media(m,label);
  if(route==='poster')return `<div class="poster-item">${visual}</div>`;
  if(route==='time')return `<button class="image-button" data-enlarge="${m.asset}" data-caption="${escape(label)}" aria-label="${escape(tr('увеличить: ','enlarge: ')+label)}" ${route==='time'?`style="width:${m.w/660*100}%"`:''}>${visual}</button>`;
  return visual;
 }).join('');
 const more=p.more.length?`<section class="more-section section-anchor" id="more"><div class="ornament-title"><img src="assets/design/2bc21.svg" alt=""><h2>${tr('больше о проекте','about the project')}</h2><img src="assets/design/2bc21.svg" alt=""></div><div class="more-columns">${t.more.map(s=>`<p>${txt(s).replace(/^(ui|ux) /,'<strong>$1</strong>')}</p>`).join('')}</div></section>`:'';
 const working=p.links.length?`<div class="case-links actions">${p.links.map(l=>external(l.url,lang==='ru'?l.label:'view project on '+(l.url.includes('dprofile')?'dprofile':'behance'))).join('')}</div><section class="working-file"><h2>${tr('хотите посмотреть рабочий файл?','want to see the working file?')}</h2><p>${txt(tr('свяжитесь со мной, и я поделюсь ссылкой на figma-файл с полным проектом. в файле вы найдёте значительно больше процесса: все итерации, ui-киты, дизайн-системы, компоненты, документацию и промежуточные решения.','contact me and i’ll share the full figma project. the file includes much more of the process: iterations, ui kits, design systems, components, documentation and intermediate solutions.'))}</p><div class="actions">${external('mailto:dmitriymusiyachenko@gmail.com',tr('написать на почту','send an email'))}${external('https://t.me/paixetamourr','telegram')}</div></section>`:'';
 return `<article class="shell case" id="top"><section id="info" class="section-anchor"><div class="case-cover" style="width:${p.hero.w/1220*100}%">${media(p.hero,t.title,true)}</div><h1 class="case-title ${['olf','time','books'].includes(route)?'long':''}">${title}</h1><dl class="facts">${t.info.map(([a,b])=>`<div class="fact"><dt>${txt(a)}</dt><dd>${txt(b)}</dd></div>`).join('')}</dl></section>${route==='button'?`<section id="project-link" class="project-external section-anchor">${external('https://project17809656.tilda.ws/',tr('ссылка на проект','visit the project'))}${pointingCharacter()}
</section>`:''}<section id="interface" class="case-gallery ${route==='time'?'time-stack':route} section-anchor" aria-label="${tr('проект','project')}">${gallery}</section>${more}${p.stages.length?stages(p,t):''}${working}${['time','books'].includes(route)?`<div class="exhibition-link"><p>${txt(tr('узнайте больше о выставке и Координате','learn more about the exhibition and Koordinata'))}</p><div class="exhibition-action">${external('https://t.me/koordinata_space',tr('Координата','Koordinata'))}${pointingCharacter()}</div></div>`:''}${related()}${footer()}</article>`;
}
function render(preserve=false){
 const fraction=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
 root.lang=lang;navigation();app.innerHTML=route?casePage():home();
 app.classList.remove('entering');void app.offsetWidth;app.classList.add('entering');
 document.title=(route?(lang==='en'?projects[route].en.title:projects[route].title):tr('дима мусияченко','dima musiyachenko'))+' — product designer';
 $('.skip-link').textContent=tr('к содержимому','skip to content');
 $('#lightbox').setAttribute('aria-label',tr('просмотр изображения','image viewer'));
 $('.lightbox-close').setAttribute('aria-label',tr('закрыть','close'));
 if(preserve)scrollTo({top:fraction*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});
 nav.classList.toggle('no-entrance',preserve);app.classList.toggle('no-entrance',preserve);
 updateScroll();initCarousel();
 stageObserver?.disconnect();
 if($('#stage-content')){stageObserver=new ResizeObserver(updateScroll);stageObserver.observe($('#stage-content'));}
}
function readRoute(){
 const raw=decodeURIComponent(location.hash.replace(/^#\/?/,''));
 const aliases={'pulse4':'pulse','olfactory-code':'olf','posters':'poster'};
 return projects[aliases[raw]||raw]?aliases[raw]||raw:'';
}
function onRoute(){
 const next=readRoute();if(route===next)return;
 if(!route)homeScroll=scrollY;
 route=next;stageOpen=false;carouselIndex=0;render();
 scrollTo({top:route?0:homeScroll,behavior:'instant'});app.focus({preventScroll:true});updateScroll();
}
function scrollSection(id){
 const target=document.getElementById(id);if(!target)return;
 let focus=target;
 if(id==='info')focus=$('.home-hero .portrait')||$('.case-cover')||target;
 if(['projects','product','web','graphic','vibe'].includes(id))focus=$('.media',target)||target;
 if(id==='interface')focus=$('.media',target)||target;
 if(id==='stages')focus=$('.stages-heading');
 const rect=focus.getBoundingClientRect();
 const position=id==='top'?0:scrollY+rect.top+Math.min(rect.height,innerHeight*.7)/2-innerHeight/2;
 scrollTo({top:Math.max(0,position),behavior:reduced.matches?'instant':'smooth'});
}
function updateScroll(){
 const threshold=innerWidth<=1100?150:innerHeight*.5;
 const activeIn=ids=>{let active=ids[0];for(const id of ids){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=threshold)active=id;}return active};
 const ids=route?['info',...(route==='button'?['project-link']:[]),'interface',...(projects[route].more.length?['more']:[]),...(projects[route].stages.length?['stages']:[])]:['info','projects'];
 const active=activeIn(ids);$('.side-nav').classList.toggle('in-projects',!route&&active==='projects');
 const category=!route?activeIn(['product','web','graphic','vibe']):'';
 const close=$('.hide-stages');const body=$('#stage-content');
 if(close&&body){const r=body.getBoundingClientRect();close.hidden=!(stageOpen&&r.top<innerHeight&&r.bottom>100);}
 
 $$('[data-scroll]',nav).forEach(a=>{const on=a.dataset.scroll===active||(!route&&active==='projects'&&a.dataset.scroll===category);a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
function toggleStages(open){
 stageOpen=open;const body=$('#stage-content');if(!body)return;
 body.classList.toggle('closed',!open);body.inert=!open;
 $('[data-toggle-stages]').setAttribute('aria-expanded',String(open));updateScroll();
}
function changeSlide(dir){
 const slides=$$('.carousel-slide');if(!slides.length)return;
 carouselIndex=(carouselIndex+dir+slides.length)%slides.length;
 slides.forEach((el,i)=>{el.classList.toggle('active',i===carouselIndex);el.classList.toggle('previous',i===(carouselIndex-1+slides.length)%slides.length);el.classList.toggle('next',i===(carouselIndex+1)%slides.length);el.setAttribute('aria-hidden',String(i!==carouselIndex));});
 $('.carousel-count').textContent=`${carouselIndex+1} / ${slides.length}`;
}
function initCarousel(){
 const el=$('.carousel');if(!el)return;changeSlide(0);let start;
 el.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY}});
 el.addEventListener('pointerup',e=>{if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientY-start.y)<60)changeSlide(e.clientX<start.x?1:-1);start=null});
 el.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();changeSlide(e.key==='ArrowRight'?1:-1)}});
}
document.addEventListener('click',e=>{

 const scroll=e.target.closest('[data-scroll]');if(scroll){e.preventDefault();scrollSection(scroll.dataset.scroll);return;}
 const language=e.target.closest('[data-lang]');if(language){if(lang===language.dataset.lang)return;const previous=lang;lang=language.dataset.lang;save('portfolio-lang',lang);render(true);if(!reduced.matches){$('.language-slider').animate([{transform:previous==='en'?'translateX(-100%)':'translateX(0)'},{transform:lang==='en'?'translateX(-100%)':'translateX(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});$('.language').animate([{scale:1},{scale:.95,offset:.22},{scale:1}],{duration:550,easing:'ease-out'});}$(`[data-lang="${lang}"]`).focus({preventScroll:true});return;}
 if(e.target.closest('.theme-toggle')){const dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';save('portfolio-theme',root.dataset.theme);if(!reduced.matches)$('.theme-toggle').animate([{transform:'scale(1)'},{transform:'scale(.86)',offset:.2},{transform:'scale(1.1)',offset:.65},{transform:'scale(1)'}],{duration:600,easing:'cubic-bezier(.22,1,.36,1)'});$('.theme-toggle').setAttribute('aria-pressed',String(dark));$('meta[name="theme-color"]').content=dark?'#121315':'#ebebeb';return;}
 if(e.target.closest('[data-toggle-stages]')){toggleStages(!stageOpen);return;}
 if(e.target.closest('[data-close-stages]')){toggleStages(false);$('[data-toggle-stages]').focus({preventScroll:true});scrollSection('stages');return;}
 const slide=e.target.closest('[data-slide-dir]');if(slide){changeSlide(Number(slide.dataset.slideDir));return;}
 const enlarge=e.target.closest('[data-enlarge]');if(enlarge){const dialog=$('#lightbox');$('img',dialog).src=assets[enlarge.dataset.enlarge].src;$('img',dialog).alt=enlarge.dataset.caption;$('p',dialog).textContent=enlarge.dataset.caption;dialog.showModal();document.body.classList.add('modal-open');}
});
const dialog=$('#lightbox');$('.lightbox-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
addEventListener('hashchange',onRoute);addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;updateScroll()})}},{passive:true});addEventListener('resize',updateScroll);
// Preserve the original portfolio cursor and its hover behaviour.
const cursor=$('#cursor');let cursorX=0,cursorY=0,pending=false;
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;cursorX=e.clientX;cursorY=e.clientY;if(!pending){pending=true;requestAnimationFrame(()=>{cursor.style.left=`${cursorX}px`;cursor.style.top=`${cursorY}px`;cursor.classList.add('visible');pending=false;})}},{passive:true});
document.addEventListener('pointerover',e=>cursor.classList.toggle('hover',!!e.target.closest('a,button')));document.addEventListener('pointerleave',()=>cursor.classList.remove('visible'));
route=readRoute();render();
const readyImages=$$('img[loading=eager]').map(img=>img.decode().catch(()=>{}));
Promise.race([Promise.all([document.fonts.ready,...readyImages]),new Promise(resolve=>setTimeout(resolve,4000))]).then(()=>$('#preloader').classList.add('done'));
