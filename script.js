/* ---------- clock ---------- */
const clk=document.getElementById('clock');
setInterval(()=>{clk.textContent=new Date().toLocaleTimeString('zh-TW',{hour12:false})},1000);

/* ---------- holographic data core ---------- */
(function(){
  const cv=document.getElementById('orb'),ctx=cv.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU=Math.PI*2;
  let W,H,dpr;
  function size(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  size();addEventListener('resize',size);

  const gold=(a,g=180)=>`rgba(255,${g},70,${a})`;
  const amber=a=>`rgba(255,214,140,${a})`;
  const cyan=a=>`rgba(94,200,255,${a})`;

  // 3D helpers
  function rot(p,ax,ay){
    let {x,y,z}=p;
    let c=Math.cos(ay),s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];
    c=Math.cos(ax);s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];
    return {x,y,z};
  }
  // fibonacci point sphere
  const N=520,pts=[];
  for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),a=i*2.39996;pts.push({x:Math.cos(a)*r,y,z:Math.sin(a)*r,tw:Math.random()*TAU})}
  // lat/long wireframe
  const wire=[];
  for(let la=-60;la<=60;la+=30){const seg=[];const y=Math.sin(la*Math.PI/180),r=Math.cos(la*Math.PI/180);for(let k=0;k<=64;k++){const a=k/64*TAU;seg.push({x:Math.cos(a)*r,y,z:Math.sin(a)*r})}wire.push(seg)}
  for(let lo=0;lo<180;lo+=30){const seg=[];const a=lo*Math.PI/180;for(let k=0;k<=64;k++){const t=k/64*TAU;seg.push({x:Math.cos(t)*Math.cos(a),y:Math.sin(t),z:Math.cos(t)*Math.sin(a)})}wire.push(seg)}
  // orbits: tilted 3D ellipses with satellites
  const orbits=[{r:1.32,ix:.9,iy:.3,sp:.5},{r:1.5,ix:-.6,iy:1.1,sp:-.35},{r:1.18,ix:1.35,iy:-.7,sp:.7}];
  // outer arc segments
  const arcs=Array.from({length:9},(_,i)=>({r:.405+i*.012+(i>5?.03:0),a0:Math.random()*TAU,len:.3+Math.random()*1.4,sp:(i%2?1:-1)*(.1+Math.random()*.35),w:i%3===0?3:1.2}));
  const hex=()=>Math.floor(Math.random()*0xffff).toString(16).toUpperCase().padStart(4,'0');
  const reads=Array.from({length:6},(_,i)=>({a:i/6*TAU+.3,v:hex(),t:0}));

  function frame(ms){
    const t=ms/1000,cx=W/2,cy=H/2,R=Math.min(W,H),S=R*.25; // S = sphere radius
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';

    // ambient glow
    let g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.5);
    g.addColorStop(0,gold(.28,170));g.addColorStop(.35,gold(.07,140));g.addColorStop(1,gold(0));
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    const ax=.35+Math.sin(t*.2)*.15,ay=t*.25;

    // wireframe globe
    ctx.lineWidth=.8;
    wire.forEach(seg=>{
      for(let k=0;k<seg.length-1;k++){
        const a=rot(seg[k],ax,ay),b=rot(seg[k+1],ax,ay),d=(a.z+b.z)/2;
        ctx.strokeStyle=gold(d>0?.32:.08);
        ctx.beginPath();ctx.moveTo(cx+a.x*S,cy+a.y*S);ctx.lineTo(cx+b.x*S,cy+b.y*S);ctx.stroke();
      }
    });
    // point sphere
    pts.forEach(p=>{
      const q=rot(p,ax,ay),d=(q.z+1)/2,s=.6+d*1.6;
      ctx.fillStyle=amber((.15+d*.75)*(.6+.4*Math.sin(t*3+p.tw)));
      ctx.fillRect(cx+q.x*S*1.04-s/2,cy+q.y*S*1.04-s/2,s,s);
    });

    // nucleus
    const pulse=.5+.5*Math.sin(t*2.2);
    g=ctx.createRadialGradient(cx,cy,0,cx,cy,S*.45);
    g.addColorStop(0,amber(.95));g.addColorStop(.25,gold(.55+pulse*.25,190));g.addColorStop(1,gold(0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,S*.45,0,TAU);ctx.fill();
    // nucleus counter-rotating hex rings
    for(let i=0;i<3;i++){
      const rr=S*(.16+i*.08),n=6+i*6,rotA=t*(i%2?-.8:.6);
      ctx.strokeStyle=gold(.7-i*.15,200);ctx.lineWidth=1.2;ctx.beginPath();
      for(let k=0;k<=n;k++){const a=rotA+k/n*TAU,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}
      ctx.stroke();
    }

    // orbits + satellites
    orbits.forEach((o,i)=>{
      ctx.strokeStyle=cyan(.18);ctx.lineWidth=.8;ctx.beginPath();
      for(let k=0;k<=96;k++){const a=k/96*TAU,q=rot({x:Math.cos(a)*o.r,y:0,z:Math.sin(a)*o.r},o.ix,o.iy+t*.05);const x=cx+q.x*S,y=cy+q.y*S;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}
      ctx.stroke();
      for(let j=0;j<2;j++){
        const a=t*o.sp+j*Math.PI,q=rot({x:Math.cos(a)*o.r,y:0,z:Math.sin(a)*o.r},o.ix,o.iy+t*.05);
        const x=cx+q.x*S,y=cy+q.y*S,sz=q.z>0?3:1.8;
        ctx.fillStyle=cyan(q.z>0?.95:.4);ctx.beginPath();ctx.arc(x,y,sz,0,TAU);ctx.fill();
        // trail
        ctx.strokeStyle=cyan(.35);ctx.lineWidth=1.5;ctx.beginPath();
        for(let k=0;k<14;k++){const b=a-o.sp*k*.04,p=rot({x:Math.cos(b)*o.r,y:0,z:Math.sin(b)*o.r},o.ix,o.iy+t*.05);const X=cx+p.x*S,Y=cy+p.y*S;k?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}
        ctx.stroke();
      }
    });

    // radar sweep
    const sw=t*.9%TAU;
    ctx.save();ctx.translate(cx,cy);
    const sg=ctx.createConicGradient?ctx.createConicGradient(sw-.6,0,0):null;
    if(sg){sg.addColorStop(0,gold(0));sg.addColorStop(.095,gold(.22,200));sg.addColorStop(.1,gold(0));ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,R*.4,0,TAU);ctx.fill()}
    ctx.restore();

    // outer arc segments
    arcs.forEach(a=>{
      const st=a.a0+t*a.sp;ctx.strokeStyle=gold(.55,165);ctx.lineWidth=a.w;
      ctx.beginPath();ctx.arc(cx,cy,a.r*R,st,st+a.len);ctx.stroke();
    });

    // tick ring with degree labels
    const TR=R*.46;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-t*.04);
    for(let k=0;k<120;k++){
      const a=k/120*TAU,long=k%10===0,mid=k%5===0,l=long?12:mid?7:4;
      ctx.strokeStyle=gold(long?.8:.35);ctx.lineWidth=long?1.4:.8;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*TR,Math.sin(a)*TR);ctx.lineTo(Math.cos(a)*(TR-l),Math.sin(a)*(TR-l));ctx.stroke();
    }
    ctx.fillStyle=gold(.6);ctx.font=`${Math.max(9,R*.018)}px "Chakra Petch",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(let k=0;k<12;k++){const a=k/12*TAU;ctx.save();ctx.rotate(a);ctx.fillText(String(k*30).padStart(3,'0'),0,-(TR+R*.022));ctx.restore()}
    ctx.restore();

    // hex readouts around core
    ctx.font=`${Math.max(9,R*.017)}px "Chakra Petch",monospace`;ctx.textAlign='center';
    reads.forEach(r=>{
      if(t-r.t>.4+Math.random()*2){r.v=hex();r.t=t}
      const a=r.a+t*.03,x=cx+Math.cos(a)*R*.36,y=cy+Math.sin(a)*R*.36;
      ctx.fillStyle=cyan(.55);ctx.fillText('0x'+r.v,x,y);
    });

    ctx.globalCompositeOperation='source-over';
    if(!reduce)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- search modes ---------- */
let mode='法規';
const chips=[...document.querySelectorAll('.chip')];
const ph={法規:'例：保險法第64條 告知義務',判例:'例：最高法院 實支實付 理賠爭議',條款:'例：住院醫療保險 日間住院 定義'};
chips.forEach(c=>c.addEventListener('click',()=>{mode=c.dataset.mode;chips.forEach(x=>x.setAttribute('aria-pressed',x===c));document.getElementById('q').placeholder=ph[mode]}));
const refLinks={
  法規:[['全國法規資料庫','https://law.moj.gov.tw/'],['金管會保險局','https://www.ib.gov.tw/']],
  判例:[['司法院裁判書查詢','https://judgment.judicial.gov.tw/FJUD/default.aspx'],['金融消費評議中心','https://www.foi.org.tw/']],
  條款:[['保險商品資訊揭露（保發中心）','https://insprod.tii.org.tw/'],['壽險公會','https://www.lia-roc.org.tw/']]
};
function showLinks(){document.getElementById('links').innerHTML=refLinks[mode].map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join('')}
showLinks();chips.forEach(c=>c.addEventListener('click',showLinks));

/* ---------- AI (sample capability) ---------- */
let samplePromise=window.claude?.use?window.claude.use('sample'):Promise.resolve(null);
const qbtn=document.getElementById('qbtn'),briefBtn=document.getElementById('brief'),ans=document.getElementById('ans');
samplePromise.then(s=>{if(!s){qbtn.disabled=true;briefBtn.disabled=true;document.getElementById('briefnote').textContent='此檢視無法使用 AI 功能，請以下方官方連結查詢。'}});

const sys={
  法規:'你是台灣保險法規助理。依使用者問題，指出相關法規名稱與條號，用白話說明要點。不確定的條號請明說不確定，切勿杜撰。',
  判例:'你是台灣保險訴訟研究助理。說明此類爭議的常見法院見解與爭點。若引用具體判決字號，只引用你確定存在的；不確定就只描述見解，並提醒使用者至司法院裁判書系統查證。',
  條款:'你是台灣保險條款解析助理。解釋相關保單條款的常見定義、除外責任與理賠實務，並提醒各公司條款不同，應以保單為準。'
};
document.getElementById('qform').addEventListener('submit',async e=>{
  e.preventDefault();const q=document.getElementById('q').value.trim();if(!q)return;
  const sample=await samplePromise;if(!sample)return;
  ans.hidden=false;ans.textContent='分析中…';qbtn.disabled=true;
  try{
    await sample(`${sys[mode]}\n以繁體中文回答，400字內，條列重點，最後一行附「查證建議」。\n\n問題：${q}`,{onText:({text})=>{ans.textContent=text}});
  }catch(err){ans.textContent=err.code==='rate_limited'?'請求過於頻繁，請稍候再試。':'目前無法取得回覆：'+(err.message||err.code)}
  finally{qbtn.disabled=false}
});
briefBtn.addEventListener('click',async()=>{
  const sample=await samplePromise;if(!sample)return;
  briefBtn.disabled=true;const box=document.createElement('article');box.innerHTML='<div class="meta">AI 彙整</div><p></p>';
  const p=box.querySelector('p');p.style.whiteSpace='pre-wrap';p.textContent='彙整中…';
  document.getElementById('news').prepend(box);
  try{
    await sample('你是台灣保險業分析師。請以繁體中文條列 5 項近期台灣保險業的重要監理與市場趨勢（如 IFRS 17／TW-ICS 接軌、高齡化商品、AI 應用、匯率對外幣保單影響等），每項一句話，並註明這是依既有知識整理、非即時新聞。',{onText:({text})=>{p.textContent=text}});
  }catch(err){p.textContent=err.code==='rate_limited'?'請求過於頻繁，請稍候再試。':'目前無法彙整：'+(err.message||err.code)}
  finally{briefBtn.disabled=false}
});
