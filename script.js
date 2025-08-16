/* ====== データ ====== */
const MAJORS = [
  "愚者","魔術師","女教皇","女帝","皇帝","法王","恋人","戦車","力","隠者",
  "運命の輪","正義","吊るされた男","死神","節制","悪魔","塔","星","月","太陽","審判","世界"
];
const SUITS = ["ワンド","カップ","ソード","ペンタクル"];
const RANKS = ["エース","2","3","4","5","6","7","8","9","10","ペイジ","ナイト","クイーン","キング"];

const majorValue = name => name==="世界" ? 15 : 5;
const minorValue = r => {
  if (r==="エース") return 1;
  if (["2","3"].includes(r)) return 1;
  if (["4","5","6"].includes(r)) return 2;
  if (["7","8","9","10"].includes(r)) return 3;
  if (r==="ペイジ") return 2;
  if (r==="ナイト") return 3;
  if (r==="クイーン") return 3;
  if (r==="キング") return 4;
  return 0;
};

/* ====== デッキ生成 ====== */
function buildDeck(){
  const majorDeck = MAJORS.map(n => ({ kind:"major", name:n, value:majorValue(n) }));
  const minorDeck = [];
  for (const s of SUITS){
    for (const r of RANKS){
      minorDeck.push({ kind:"minor", name:`${s}の${r}`, suit:s, rank:r, bonus:minorValue(r) });
    }
  }
  return [...majorDeck, ...minorDeck];
}
function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* ====== WebAudio（効果音） ====== */
let audioCtx=null, muted=false;
function beep(type="draw"){
  if(muted) return;
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = (type==="win") ? "triangle" : (type==="lose" ? "sawtooth" : "sine");
  const now = audioCtx.currentTime;
  let freq=660;
  if (type==="draw") freq=520;
  if (type==="attach") freq=740;
  if (type==="reveal") freq=600;
  if (type==="win") freq=880;
  if (type==="lose") freq=320;
  o.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0.001, now);
  g.gain.exponentialRampToValueAtTime(0.3, now+0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now+0.20);
  o.connect(g).connect(audioCtx.destination);
  o.start(now); o.stop(now+0.22);
}

/* ====== 状態 ====== */
let deck=[], round=1, maxRound=5, youScore=0, aiScore=0, coins=0;
let youMajor=null, youMinor=null, aiMajor=null, aiMinor=null;

const $ = s=>document.querySelector(s);
const logEl = $("#log");
const youFigure=$("#youFigure"), aiFigure=$("#aiFigure");

function log(line){
  const div=document.createElement("div"); div.textContent="• "+line;
  logEl.appendChild(div); logEl.scrollTop=logEl.scrollHeight;
}
function refreshBars(){
  $("#deckLeft").textContent = deck.length;
  $("#round").textContent = round;
  $("#you").textContent = youScore;
  $("#ai").textContent = aiScore;
  $("#coins").textContent = coins;
}
function resetRoundView(){
  $("#youBadge").textContent="あなた";
  $("#youCardTitle").textContent="—";
  $("#youHint").textContent="「大アルカナを引く」または「小アルカナを添える」";
  youFigure.innerHTML = placeholderSVG("you");
  $("#aiBadge").textContent="AI";
  $("#aiCardTitle").textContent="—";
  $("#aiHint").textContent="あなたの確定後に自動で引きます。";
  aiFigure.innerHTML = placeholderSVG("ai");
  $("#btnReveal").disabled=true;
  $("#btnNext").disabled=true;
}
function startGame(){
  deck = shuffle(buildDeck());
  round=1; youScore=0; aiScore=0; coins=0;
  youMajor=youMinor=aiMajor=aiMinor=null;
  logEl.innerHTML=""; log("ゲーム開始。全78枚をシャッフルしました。");
  refreshBars(); resetRoundView();
}
function nextRound(){
  youMajor=youMinor=aiMajor=aiMinor=null;
  round++; if (round>maxRound){ endGame(); return; }
  log(`--- ラウンド ${round} ---`);
  resetRoundView(); refreshBars();
}
function endGame(){
  const result = youScore>aiScore ? "あなたの勝ち！" : youScore<aiScore ? "AIの勝ち！" : "引き分け";
  log(`=== 結果: ${result} （あなた ${youScore} - AI ${aiScore}）===`);
}

/* ====== 画像（簡易SVG） ====== */
function svgWrap(path, label){
  return `<svg width="100%" height="100%" viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#60a5fa" stop-opacity=".8"/>
        <stop offset="1" stop-color="#22d3ee" stop-opacity=".7"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="308" height="148" rx="14" fill="none" stroke="url(#g)" stroke-width="4"/>
    ${path}
    <text x="12" y="150" fill="#a7f3d0" font-size="16" font-weight="700">${label}</text>
  </svg>`;
}
function placeholderSVG(side="you"){
  const p = `<path d="M40 120 L160 40 L280 120" fill="none" stroke="url(#g)" stroke-width="8" stroke-linecap="round"/>`;
  const label = side==="you" ? "あなたのカード" : "AIカード";
  return svgWrap(p,label);
}
function majorSVG(name){
  // 幾何学記号で雰囲気だけ演出（著作権に配慮したオリジナル）
  const shapes = {
    "愚者": `<circle cx="80" cy="80" r="24" stroke="url(#g)" stroke-width="8" fill="none"/><path d="M120 40 L240 120" stroke="url(#g)" stroke-width="8" />`,
    "戦車": `<rect x="60" y="60" width="200" height="60" stroke="url(#g)" stroke-width="8" fill="none"/><path d="M60 120 L40 140 M260 120 L280 140" stroke="url(#g)" stroke-width="8"/>`,
    "世界": `<circle cx="160" cy="80" r="44" stroke="url(#g)" stroke-width="8" fill="none"/><path d="M116 36 L204 124 M204 36 L116 124" stroke="url(#g)" stroke-width="8"/>`
  };
  const p = shapes[name] || `<path d="M60 120 L160 40 L260 120" fill="none" stroke="url(#g)" stroke-width="8"/>`;
  return svgWrap(p, name);
}
function minorSVG(card){
  const c = card;
  const sym = { "ワンド":"M160 40 L160 120", "カップ":"M110 60 Q160 100 210 60 L210 80 Q160 120 110 80 Z",
                "ソード":"M160 40 L160 120 M140 60 L180 60 M140 90 L180 90", "ペンタクル":"M160 48 L184 112 L112 72 H208 L136 112 Z"}[c.suit] || "M60 120 L260 120";
  const p = `<path d="${sym}" fill="none" stroke="url(#g)" stroke-width="8"/>`;
  return svgWrap(p, `${c.suit}の${c.rank}（+${c.bonus}）`);
}

/* ====== 進行 ====== */
function drawFromDeck(kind){
  const idx = deck.findIndex(c => c.kind===kind);
  if (idx===-1) return null;
  return deck.splice(idx,1)[0];
}
function pickRandomMinor(){
  const idx = deck.findIndex(c => c.kind==="minor");
  if (idx===-1) return null;
  return deck.splice(idx,1)[0];
}
function ensureAiMoves(){
  if (!youMajor) return;
  aiMajor = drawFromDeck("major");
  if (aiMajor){
    $("#aiCardTitle").textContent = `${aiMajor.name}（+${aiMajor.value}）`;
    aiFigure.innerHTML = majorSVG(aiMajor.name);
    $("#aiHint").textContent = "必要なら小アルカナを自動添付";
    if (Math.random()<0.5){
      aiMinor = pickRandomMinor();
      if (aiMinor){
        $("#aiHint").textContent = `${aiMinor.name}（+${aiMinor.bonus}）を添付`;
      }
    }
    $("#btnReveal").disabled=false;
    beep("draw");
  }else{
    log("AIは大アルカナを引けませんでした。");
  }
  refreshBars();
}
function reveal(){
  const y = (youMajor?.value||0) + (youMinor?.bonus||0);
  const a = (aiMajor?.value||0) + (aiMinor?.bonus||0);
  const yTxt = `${youMajor?.name??"無し"} + ${youMinor?`${youMinor.name}`:"（ボーナス無し）"} = ${y}`;
  const aTxt = `${aiMajor?.name??"無し"} + ${aiMinor?`${aiMinor.name}`:"（ボーナス無し）"} = ${a}`;

  if (y>a){ youScore+=y; log(`あなたの勝ち！ ${yTxt} / AI: ${aTxt}`); beep("win"); }
  else if (y<a){ aiScore+=a; log(`AIの勝ち！ ${yTxt} / AI: ${aTxt}`); beep("lose"); }
  else { youScore+=y; aiScore+=a; log(`引き分け： ${yTxt} / AI: ${aTxt}`); beep("reveal"); }
  $("#btnNext").disabled=false;
  $("#btnReveal").disabled=true;
  refreshBars();
}

/* ====== UIイベント ====== */
$("#btnDrawMajor").addEventListener("click", ()=>{
  if (youMajor){ log("すでに大アルカナを引いています。"); return; }
  youMajor = drawFromDeck("major");
  if (!youMajor){ log("デッキに大アルカナがありません。"); return; }
  $("#youCardTitle").textContent = `${youMajor.name}（+${youMajor.value}）`;
  $("#youHint").textContent = "必要なら小アルカナを添えてください";
  youFigure.innerHTML = majorSVG(youMajor.name);
  beep("draw");
  refreshBars();
  ensureAiMoves();
});
$("#btnAttachMinor").addEventListener("click", ()=>{
  if (!youMajor){ log("先に大アルカナを引いてください。"); return; }
  if (youMinor){ log("小アルカナはすでに添付済みです。"); return; }
  youMinor = pickRandomMinor();
  if (!youMinor){ log("デッキに小アルカナがありません。"); return; }
  $("#youHint").textContent = `${youMinor.name}（+${youMinor.bonus}）を添付`;
  youFigure.innerHTML = minorSVG(youMinor);
  beep("attach");
  refreshBars();
  ensureAiMoves();
});
$("#btnReveal").addEventListener("click", reveal);
$("#btnNext").addEventListener("click", ()=>{
  if (round>=5){ log("ゲーム終了。リセットして再開できます。"); return; }
  nextRound();
});
$("#btnReset").addEventListener("click", startGame);
$("#btnMute").addEventListener("click", ()=>{
  muted = !muted;
  $("#btnMute").textContent = muted ? "🔇 サウンド：OFF" : "🔊 サウンド：ON";
});

/* 初期化 */
startGame();
log("手番：まず「大アルカナを引く」を押してね。必要なら小アルカナを追加できます。");
