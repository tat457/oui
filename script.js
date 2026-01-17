document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  /* ===== 効果音 & BGM ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
  const bgm = new Audio("bgm_Music.mp3");
  bgm.loop = true;
  bgm.volume = 0.4; // ← 半角に修正（重要）

  let bubbleInterval = null;
  let timerInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = [];

  /* ===== スコア表示 ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:10px;left:10px;color:white;font-size:24px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  /* ===== タイマー表示 ===== */
  const timerDiv = document.createElement("div");
  timerDiv.style.cssText =
    "position:fixed;top:10px;right:10px;color:white;font-size:24px;z-index:10;";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  /* ===== リセットボタン ===== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.cssText =
    "position:fixed;bottom:60px;left:50%;transform:translateX(-50%);padding:10px 20px;font-size:20px;z-index:10;";
  document.body.appendChild(resetBtn);

  resetBtn.addEventListener("click", () => {
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());

    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bgm.pause();
    bgm.currentTime = 0;
  });

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
    if (results.multiHandLandmarks?.length) {
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
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480,
    facingMode: "user"
  });
  cameraMP.start();

  /* ===== 泡生成（上 → 下） ===== */
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.left =
      Math.random() * (window.innerWidth - 60) + "px";
    bubble.style.top = "-60px"; // ← 画面上から出現
    document.body.appendChild(bubble);

    const speed = 1 + Math.random() * 2;
    let removed = false;

    function burst() {
      if (removed) return;
      removed = true;

      bubble.classList.add("burst");
      popSound.currentTime = 0;
      popSound.play().catch(() => {});

      score++;
      scoreDiv.textContent = "Score: " + score;

      setTimeout(() => bubble.remove(), 250);
    }

    function move() {
      if (removed) return;

      let top = parseFloat(bubble.style.top);
      top += speed; // ← 下方向へ移動
      bubble.style.top = top + "px";

      if (top > window.innerHeight) {
        bubble.remove();
        return;
      }

      for (const p of handPos) {
        const rect = bubble.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - p.x;
        const dy = rect.top + rect.height / 2 - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 100) {
          burst();
          return;
        }
      }

      requestAnimationFrame(move);
    }

    bubble.addEventListener("touchstart", burst);
    move();
  }

  /* ===== スタート ===== */
  startBtn.addEventListener("click", async () => {
    try {
      bgm.muted = true;
      await bgm.play();
      bgm.pause();
      bgm.currentTime = 0;
      bgm.muted = false;
      bgm.play();
    } catch (e) {
      console.warn("BGM autoplay blocked:", e);
    }

    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());

    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bubbleInterval = setInterval(createBubble, 600);

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(bubbleInterval);
        bgm.pause();
        bgm.currentTime = 0;
        alert(`終了！あなたのスコア: ${score}`);
      }
    }, 1000);
  });
});
