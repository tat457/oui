document.addEventListener("DOMContentLoaded", () => {

const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");

/* ===== 効果音 ===== */
const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
const bombSound = new Audio("bakuhatu.mp3");

/* ===== BGM ===== */
const bgms = {
  easy: new Audio("bgm_Music.mp3"),
  normal: new Audio("awawa.mp3"),
  hard: new Audio("awawawa.mp3")
};

Object.values(bgms).forEach(bgm=>{
  bgm.loop = true;
  bgm.volume = 0.4;
});

let currentBgm = bgms.easy;

let bubbleInterval = null;
let timerInterval = null;

let score = 0;
let timeLeft = 30;

let handPos = [];
let handRadius = 80;

/* ===== 難易度 ===== */
const modes = {
 easy:{size:60,speed:1,interval:600},
 normal:{size:45,speed:1.5,interval:400},
 hard:{size:35,speed:2,interval:250}
};

let currentMode = modes.easy;

/* ===== モード選択 ===== */
const modeSelect = document.createElement("select");
modeSelect.style.cssText=`
position:fixed; top:8px; left:8px; z-index:20; font-size:14px;
`;

modeSelect.innerHTML=`
<option value="easy">やさしい</option>
<option value="normal">ふつう</option>
<option value="hard">むずかしい</option>
`;

document.body.appendChild(modeSelect);

modeSelect.addEventListener("change",()=>{
  currentMode=modes[modeSelect.value];
  currentBgm.pause();
  currentBgm.currentTime=0;
  currentBgm=bgms[modeSelect.value];
});

/* ===== ボタン ===== */
startBtn.style.cssText=`
position:fixed;
top:8px;
left:50%;
transform:translateX(-50%);
z-index:20;
font-size:14px;
padding:4px 14px;
`;

const resetBtn=document.createElement("button");
resetBtn.textContent="リセット";
resetBtn.style.cssText=`
position:fixed;
top:8px;
right:8px;
z-index:20;
font-size:14px;
padding:4px 14px;
`;
document.body.appendChild(resetBtn);

resetBtn.addEventListener("click",()=>{
  clearInterval(bubbleInterval);
  clearInterval(timerInterval);
  document.querySelectorAll(".bubble,.bomb").forEach(b=>b.remove());
  score=0;
  timeLeft=30;
  scoreDiv.textContent="Score: 0";
  timerDiv.textContent="Time: 30";
  currentBgm.pause();
  currentBgm.currentTime=0;
});

/* ===== UI ===== */
const scoreDiv=document.createElement("div");
scoreDiv.style.cssText="position:fixed;top:60px;left:10px;color:white;font-size:22px;";
scoreDiv.textContent="Score: 0";
document.body.appendChild(scoreDiv);

const timerDiv=document.createElement("div");
timerDiv.style.cssText="position:fixed;top:60px;right:10px;color:white;font-size:22px;";
timerDiv.textContent="Time: 30";
document.body.appendChild(timerDiv);

/* ===== MediaPipe ===== */
const hands = new Hands({
 locateFile: file =>
 `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
 maxNumHands:1,
 modelComplexity:1,
 minDetectionConfidence:0.7,
 minTrackingConfidence:0.7
});

hands.onResults(results=>{
 handPos=[];

 if(results.multiHandLandmarks?.length){
  const hand=results.multiHandLandmarks[0];

  const points=[hand[4],hand[8],hand[12],hand[16],hand[20]];
  points.forEach(p=>{
    handPos.push({
      x:window.innerWidth*(1-p.x),
      y:window.innerHeight*p.y
    });
  });

  const palmX=(hand[0].x+hand[5].x+hand[17].x)/3;
  const palmY=(hand[0].y+hand[5].y+hand[17].y)/3;

  handPos.push({
    x:window.innerWidth*(1-palmX),
    y:window.innerHeight*palmY
  });

  const size=Math.hypot(
    hand[5].x-hand[17].x,
    hand[5].y-hand[17].y
  );

  handRadius=size*window.innerWidth*1.8;
 }
});

/* ===== カメラ ===== */
const cameraMP=new Camera(video,{
 onFrame:async()=>{ await hands.send({image:video}); },
 width:640,
 height:480,
 facingMode:"user"
});
cameraMP.start();

/* ===== パーティクル ===== */
function createParticles(x,y){
 for(let i=0;i<6;i++){
  const p=document.createElement("div");
  p.style.position="absolute";
  p.style.left=x+"px";
  p.style.top=y+"px";
  p.style.width="6px";
  p.style.height="6px";
  p.style.borderRadius="50%";
  p.style.background="white";
  document.body.appendChild(p);

  const dx=(Math.random()-0.5)*80;
  const dy=(Math.random()-0.5)*80;

  p.animate([
    {transform:"translate(0,0)",opacity:1},
    {transform:`translate(${dx}px,${dy}px)`,opacity:0}
  ],{duration:400});

  setTimeout(()=>p.remove(),400);
 }
}

/* ===== オブジェクト生成（泡＋爆弾） ===== */
function createObject(){

 const isBomb = Math.random() < 0.2;

 const obj=document.createElement("div");
 obj.className = isBomb ? "bomb" : "bubble";

 const size=currentMode.size;

 obj.style.width=size+"px";
 obj.style.height=size+"px";
 obj.style.left=Math.random()*(window.innerWidth-size)+"px";
 obj.style.top=-size+"px";

 if(isBomb){
   obj.style.backgroundImage="url('bomb.png')";
   obj.style.backgroundSize="contain";
   obj.style.backgroundRepeat="no-repeat";
   obj.style.backgroundPosition="center";
 }else{
   obj.style.borderRadius="50%";

   const colors=[
    "rgba(173,216,230,0.7)",
    "rgba(255,182,193,0.7)",
    "rgba(255,255,150,0.7)",
    "rgba(180,255,200,0.7)"
   ];

   obj.style.background =
   colors[Math.floor(Math.random()*colors.length)];
 }

 document.body.appendChild(obj);

 const speed=(2+Math.random()*3)*currentMode.speed;

 let removed=false;

 function hit(){
  if(removed)return;
  removed=true;

  const rect=obj.getBoundingClientRect();

  createParticles(
    rect.left+rect.width/2,
    rect.top+rect.height/2
  );

  if(isBomb){
    bombSound.play().catch(()=>{});
    score=Math.max(0,score-3);
  }else{
    popSound.play().catch(()=>{});
    score++;
  }

  scoreDiv.textContent="Score: "+score;

  obj.remove();
 }

 function move(){
  if(removed)return;

  let top=parseFloat(obj.style.top);
  top+=speed;
  obj.style.top=top+"px";

  if(top>window.innerHeight){
    obj.remove();
    return;
  }

  for(const p of handPos){
    const rect=obj.getBoundingClientRect();
    const dx=rect.left+rect.width/2-p.x;
    const dy=rect.top+rect.height/2-p.y;

    const hitRadius=Math.max(size*1.8,handRadius);

    if(Math.sqrt(dx*dx+dy*dy)<hitRadius){
      hit();
      return;
    }
  }

  requestAnimationFrame(move);
 }

 obj.addEventListener("touchstart",hit);
 move();
}

/* ===== スタート ===== */
startBtn.addEventListener("click",async()=>{

 try{
   currentBgm.muted=true;
   await currentBgm.play();
   currentBgm.pause();
   currentBgm.currentTime=0;
   currentBgm.muted=false;
   currentBgm.play();
 }catch{}

 clearInterval(bubbleInterval);
 clearInterval(timerInterval);

 document.querySelectorAll(".bubble,.bomb").forEach(b=>b.remove());

 score=0;
 timeLeft=30;

 scoreDiv.textContent="Score: 0";
 timerDiv.textContent="Time: 30";

 bubbleInterval=setInterval(
   createObject, // ←ここ重要
   currentMode.interval
 );

 timerInterval=setInterval(()=>{

   timeLeft--;
   timerDiv.textContent="Time: "+timeLeft;

   if(timeLeft<=0){
     clearInterval(timerInterval);
     clearInterval(bubbleInterval);
     currentBgm.pause();
     currentBgm.currentTime=0;
     alert(`終了！あなたのスコア: ${score}`);
   }

 },1000);

});

});
