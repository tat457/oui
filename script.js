document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");
  const modeSelect = document.getElementById("modeSelect");

  /* ===== 音 ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
  const bgm = new Audio("bgm_Music.mp3");
  bgm.loop = true;
  bgm.volume = 0.4;

  /* ===== 状態 ===== */
  let score = 0;
  let timeLeft = 30;
  let bubbleInterval = null;
  let timerInterval = null;
  let handPos = [];

  /* ===== モード設定 ===== */
  const MODES = {
    easy:   { size: 80, speed: 1.2, interval: 700 },
    normal: { size: 55, speed: 1.8, interval: 500 },
    hard:   { size: 40, speed: 2.4, interval: 350 }
  };
  let currentMode = MODES.easy;

  /* ===== 表示 ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:60px;left:10px;color:white;font-size:22px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  const timerDiv = document.createElement("div");
  timerDiv.style.cssText =
    "position:fixed;top:60px;right:10px;color:white;font-size:22px;z-index:10;";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  /* ===== MediaPipe Hands ===== */
  const hands = new Hands({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    handPos = [];
    if (results.multiHandLandmarks?.length) {
      const hand = results.multiHandLandmarks[0];
      [hand[4], hand[8]].forEach(tip => {
        handPos.push({
          x: tip.x * window.innerWidth,   // ← 反転しない
          y: tip.y * window.innerHeight
        });
      });
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480,
    facingMode: "user"
  });
  camera.start();

  /* ===== 泡 ===== */
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const size = currentMode.size;
    const speed = currentMode.speed;

    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left =
      Math.random() * (window.innerWidth - size) + "px";
    bubble.style.top = "-" + size + "px";

    document.body.appendChild(bubble);

    let removed = false;

    function burst() {
      if (removed) return;
      removed = true;

      bubble.classList.add("burst");

      popSound.currentTime = 0;
      popSound.play().catch(() => {});

      score++;
      scoreDiv.textContent = "Score: " + score;

      setTimeout(() => bubble.remove(), 200);
    }

    function move() {
      if (removed) return;

      let top = parseFloat(bubble.style.top);
      top += speed;
      bubble.style.top = top + "px";

      const rect = bubble.getBoundingClientRect();

      for (const p of handPos) {
        const dx = rect.left + rect.width / 2 - p.x;
        const dy = rect.top + rect.height / 2 - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < rect.width / 2) {
          burst();
          return;
        }
      }

      if (top < window.innerHeight + size) {
        requestAnimationFrame(move);
      } else {
        bubble.remove();
      }
    }

    bubble.addEventListener("touchstart", burst);
    move();
  }

  /* ===== スタート ===== */
  startBtn.addEventListener("click", async () => {
    currentMode = MODES[modeSelect.value];

    // iOS 音声アンロック
    try {
      bgm.muted = true;
      await bgm.play();
      bgm.pause();
      bgm.currentTime = 0;
      bgm.muted = false;
      bgm.play();
    } catch {}

    popSound.muted = true;
    popSound.play().then(() => {
      popSound.pause();
      popSound.currentTime = 0;
      popSound.muted = false;
    }).catch(()=>{});

    document.querySelectorAll(".bubble").forEach(b => b.remove());
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);

    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bubbleInterval = setInterval(
      createBubble,
      currentMode.interval
    );

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(bubbleInterval);
        bgm.pause();
        alert(`終了！スコア: ${score}`);
      }
    }, 1000);
  });

  /* ===== リセット ===== */
  resetBtn.addEventListener("click", () => {
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());
    bgm.pause();
    bgm.currentTime = 0;
    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";
  });
});
