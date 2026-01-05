document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  const popSound = new Audio('Balloon-Pop01-1(Dry).mp3'); // GitHub Pages に置く
  let bubbleInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = []; // 複数ランドマーク用

  // --- スコア表示 ---
  const scoreDiv = document.createElement("div");
  scoreDiv.style.position = "fixed";
  scoreDiv.style.top = "10px";
  scoreDiv.style.left = "10px";
  scoreDiv.style.color = "white";
  scoreDiv.style.fontSize = "24px";
  scoreDiv.style.zIndex = "10";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  // --- タイマー表示 ---
  const timerDiv = document.createElement("div");
  timerDiv.style.position = "fixed";
  timerDiv.style.top = "10px";
  timerDiv.style.right = "10px";
  timerDiv.style.color = "white";
  timerDiv.style.fontSize = "24px";
  timerDiv.style.zIndex = "10";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  // --- リセットボタン ---
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.position = "fixed";
  resetBtn.style.bottom = "60px";
  resetBtn.style.left = "50%";
  resetBtn.style.transform = "translateX(-50%)";
  resetBtn.style.padding = "10px 20px";
  resetBtn.style.fontSize = "20px";
  resetBtn.style.zIndex = "10";
  document.body.appendChild(resetBtn);

  resetBtn.addEventListener("click", () => {
    clearInterval(bubbleInterval);
    bubbleInterval = null;
    document.querySelectorAll(".bubble").forEach(b => b.remove());
    score = 0;
    scoreDiv.textContent = "Score: 0";
    timeLeft = 30;
    timerDiv.textContent = "Time: " + timeLeft;
  });

  // --- MediaPipe Hands 設定 ---
  const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    handPos = [];
    if(results.multiHandLandmarks.length > 0){
      const hand = results.multiHandLandmarks[0];
      const landmarks = [hand[4], hand[8]]; // 親指先、人差し指先
      landmarks.forEach(tip => {
        const hx = window.innerWidth * (1 - tip.x);
        const hy = tip.y * window.innerHeight;
        handPos.push({x: hx, y: hy});
      });
    }
  });

  // --- MediaPipe Camera 起動 ---
  const cameraMP = new Camera(video, {
    onFrame: async () => await hands.send({image: video}),
    width: 640,
    height: 480,
    facingMode: "user"
  });
  cameraMP.start();

  // --- 泡生成 ---
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.left = Math.random() * (window.innerWidth - 60) + "px";
    bubble.style.top = window.innerHeight + "px";
    document.body.appendChild(bubble);

    const speed = 1 + Math.random() * 2;
    let removedByHand = false;

    function move() {
      if(removedByHand) return;

      let top = parseFloat(bubble.style.top);
      top -= speed;
      bubble.style.top = top + "px";

      if(top + 60 < 0){
        bubble.remove();
        return;
      }

      // --- 手判定 ---
      if(handPos.length > 0){
        const rect = bubble.getBoundingClientRect();
        const bx = rect.left + rect.width/2;
        const by = rect.top + rect.height/2;

        if(handPos.some(p => {
          const dx = bx - p.x;
          const dy = by - p.y;
          const distance = Math.sqrt(dx*dx + dy*dy);
          if(distance < 100){
            bubble.remove();
            removedByHand = true;
            popSound.currentTime = 0;
            popSound.play();
            score++;
            scoreDiv.textContent = "Score: " + score;
            return true;
          }
          return false;
        })) return;
      }

      requestAnimationFrame(move);
    }

    move();

    // タッチでも割れる
   bubble.addEventListener("touchstart", () => {
  if (removedByHand) return;
  removedByHand = true;

  bubble.classList.add("burst"); // ←追加

  popSound.currentTime = 0;
  popSound.play();

  score++;
  scoreDiv.textContent = "Score: " + score;

  setTimeout(() => {
    bubble.remove();
  }, 250);
});
+
+} //
  
 // --- スタートボタン ---
 startBtn.addEventListener("click", () => {

  // 🔑 iOS 音声アンロック
  popSound.muted = true;
  popSound.play().then(() => {
    popSound.pause();
    popSound.currentTime = 0;
    popSound.muted = false;
  });

  if (bubbleInterval) clearInterval(bubbleInterval);
  bubbleInterval = setInterval(createBubble, 600);

  score = 0;
  scoreDiv.textContent = "Score: 0";

  timeLeft = 30;
  timerDiv.textContent = "Time: " + timeLeft;

  const timerInterval = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = "Time: " + timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(bubbleInterval);
      bubbleInterval = null;
      alert(`🎉終了！あなたのスコア: ${score}`);
    }
  }, 1000);
});
 


    

});
