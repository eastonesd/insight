/* ---------- clock ---------- */
const clk=document.getElementById('clock');
setInterval(()=>{clk.textContent=new Date().toLocaleTimeString('zh-TW',{hour12:false})},1000);

/* ---------- holographic orb ---------- */
(function(){
  const cv=document.getElementById('orb'),ctx=cv.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W,H,dpr;
  function size(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  size();addEventListener('resize',size);
  // rings: radius factor, speed, segments
  const rings=[];for(let i=0;i<14;i++)rings.push({r:.12+i*.026,sp:(i%2?1:-1)*(.08+Math.random()*.25),seg:Math.floor(8+Math.random()*22),off:Math.random()*6.28,w:1+Math.random()*2.2,tilt:Math.random()*.5+.5});
  const sparks=Array.from({length:260},()=>({a:Math.random()*6.28,r:.1+Math.random()*.38,sp:(Math.random()-.5)*.6,s:Math.random()*1.8+.4}));
  function frame(t){
    t/=1000;const cx=W/2,cy=H/2,R=Math.min(W,H);
    ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.45);g.addColorStop(0,'rgba(245,180,58,.35)');g.addColorStop(.4,'rgba(245,140,30,.08)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    rings.forEach((rg,i)=>{
      const rr=rg.r*R,step=6.283/rg.seg;
      ctx.save();ctx.translate(cx,cy);ctx.scale(1,rg.tilt+.2*Math.sin(t*.3+i));ctx.rotate(rg.off+t*rg.sp);
      ctx.strokeStyle=`rgba(255,${170+i*4},70,${.35+.4*Math.sin(t+i)**2})`;ctx.lineWidth=rg.w;
      for(let s=0;s<rg.seg;s++){if((s*7+i)%3===0)continue;ctx.beginPath();ctx.arc(0,0,rr,s*step,s*step+step*.6);ctx.stroke()}
      ctx.restore();
    });
    sparks.forEach(p=>{const a=p.a+t*p.sp,x=cx+Math.cos(a)*p.r*R,y=cy+Math.sin(a)*p.r*R*.92;ctx.fillStyle=`rgba(255,210,120,${.4+.6*Math.random()})`;ctx.fillRect(x,y,p.s,p.s)});
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
