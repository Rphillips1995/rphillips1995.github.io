(() => {
  'use strict';
  const profile = window.researchProfile || {};
  const $ = selector => document.querySelector(selector);
  document.querySelectorAll('[data-profile]').forEach(el => {
    const value = profile[el.dataset.profile];
    if (value) el.textContent = value;
  });
  if (profile.name && profile.name !== 'Research portfolio') document.title = `${profile.name} · Neuroscience`;
  $('#year').textContent = new Date().getFullYear();
  function safeURL(value, local = false) {
    if (!value) return null;
    try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) && (local || /^https?:\/\//.test(value)) ? url.href : null; } catch { return null; }
  }
  function link(label, href, className = '') {
    const el = document.createElement('a'); el.textContent = label; el.href = href; el.className = className;
    if (new URL(href, location.href).origin !== location.origin) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    return el;
  }
  if (profile.affiliation) { $('#affiliation').textContent = profile.affiliation; $('#affiliation').hidden = false; }
  if (profile.email) {
    const href = `mailto:${profile.email}`;
    $('#contact-link').href = href; $('#contact-link').setAttribute('aria-label', `Email ${profile.name}`);
    $('#email-link').href = href; $('#email-link').textContent = `${profile.email} ↗`; $('#email-link').hidden = false;
    $('#contact-description').textContent = 'For research conversations and scientific connections.';
  }
  $('#profile-links').replaceChildren();
  for (const [key, label] of [['scholar','Google Scholar'],['github','GitHub'],['bluesky','Bluesky'],['orcid','ORCID'],['cv','Curriculum vitae']]) {
    const url = safeURL(profile[key], key === 'cv');
    if (url) $('#profile-links').append(link(key === 'cv' ? `${label} ↓` : `${label} ↗`, key === 'cv' ? '#cv' : url));
  }
  const scholarURL = safeURL(profile.scholar);
  if (scholarURL) $('#scholar-link').append(link('All publications on Google Scholar ↗', scholarURL, 'text-link'));
  if (Array.isArray(profile.publications) && profile.publications.length) {
    const list = $('#publication-list');
    const papers = [...profile.publications].sort((a,b) => Number(b.year) - Number(a.year));
    let expanded = false;
    $('.publication-controls').hidden = false;
    function renderPublications() {
    list.replaceChildren();
    const query = $('#publication-search').value.trim().toLowerCase();
    const type = $('#publication-type').value;
    const matching = papers.filter(p => (type === 'All' || p.type === type) && `${p.title} ${p.authors} ${p.journal} ${p.year}`.toLowerCase().includes(query));
    const shown = expanded || query || type !== 'All' ? matching : matching.slice(0,6);
    $('#publication-status').textContent = `Showing ${shown.length} of ${matching.length} entries`;
    $('#more-publications').hidden = !!query || type !== 'All' || matching.length <= 6;
    $('#more-publications').textContent = expanded ? 'Show recent publications ↑' : `View all ${papers.length} entries ↓`;
    if (!matching.length) { const empty = document.createElement('p'); empty.className = 'publication-empty'; empty.textContent = 'No publications match your search. Try another keyword or select All work.'; list.append(empty); }
    shown.forEach(paper => {
      const article = document.createElement('article'); article.className = 'publication';
      const year = document.createElement('span'); year.className = 'publication-year'; year.textContent = paper.year;
      const body = document.createElement('div'); const title = document.createElement('h3');
      const url = safeURL(paper.url); if (url) title.append(link(paper.title, url)); else title.textContent = paper.title;
      const authors = document.createElement('p'); authors.textContent = paper.authors;
      const journal = document.createElement('p'); journal.className = 'journal'; journal.textContent = `${paper.journal} · ${paper.type || 'Publication'}`;
      body.append(title, authors, journal); article.append(year, body);
      if (url) { const arrow = link('↗', url, 'publication-arrow'); arrow.setAttribute('aria-label', `Read ${paper.title}`); article.append(arrow); }
      list.append(article);
    });
    }
    $('#publication-search').addEventListener('input',renderPublications);
    $('#publication-type').addEventListener('change',renderPublications);
    $('#more-publications').addEventListener('click',()=>{expanded=!expanded;renderPublications();if(!expanded)$('#publications').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
    renderPublications();
  }
  const menu = $('.menu-toggle'), nav = $('#navigation');
  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); }
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });

  const modes = {
    identity: { number:'01', label:'Cellular organization', title:'Define the cellular building blocks.', description:'Single-nucleus and spatial transcriptomics connect molecularly defined cell populations with their locations within brain regions.', color:[98,167,255] },
    conservation: { number:'02', label:'Molecular conservation', title:'Compare molecular identities.', description:'Cross-species comparisons ask which cell identities, marker genes, and molecular programs are shared, and which differ. These provide a foundation for investigating circuit conservation.', color:[111,214,64] },
    regulation: { number:'03', label:'Gene regulation', title:'Understand cellular responses.', description:'Studies of activity-dependent transcription, chromatin remodeling, and drug responses ask how gene regulation changes within distinct cell populations.', color:[255,98,140] }
  };
  let mode = 'identity';
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode; const current = modes[mode];
    document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    $('#network-label').textContent = current.label; $('#perspective-number').textContent = current.number;
    $('#perspective-title').textContent = current.title; $('#perspective-description').textContent = current.description;
    $('.network-key i').style.backgroundColor = `rgb(${current.color.join(',')})`; render();
  }));

  const canvas = $('#network'), ctx = canvas.getContext('2d');
  if (!ctx) { $('#motion-toggle').hidden = true; return; }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches, visible = true, frame = 0, time = 0, last = 0, width = 600, height = 520;
  let pointer = {x:0,y:0};
  const points = [], edges = [];
  // Deterministic bilateral abstract network, not an anatomical model.
  let seed = 42; function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (let i=0;i<230;i++) {
    const phi = Math.acos(1 - 2 * (i+.5)/230), theta = i * 2.39996323;
    let x = Math.sin(phi)*Math.cos(theta), y = Math.cos(phi), z = Math.sin(phi)*Math.sin(theta);
    x = Math.sign(x)*(Math.abs(x)*.85+.12); const r = .83 + random()*.18;
    points.push({x:x*r,y:y*r,z:z*r,group:x>0?1:0,hot:i%13===0,size:random()});
  }
  for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) {
    const a=points[i],b=points[j], d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
    if(d<.37) edges.push({a:i,b:j,cross:a.group!==b.group});
  }
  const rgba=(rgb,a)=>`rgba(${rgb.join(',')},${a})`;
  function render() {
    const dpr=Math.min(devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const cx=width*.5,cy=height*.5, scale=Math.min(width,height)*.335;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.8);glow.addColorStop(0,'rgba(59,134,247,.14)');glow.addColorStop(1,'rgba(9,33,62,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='rgba(142,172,203,.16)';ctx.lineWidth=.7;
    for(let r=1.2;r<=1.65;r+=.22){ctx.beginPath();ctx.ellipse(cx,cy,scale*r,scale*r*.8,-.23,0,Math.PI*2);ctx.stroke();}
    ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(cx,cy-scale*1.55);ctx.lineTo(cx,cy+scale*1.55);ctx.moveTo(cx-scale*1.75,cy);ctx.lineTo(cx+scale*1.75,cy);ctx.stroke();ctx.setLineDash([]);
    const angle=.35+time*.055+pointer.x*.15, tilt=-.12+pointer.y*.09;
    const projected=points.map(p=>{const x=p.x*Math.cos(angle)+p.z*Math.sin(angle),z=-p.x*Math.sin(angle)+p.z*Math.cos(angle),y=p.y*Math.cos(tilt)-z*Math.sin(tilt);const depth=1+z*.13;return {x:cx+x*scale*depth,y:cy+y*scale*depth,z,depth};});
    const color=modes[mode].color;
    edges.forEach((edge,i)=>{
      const a=projected[edge.a],b=projected[edge.b];const hot=mode==='regulation'?edge.cross||i%7===0:mode==='conservation'?points[edge.a].group===1:i%9===0;
      const alpha=(.10+(a.z+b.z+2)*.055)*(hot?1.8:1);ctx.strokeStyle=rgba(hot?color:[111,149,192],alpha);ctx.lineWidth=hot?.8:.5;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if(hot && i%5===0){const t=(time*.23+i*.133)%1;ctx.fillStyle=rgba(color,.75);ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,1.3,0,Math.PI*2);ctx.fill();}
    });
    projected.forEach((p,i)=>{const hot=points[i].hot || (mode==='conservation' && points[i].group===1 && i%5===0);const alpha=.38+(p.z+1)*.26;
      if(hot){ctx.fillStyle=rgba(color,.08);ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle=rgba(hot?color:[165,196,232],alpha);ctx.beginPath();ctx.arc(p.x,p.y,hot?2.6:1+points[i].size*.7,0,Math.PI*2);ctx.fill();
    });
    ctx.font='8px monospace';ctx.fillStyle='rgba(185,204,226,.78)';ctx.fillText('CELL IDENTITY',cx-scale*1.55,cy-scale*1.05);ctx.fillText('MOLECULAR PATTERNS',cx+scale*.45,cy+scale*1.22);
    ctx.strokeStyle=rgba(color,.45);ctx.lineWidth=.8;for(const [x,y] of [[cx-scale*1.5,cy+scale*.72],[cx+scale*1.45,cy-scale*.55]]){ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
  }
  function loop(timestamp){frame=0;if(paused||!visible||document.hidden){last=0;return;}if(last)time+=Math.min((timestamp-last)/1000,.05);last=timestamp;render();frame=requestAnimationFrame(loop);}
  function syncAnimation(){cancelAnimationFrame(frame);frame=0;last=0;render();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(loop);}
  function resize(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);render();}
  function syncButton(){$('#motion-toggle').innerHTML=paused?'Resume motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';$('#motion-toggle').setAttribute('aria-pressed',String(paused));}
  $('#motion-toggle').addEventListener('click',()=>{paused=!paused;syncButton();syncAnimation();});
  reducedMotion.addEventListener('change',event=>{paused=event.matches;pointer={x:0,y:0};syncButton();syncAnimation();});
  canvas.addEventListener('pointermove',event=>{if(paused||reducedMotion.matches)return;const rect=canvas.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/width-.5,y:(event.clientY-rect.top)/height-.5};});
  canvas.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncAnimation();},{threshold:.05}).observe(canvas);
  document.addEventListener('visibilitychange',syncAnimation);
  resize();syncButton();syncAnimation();
})();
