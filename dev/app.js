// DROM · site — scripts do navegador
{
const RAW='https://raw.githubusercontent.com/mayconlsilva93/sistema/main/site/';
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const SEM=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const NOMES=window.DROM_NOMES||{};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const hd=$('header');$('.burger')?.addEventListener('click',()=>hd.classList.toggle('open'));
$$('header nav a').forEach(a=>a.addEventListener('click',()=>hd.classList.remove('open')));

// aparecer ao rolar + contadores
const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.1});
$$('.rv').forEach(x=>io.observe(x));
function contar(el){const n=+el.dataset.count;const io2=new IntersectionObserver((e,o)=>{if(!e[0].isIntersecting)return;o.disconnect();let t0;
 const f=t=>{t0??=t;const k=Math.min(1,(t-t0)/1500);el.textContent=Math.round(n*(1-Math.pow(1-k,3))).toLocaleString('pt-BR');k<1&&requestAnimationFrame(f)};requestAnimationFrame(f)});io2.observe(el)}
const prepCount=()=>$$('[data-count]').forEach(contar);

// dados ao vivo (Painel Geral via GitHub), com cópia local de reserva
async function dados(nome){for(const u of [RAW+nome+'?t='+Date.now()/6e5|0,'dados/'+nome]){try{const r=await fetch(u);if(r.ok)return await r.json()}catch(e){}}return null}

// ---------- agenda
const g=s=>`https://www.google.com/search?q=${encodeURIComponent('ingresso '+s.ev+' '+s.ci.split('/')[0])}`;
function linhas(dias,{artista,filtro,limite,de,ate}={}){const fa=artista||filtro;let n=0,h='';
 for(const d of dias){if(de&&d.d<de)continue;if(ate&&d.d>ate)continue;
  const sh=fa?d.shows.filter(s=>s.a.includes(fa)):d.shows;if(!sh.length)continue;
  const dt=new Date(d.d+'T12:00:00');
  h+=`<div class="ag-day"><h4>${String(dt.getDate()).padStart(2,'0')}.${MES[dt.getMonth()].slice(0,3)}<small>${SEM[dt.getDay()].toUpperCase()}</small></h4><div>${sh.map(s=>
   `<div class="show">${artista?'':`<div class="a">${s.a.map(x=>esc(NOMES[x]||x)).join(' / ')}</div>`}<div class="e">${esc(s.ev)}<small>${esc(s.ci)}</small></div>${s.priv?'':`<a class="tk" href="${g(s)}" target="_blank" rel="noopener">Ingressos ↗</a>`}</div>`).join('')}</div></div>`;
  if(limite&&++n>=limite)break}
 return h||'<p style="color:#999;padding:12px 0">Sem datas públicas neste período. Fale com a gente para checar disponibilidade.</p>'}
const km=(a,b)=>{const R=6371,r=Math.PI/180,x=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 2*R*Math.asin(Math.sqrt(x))};

async function agenda(){const alvos=$$('[data-agenda]');if(!alvos.length)return;const A=await dados('agenda.json');if(!A)return;
 alvos.forEach(el=>{const o=el.dataset;el.innerHTML=linhas(A.dias,{artista:o.artista,limite:+o.limite||0})});
 const box=$('#agbox');if(!box)return;
 // filtros por artista
 let filtro='',sel=null,perto=null;
 const render=()=>{let dias=A.dias;if(perto)dias=dias.map(d=>({...d,shows:d.shows.filter(s=>s.g&&km(perto,s.g)<=150)}));
  box.innerHTML=linhas(dias,{filtro,de:sel,ate:sel});
  if(!box.querySelector('.ag-day'))box.innerHTML='<p style="color:#999;padding:12px 0">Nenhum show público com esse filtro.</p>'};
 $$('#agfilt .chip').forEach(b=>b.onclick=()=>{$$('#agfilt .chip').forEach(x=>x.classList.toggle('on',x===b));filtro=b.dataset.f;render()});
 // calendário
 const dias=new Set(A.dias.map(d=>d.d));const hoje=new Date();let mes=new Date(hoje.getFullYear(),hoje.getMonth(),1);
 const cal=$('#cal');const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const desenha=()=>{const y=mes.getFullYear(),m=mes.getMonth(),n=new Date(y,m+1,0).getDate(),ini=new Date(y,m,1).getDay();
  let h=`<div class="hd"><button aria-label="mês anterior" data-m="-1">‹</button><span>${MES[m]} ${y}</span><button aria-label="próximo mês" data-m="1">›</button></div><div class="g">${['D','S','T','Q','Q','S','S'].map(x=>`<b>${x}</b>`).join('')}${'<span></span>'.repeat(ini)}`;
  for(let d=1;d<=n;d++){const k=iso(new Date(y,m,d));h+=`<button data-d="${k}" class="${dias.has(k)?'on':''} ${k===sel?'sel':''} ${k===iso(hoje)?'hj':''}" ${dias.has(k)?'':'disabled'}>${d}</button>`}
  cal.innerHTML=h+'</div>';
  $$('[data-m]',cal).forEach(b=>b.onclick=()=>{mes=new Date(y,m+ +b.dataset.m,1);desenha()});
  $$('[data-d]',cal).forEach(b=>b.onclick=()=>{sel=sel===b.dataset.d?null:b.dataset.d;desenha();render()})};
 desenha();render();
 // perto de você
 const np=$('#perto'),msg=$('#pertomsg');
 np.onclick=()=>{if(perto){perto=null;np.firstElementChild.textContent='Shows perto de você';msg.textContent='';render();return}
  if(!navigator.geolocation){msg.textContent='Seu navegador não informa a localização.';return}
  msg.textContent='Buscando sua localização…';
  navigator.geolocation.getCurrentPosition(p=>{perto=[p.coords.latitude,p.coords.longitude];np.firstElementChild.textContent='Ver todos os shows';msg.textContent='Mostrando shows até 150 km de você.';render()},
   ()=>{msg.textContent='Não foi possível obter sua localização.'},{timeout:10000})};
}

// ---------- números, pizza e mapa
async function numeros(){const S=await dados('stats.json');if(!S)return;
 $$('[data-k]').forEach(el=>{const k=el.dataset.k;let v=k==='showsR'?Math.floor(S.shows/100)*100:k.startsWith('cid:')?S.artistas[k.slice(4)]:S[k];if(v!=null){el.dataset.count=v}});
 prepCount();
 const pz=$('#pizza');if(pz){const P=S.pizza,C=2*Math.PI*25;let off=0;
  const seg=[['pub','var(--y)'],['uni','var(--g)'],['soc','var(--p)']];
  pz.querySelector('svg').innerHTML=seg.map(([k,c])=>{const l=P[k]/100*C;const s=`<circle class="s" r="25" cx="50" cy="50" stroke="${c}" stroke-width="50" stroke-dasharray="0 ${C}" data-l="${l}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"></circle>`;off+=l;return s}).join('')+'<circle r="49" cx="50" cy="50" fill="none" stroke="#000" stroke-width="2"/>';
  seg.forEach(([k])=>{const e=$('[data-p="'+k+'"]',pz);if(e)e.textContent=Math.round(P[k])+'%'});
  new IntersectionObserver((e,o)=>{if(!e[0].isIntersecting)return;o.disconnect();$$('circle.s',pz).forEach((c,i)=>setTimeout(()=>c.setAttribute('stroke-dasharray',c.dataset.l+' '+C),i*250))},{threshold:.3}).observe(pz)}
 const mp=$('#mapa');if(mp){const M=window.DROM_MAPA;const svg=$('svg',mp),tip=$('.mtip',mp);
  const xy=g=>[(g[1]-M.lon0)*M.k*M.s,(M.lat1-g[0])*M.s];
  svg.insertAdjacentHTML('beforeend',S.pontos.map((p,i)=>{const [x,y]=xy(p.g);return`<g class="pin" data-n="${esc(p.n)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" style="animation-delay:${(i*25)}ms"/></g>`}).join(''));
  const show=(e,el)=>{const r=mp.querySelector('.sv').getBoundingClientRect(),c=el.querySelector('circle').getBoundingClientRect();tip.textContent=el.dataset.n;tip.style.left=(c.left-r.left+c.width/2)+'px';tip.style.top=(c.top-r.top)+'px';tip.style.display='block'};
  $$('.pin',svg).forEach(p=>{p.onmouseenter=e=>show(e,p);p.onclick=e=>show(e,p);p.onmouseleave=()=>tip.style.display='none'})}
}

// ---------- players (YouTube só carrega ao clicar)
$$('.tv').forEach(tv=>{const scr=$('.scr',tv),now=$('.now',tv);
 const play=(id,t,auto)=>{scr.innerHTML=auto?`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${esc(t)}"></iframe>`:`<div class="ph" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)" data-id="${id}"></div>`;now.textContent=t;
  $$('.it',tv).forEach(x=>x.classList.toggle('on',x.dataset.id===id));const ph=$('.ph',scr);if(ph)ph.onclick=()=>play(id,t,1)};
 const bind=()=>$$('.it',tv).forEach(b=>b.onclick=()=>play(b.dataset.id,b.dataset.t,1));bind();
 const f=$('.it',tv);if(f)play(f.dataset.id,f.dataset.t,0);
 $$('.tvtabs .chip',tv.parentElement).forEach(c=>c.onclick=()=>{$$('.tvtabs .chip',tv.parentElement).forEach(x=>x.classList.toggle('on',x===c));
  $$('.it',tv).forEach(i=>i.style.display=!c.dataset.f||i.dataset.g===c.dataset.f?'':'none');const v=$$('.it',tv).find(i=>i.style.display!=='none');if(v)play(v.dataset.id,v.dataset.t,0)});
});
// disco
$$('.disco').forEach(d=>{const cd=$('.cd',d),fr=$('.fr',d);const go=()=>{cd.classList.add('on');if(!fr.innerHTML)fr.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${fr.dataset.id}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen title="lançamento"></iframe>`;fr.classList.add('on')};cd.onclick=go;$('.play',d).onclick=go});
// aftermovies do Drive: carregam ao entrar na tela
const lz=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.src=x.target.dataset.src;lz.unobserve(x.target)}}),{rootMargin:'200px'});$$('iframe[data-src]').forEach(f=>lz.observe(f));

agenda();numeros();
}
