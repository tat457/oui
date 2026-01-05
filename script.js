document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  /* ===== 音 ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
  const bgm = new Audio("ゲームBGM_Music.mp3");
  bgm.loop = true;
  bgm.volume = 0.5;

  /* ===== ゲーム状態 ===== */
  let bubbleInterval = null;
  let timerInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = [];

  /* ===== UI ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText = `
    position:fixed; top:10px; left:10px;
    color:white; font-size:24px; z-index:10;
  `;
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  const timerDiv = document.createElement("div");
  timerDiv.style.cssText = `
    position:fixed; top:10px; right:10px;
    color:white; font-size:24px; z-index:10;
  `;
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.cssText = `
    position:fixed; bottom:60px; left:50%;
    transform:translateX(-50%);
    padding:10px 20px; font-size:20px; z-index:10;
  `;
  document.body.appendChild(resetBtn);

  /* ===== MediaPipe Hands ===== */
  const hands = new Hands({
    locateFile: file =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    handPos = [];
    if (results.multiHandLandmarks.length > 0) {
      const hand = results.multiHandLandmarks[0];
      [hand[4], hand[8]].forEach(tip => {
        handPos.push({
          x: window.innerWidth * (1 - tip.x),
          y: window.innerHeight * tip.y
        });
      });
    }
  });

  const cameraMP = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
    facingMode: "user"
  });
  cameraMP.start();

  /* ===== 泡生成 ===== */
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.left =
      Math.random() * (window.innerWidth - 60) + "px";
    bubble.style.top = window.innerHeight + "px";
    document.body.appendChild(bubble);

    const speed = 1 + Math.random() * 2;
    let removed = false;

    function burst() {
      if (removed) return;
      removed = true;

      bubble.classList.add("burst");
      popSound.currentTime = 0;
      popSound.play();

      score++;
      scoreDiv.textContent = "Score: " + score;

      setTimeout(() => bubble.remove(), 250);
    }

    function move() {
      if (removed) return;

      let top = parseFloat(bubble.style.top);
      top -= speed;
      bubble.style.top = top + "px";

      if (top + 60 < 0) {
        bubble.remove();
        return;
      }

      if (handPos.length > 0) {
        const rect = bubble.getBoundingClientRect();
        const bx = rect.left + rect.width / 2;
        const by = rect.top + rect.height / 2;

        for (const p of handPos) {
          const dx = bx - p.x;
          const dy = by - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < 100) {
            burst();
            return;
          }
        }
      }
      requestAnimationFrame(move);
    }

    bubble.addEventListener("touchstart", burst);
    move();
  }

  /* ===== スタート ===== */
  startBtn.addEventListener("click", () => {
    // iOS Safari 音声アンロック
    bgm.muted = true;
    bgm.play().then(() => {
      bgm.muted = false;
    });

    popSound.muted = true;
    popSound.play().then(() => {
      popSound.pause();
      popSound.currentTime = 0;
      popSound.muted = false;
    });

    // 初期化
    document.querySelectorAll(".bubble").forEach(b => b.remove());
    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    clearInterval(bubbleInterval);
    clearInterval(timerInterval);

    bubbleInterval = setInterval(createBubble, 600);

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;

      if (timeLeft <= 0) {
        clearInterval(bubbleInterval);
        clearInterval(timerInterval);
        bubbleInterval = null;
        bgm.pause();
        bgm.currentTime = 0;
        alert(`🎉 終了！スコア：${score}`);
      }
    }, 1000);
  });

  /* ===== リセット ===== */
  resetBtn.addEventListener("click", () => {
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    bubbleInterval = null;

    document.querySelectorAll(".bubble").forEach(b => b.remove());
    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bgm.pause();
    bgm.currentTime = 0;
  });
});
