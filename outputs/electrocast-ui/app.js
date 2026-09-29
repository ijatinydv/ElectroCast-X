const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

const scenarios = {
  initiation: {
    name: "First Lightning", status: "Electrifying", motion: "NE at 21 km/h", risk: "HIGH",
    eta: 23, window: "18–27 minutes", probabilities: [44, 76, 91], confidence: 82,
    frame: 6, radar: true, colors: ["#22d3ee", "#f6b94a"], location: [0.48, 0.42], growth: 1
  },
  severe: {
    name: "Active Severe Storm", status: "Intensifying", motion: "ENE at 34 km/h", risk: "EXTREME",
    eta: 8, window: "Lightning active", probabilities: [81, 93, 98], confidence: 88,
    frame: 8, radar: true, colors: ["#f6b94a", "#fb6674"], location: [0.55, 0.39], growth: 1.32
  },
  failure: {
    name: "Sensor Failure", status: "Degraded mode", motion: "NE at 19 km/h", risk: "MODERATE",
    eta: 29, window: "22–38 minutes", probabilities: [31, 63, 84], confidence: 63,
    frame: 7, radar: false, colors: ["#8b5cf6", "#f6b94a"], location: [0.47, 0.45], growth: .92
  }
};

const state = {
  scenario: "initiation", frame: 6, playing: true, speed: 1, lead: 15,
  layers: { radar: true, risk: true, lightning: true, assets: false },
  sensors: { radar: true, satellite: true, lightning: true, nwp: true },
  xrayMode: "reflectivity", rotation: true
};

const messages = {
  en: "High lightning risk is expected in Demo District North between 4:20 PM and 4:50 PM. Avoid open fields, rooftops, isolated trees and metal structures. Move indoors immediately.",
  hi: "डेमो डिस्ट्रिक्ट नॉर्थ में शाम 4:20 से 4:50 बजे के बीच बिजली गिरने का उच्च जोखिम है। खुले मैदान, छत, अकेले पेड़ और धातु संरचनाओं से दूर रहें। तुरंत सुरक्षित भवन में जाएँ।",
  pa: "ਡੈਮੋ ਡਿਸਟ੍ਰਿਕਟ ਨਾਰਥ ਵਿੱਚ ਸ਼ਾਮ 4:20 ਤੋਂ 4:50 ਵਜੇ ਦਰਮਿਆਨ ਬਿਜਲੀ ਡਿੱਗਣ ਦਾ ਉੱਚ ਖਤਰਾ ਹੈ। ਖੁੱਲ੍ਹੇ ਮੈਦਾਨ, ਛੱਤਾਂ, ਇਕੱਲੇ ਦਰੱਖਤ ਅਤੇ ਧਾਤੂ ਢਾਂਚਿਆਂ ਤੋਂ ਦੂਰ ਰਹੋ। ਤੁਰੰਤ ਅੰਦਰ ਜਾਓ।"
};

function setActiveTab(tab) {
  $$(".view").forEach(v => v.classList.remove("active"));
  $$(".nav-item").forEach(v => v.classList.toggle("active", v.dataset.tab === tab));
  $(`#${tab}View`)?.classList.add("active");
  if (tab === "replay") setTimeout(drawReplay, 80);
}

$$('[data-action="tab"]').forEach(btn => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));

function applyScenario(key) {
  state.scenario = key;
  const s = scenarios[key];
  state.frame = s.frame;
  state.sensors.radar = s.radar;
  $$(".scenario").forEach(b => b.classList.toggle("active", b.dataset.scenario === key));
  $("#stormStatus").textContent = s.status;
  $("#stormMotion").textContent = s.motion;
  $("#riskBadge").textContent = s.risk;
  $("#etaValue").textContent = s.eta;
  $("#etaWindow").textContent = s.window;
  ["p15", "p30", "p60"].forEach((id, i) => {
    $(`#${id}`).textContent = `${s.probabilities[i]}%`;
    $(`#${id}`).nextElementSibling.style.setProperty("--p", s.probabilities[i]);
  });
  $("#confidenceText").textContent = `${s.confidence}% · ${s.confidence >= 80 ? "HIGH" : "MODERATE"}`;
  $("#confidenceBar").style.width = `${s.confidence}%`;
  const arrival = $(".arrival-strip b");
  if (arrival) {
    arrival.textContent = `${s.eta} MIN`;
    arrival.dataset.risk = s.risk.toLowerCase();
  }
  $("#timelineInput").value = s.frame;
  $("#stormLabel").querySelector("b").textContent = s.status.toUpperCase();
  updateFrameUI();
  updateSensorRows();
  toast("Scenario loaded", `${s.name} · deterministic demonstration data`);
}

$$('.scenario').forEach(btn => btn.addEventListener("click", () => applyScenario(btn.dataset.scenario)));

function updateSensorRows() {
  Object.entries(state.sensors).forEach(([name, on]) => {
    $(`[data-sensor-row="${name}"]`)?.classList.toggle("off", !on);
    const toggle = $(`[data-sensor="${name}"]`);
    if (toggle) toggle.checked = on;
  });
  $$(".radar-echo").forEach(el => el.classList.toggle("hidden", !state.sensors.radar || !state.layers.radar));
}

function updateFrameUI() {
  const time = 15 * 60 + 38 + state.frame * 5;
  const h = Math.floor(time / 60);
  const m = time % 60;
  const label = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  $("#dataTime").textContent = label;
  $("#timelineLabel").textContent = `${state.frame < 6 ? "OBSERVED" : state.frame === 6 ? "NOW" : "FORECAST"} · ${label}`;
  $("#frameNumber").textContent = `${String(state.frame + 1).padStart(2,"0")}/13`;
  $("#timelineProgress").style.width = `${state.frame / 12 * 100}%`;
}

$("#timelineInput").addEventListener("input", e => { state.frame = +e.target.value; updateFrameUI(); });
$("#playBtn").addEventListener("click", () => { state.playing = !state.playing; $("#playBtn").textContent = state.playing ? "Ⅱ" : "▶"; });
$("#speedBtn").addEventListener("click", () => { state.speed = state.speed === 1 ? 2 : state.speed === 2 ? .5 : 1; $("#speedBtn").textContent = `${state.speed}×`; });
$$('[data-lead]').forEach(btn => btn.addEventListener("click", () => { state.lead = +btn.dataset.lead; $$("[data-lead]").forEach(b => b.classList.toggle("active", b === btn)); toast("Forecast horizon", `${state.lead}-minute risk corridor selected`); }));
$$('[data-layer]').forEach(btn => btn.addEventListener("click", () => { const l = btn.dataset.layer; state.layers[l] = !state.layers[l]; btn.classList.toggle("active", state.layers[l]); if(l === "radar") updateSensorRows(); }));

const weatherCanvas = $("#weatherCanvas");
const wctx = weatherCanvas.getContext("2d");
let lastFrameAdvance = performance.now();

function resizeCanvas(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  return { w: rect.width, h: rect.height, dpr };
}

function pathLine(ctx, pts, stroke, width = 1, dash = []) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}

function drawBackgroundMap(ctx, w, h) {
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(3,8,16,.24)"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = "rgba(83,111,141,.28)"; ctx.lineWidth = .7;
  const roads = [
    [[0,h*.73],[w*.22,h*.59],[w*.39,h*.61],[w*.63,h*.44],[w,h*.36]],
    [[w*.08,0],[w*.22,h*.2],[w*.37,h*.32],[w*.48,h*.53],[w*.66,h*.68],[w*.78,h]],
    [[0,h*.2],[w*.16,h*.28],[w*.35,h*.27],[w*.54,h*.16],[w*.78,h*.2],[w,h*.1]],
    [[w*.1,h],[w*.24,h*.78],[w*.48,h*.74],[w*.7,h*.86],[w,h*.82]]
  ];
  roads.forEach((p,i)=>pathLine(ctx,p,i<2?"rgba(88,119,151,.42)":"rgba(88,119,151,.25)",i<2?1.4:.7));
  ctx.strokeStyle="rgba(85,108,139,.17)";
  for(let i=0;i<16;i++){ctx.beginPath();ctx.arc(w*(.05+i*.065),h*(.45+Math.sin(i)*.07),12+i%3*7,0,Math.PI*2);ctx.stroke()}
}

function blob(ctx,x,y,rx,ry,colors,alpha,phase){
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(phase)*.12);
  const g=ctx.createRadialGradient(-rx*.18,-ry*.18,4,0,0,rx);
  g.addColorStop(0,hexAlpha(colors[1],alpha*.9));g.addColorStop(.28,hexAlpha("#f6d34a",alpha*.76));g.addColorStop(.56,hexAlpha("#36d399",alpha*.42));g.addColorStop(1,"rgba(15,64,85,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
}

function hexAlpha(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}

function riskCorridor(ctx,w,h,s,t){
  const [lx,ly]=s.location; const leadScale=state.lead/60;
  const x=w*(lx+.04*Math.sin(t*.00025)),y=h*(ly+.03*Math.cos(t*.0002));
  ctx.save();ctx.translate(x,y);ctx.rotate(-.35);
  const len=w*(.22+.28*leadScale), wid=h*(.08+.12*leadScale)*(state.sensors.radar?1:1.55);
  const grad=ctx.createLinearGradient(0,0,len,0);grad.addColorStop(0,"rgba(34,211,238,.22)");grad.addColorStop(1,"rgba(139,92,246,.05)");
  ctx.fillStyle=grad;ctx.strokeStyle="rgba(34,211,238,.58)";ctx.lineWidth=1.2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(0,-wid*.18);ctx.lineTo(len,-wid);ctx.lineTo(len,wid);ctx.lineTo(0,wid*.18);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle="rgba(255,255,255,.55)";ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,0);ctx.stroke();ctx.restore();
}

function drawLightning(ctx,w,h,t,s){
  if(!state.layers.lightning)return;
  const count=state.scenario==="severe"?12:state.frame>7?7:3;
  for(let i=0;i<count;i++){
    const seed=(i*97+Math.floor(t/1100)*13)%100; if(seed%4!==0&&i>2) continue;
    const x=w*(s.location[0]+(Math.sin(i*5.3)*.09)), y=h*(s.location[1]+(Math.cos(i*3.8)*.12));
    ctx.strokeStyle=`rgba(220,248,255,${.45+((seed%10)/20)})`;ctx.lineWidth=1.4;ctx.shadowColor="#22d3ee";ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x-3,y-3);ctx.lineTo(x+3,y-3);ctx.lineTo(x-2,y+10);ctx.stroke();ctx.shadowBlur=0;
  }
}

function drawAssets(ctx,w,h){
  if(!state.layers.assets)return;
  const pts=[[.69,.4,"SCHOOL"],[.74,.52,"HOSP"],[.59,.62,"GRID"],[.82,.32,"VILLAGE"]];
  ctx.font="7px ui-monospace";pts.forEach(([x,y,l])=>{ctx.fillStyle="#f6b94a";ctx.fillRect(w*x-3,h*y-3,6,6);ctx.fillStyle="#f6d489";ctx.fillText(l,w*x+6,h*y+3)});
}

function animateWeather(t){
  const {w,h,dpr}=resizeCanvas(weatherCanvas);wctx.setTransform(dpr,0,0,dpr,0,0);drawBackgroundMap(wctx,w,h);const s=scenarios[state.scenario];
  if(state.layers.radar&&state.sensors.radar){
    const f=(state.frame/12-.5)*.1; const x=w*(s.location[0]+f),y=h*s.location[1];
    blob(wctx,x,y,w*.12*s.growth,h*.13*s.growth,s.colors,.95,t*.001);blob(wctx,x-w*.08,y+h*.08,w*.09,h*.08,["#34d399",s.colors[0]],.72,t*.0015);blob(wctx,x+w*.08,y-h*.05,w*.08,h*.1,["#f6d34a",s.colors[1]],.84,t*.0012);
  }
  if(state.layers.risk)riskCorridor(wctx,w,h,s,t);drawLightning(wctx,w,h,t,s);drawAssets(wctx,w,h);
  if(state.playing&&t-lastFrameAdvance>1100/state.speed){state.frame=(state.frame+1)%13;$("#timelineInput").value=state.frame;updateFrameUI();lastFrameAdvance=t}
  requestAnimationFrame(animateWeather);
}
requestAnimationFrame(animateWeather);

$("#stormLabel").addEventListener("click",()=>setActiveTab("xray"));
$("#fullscreenBtn").addEventListener("click",()=>$("#mapStage").requestFullscreen?.());
$("#mapStage").addEventListener("mousemove",e=>{const tt=$("#mapTooltip");if(!state.layers.assets){tt.style.display="none";return}tt.style.display="block";tt.style.left=`${e.offsetX+12}px`;tt.style.top=`${e.offsetY+12}px`;tt.innerHTML="<b>Synthetic exposure layer</b><br>Click storm corridor to inspect assets"});
$("#mapStage").addEventListener("mouseleave",()=>$("#mapTooltip").style.display="none");

// X-ray interactions
$("#autoRotateBtn").addEventListener("click",()=>{state.rotation=!state.rotation;$("#stormVolume").classList.toggle("paused",!state.rotation);$("#autoRotateBtn").textContent=state.rotation?"Pause rotation":"Resume rotation"});
$("#tempSlice").addEventListener("input",e=>{const labels=["0°C","−10°C","−20°C"];$("#tempLabel").textContent=labels[e.target.value];$$(".temp-plane").forEach((p,i)=>p.style.opacity=i===+e.target.value?1:.22)});
$$('[data-xray]').forEach(btn=>btn.addEventListener("click",()=>{state.xrayMode=btn.dataset.xray;$$('[data-xray]').forEach(b=>b.classList.toggle("active",b===btn));$("#stormVolume").style.filter=btn.dataset.xray==="zdr"?"hue-rotate(65deg) saturate(1.4)":btn.dataset.xray==="kdp"?"hue-rotate(290deg) saturate(1.5)":btn.dataset.xray==="ice"?"hue-rotate(210deg) brightness(1.2)":"none";toast("X-Ray layer",`${btn.textContent} field selected`)}));

// Evidence lab
function recalcSensors(){
  const off=Object.entries(state.sensors).filter(([,v])=>!v).map(([k])=>k);let confidence=82,corridor=11,prob=76;
  if(!state.sensors.radar){confidence-=19;corridor+=12;prob-=13}
  if(!state.sensors.satellite){confidence-=10;corridor+=6;prob-=8}
  if(!state.sensors.nwp){confidence-=6;corridor+=3;prob-=4}
  if(!state.sensors.lightning&&state.scenario!=="initiation"){confidence-=8;corridor+=4}
  confidence=Math.max(38,confidence);prob=Math.max(25,prob);
  $("#labConfidence").textContent=`${confidence}%`;$("#labConfidenceLabel").textContent=`${confidence}% CONFIDENCE`;$("#corridorWidth").textContent=`${corridor} km`;$("#labProbability").textContent=`${prob}%`;
  $("#confidenceDelta").textContent = off.length ? `−${82 - confidence} points` : "Nominal";
  $("#widthDelta").textContent = off.length ? `+${corridor - 11} km` : "Calibrated";
  $("#corridorDemo").classList.toggle("degraded", off.length > 0);
  $$(".contribution-row").forEach(row=>row.classList.toggle("off",!state.sensors[row.dataset.contribution]));
  const m=$("#degradationMessage");if(off.length){m.classList.add("warning");m.innerHTML=`<span>!</span><div><b>${off.map(n=>n[0].toUpperCase()+n.slice(1)).join(", ")} unavailable</b><small>Forecast continues with a wider calibrated corridor.</small></div>`}else{m.classList.remove("warning");m.innerHTML='<span>✓</span><div><b>All modalities available</b><small>Forecast operating at nominal confidence.</small></div>'}
  state.sensors.radar?$("#explainText").textContent="Radar contributes most because the ZDR column and KDP core strengthened near the −10°C level.":$("#explainText").textContent="With radar removed, INSAT cloud-top cooling becomes the strongest available initiation signal.";
  updateSensorRows();
}
$$('[data-sensor]').forEach(input=>input.addEventListener("change",()=>{state.sensors[input.dataset.sensor]=input.checked;recalcSensors();toast(input.checked?"Sensor restored":"Degraded mode",`${input.dataset.sensor} ${input.checked?"returned to service":"removed from inference"}`)}));
$("#resetSensors").addEventListener("click",()=>{Object.keys(state.sensors).forEach(k=>state.sensors[k]=true);recalcSensors();toast("Sensors reset","All modalities restored")});
$("#decompPlay").addEventListener("click",()=>{$(".decomp-grid").classList.toggle("playing");$("#decompPlay").textContent=$(".decomp-grid").classList.contains("playing")?"PAUSE":"PLAY"});

// Alert centre
$$('[data-lang]').forEach(btn=>btn.addEventListener("click",()=>{$$('[data-lang]').forEach(b=>b.classList.toggle("active",b===btn));$("#messageEditor").textContent=messages[btn.dataset.lang];$("#phoneMessage").textContent=messages[btn.dataset.lang].split(".")[0]+"."}));
$("#messageEditor").addEventListener("input",e=>{$("#phoneMessage").textContent=e.target.textContent});
$("#toggleAssets").addEventListener("click",()=>{state.layers.assets=true;setActiveTab("mission");$('[data-layer="assets"]').classList.add("active");toast("Exposure layer enabled","Synthetic assets shown inside the forecast corridor")});
function sendAlert(){
  $("#successModal").classList.add("show");
}
$("#sendAlert").addEventListener("click",sendAlert);$("#sendAlertTop").addEventListener("click",sendAlert);
$("#closeModal").addEventListener("click",()=>{$("#successModal").classList.remove("show");setActiveTab("mission")});

// Replay canvases
function drawMiniMap(canvas, observed=false, progress=.52){
  const ctx=canvas.getContext("2d"),{w,h,dpr}=resizeCanvas(canvas);ctx.setTransform(dpr,0,0,dpr,0,0);drawBackgroundMap(ctx,w,h);
  const x=w*(.38+progress*.28),y=h*(.52-progress*.12);blob(ctx,x,y,w*.18,h*.2,["#22d3ee",observed?"#fb6674":"#f6b94a"],.7,progress*8);
  if(observed){ctx.fillStyle="#fff";ctx.shadowColor="#22d3ee";ctx.shadowBlur=15;ctx.font="31px serif";ctx.fillText("ϟ",x+16,y-10);ctx.shadowBlur=0}else{riskCorridor(ctx,w,h,scenarios.initiation,performance.now())}
  ctx.fillStyle=observed?"#fb6674":"#22d3ee";ctx.font="bold 10px ui-monospace";ctx.fillText(observed?"OBSERVED FIRST FLASH":"PREDICTED RISK CORRIDOR",12,20);
}
function drawReplay(){const p=+$("#replayInput").value/100;drawMiniMap($("#predictionCanvas"),false,p);drawMiniMap($("#observationCanvas"),true,p)}
$("#replayInput").addEventListener("input",e=>{const p=+e.target.value;const min=Math.round(8+p*.5);$("#replayTime").textContent=`${16+Math.floor(min/60)}:${String(min%60).padStart(2,"0")} ${p>45?"First flash window":"Storm developing"}`;drawReplay()});
let replayTimer;
$("#replayPlay").addEventListener("click",()=>{clearInterval(replayTimer);replayTimer=setInterval(()=>{const r=$("#replayInput");r.value=(+r.value+2)%101;r.dispatchEvent(new Event("input"))},90);toast("Replay started","Predicted and observed storm evolution")});
$("#replayReset").addEventListener("click",()=>{clearInterval(replayTimer);$("#replayInput").value=0;$("#replayInput").dispatchEvent(new Event("input"))});

function toast(title,copy){const el=document.createElement("div");el.className="toast";el.innerHTML=`<span>✦</span><div><b>${title}</b><small>${copy}</small></div>`;$("#toastStack").append(el);setTimeout(()=>{el.style.opacity=0;el.style.transform="translateX(20px)";setTimeout(()=>el.remove(),300)},3000)}

// Clock and ambience affordance
function updateClocks(){
  const d=new Date();
  $("#clock").textContent=d.toLocaleTimeString("en-IN",{hour12:false,timeZone:"Asia/Kolkata"});
  $("#utcClock").textContent=d.toLocaleTimeString("en-GB",{hour12:false,timeZone:"UTC"});
}
setInterval(updateClocks,1000);updateClocks();
$("#soundToggle").addEventListener("click",e=>{e.currentTarget.classList.toggle("active");toast("Interface ambience",e.currentTarget.classList.contains("active")?"Sound cues enabled":"Sound cues muted")});
window.addEventListener("resize",()=>{drawReplay()});
applyScenario("initiation");recalcSensors();
