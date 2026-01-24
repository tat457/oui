document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  /* ===== 効果音 ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");

  /* ===== BGM（難易度別） ===== */
  const bgms = {
    easy: new Audio("bgm_Music.mp3"),
    normal: new Audio("Bgm2_Music.mp3"),
    hard: new Audio("Bgm3_Music.mp3")
  };
  Object.values(bgms).forEach(bgm => {
    bgm.loop = true;
    bgm.volume = 0.4;
  });

  let currentBgm = bgms.easy;

  let bubbleInterval = null;
  let timerInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = [];

  /* ===== 難易度設定 ===== */
  const modes = {
    easy:   { size: 60, speed: 1.0, interval: 600 },
    normal: { size: 45, speed: 1.5, interval: 400 },
    hard:   { size: 35, speed: 2.0, interval: 250 }
  };
  let currentMode = modes.easy;

  /* ===== モード選択 ===== */
  const modeSelect = document.createElement("select");
  modeSelect.style.cssText = `
    position:fixed;
    top:8px;
    left:8px;
    z-index:20;
    font-size:14px;
  `;
  modeSelect.innerHTML = `
    <option value="easy">やさしい</option>
    <option value="normal">ふつう</option>
    <option value="hard">むずかしい</option>
  `;
  document.body.appendChild(modeSelect);

  modeSelect.addEventListener("change", () => {
    currentMode = modes[modeSelect.value];

    /* BGM切り替え */
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = bgms[modeSelect.value];
  });

  /* ===== スタートボタン ===== */
  startBtn.style.cssText = `
    position:fixed;
    top:8px;
    left:50%;
    transform:translateX(-50%);
    z-index:20;
    font-size:14px;
    padding:4px 14px;
  `;

  /* ===== リセットボタン ===== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.cssText = `
    position:fixed;
    top:8px;
    right:8px;
    z-index:20;
    font-size:14px;
    padding:4px 14px;
  `;
  document.body.appendChild(resetBtn);

  resetBtn.addEventListener("click", () => {
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());

    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    currentBgm.pause();
    currentBgm.currentTime = 0;
  });

  /* ===== スコア ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:60px;left:10px;color:white;font-size:22px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  /* ===== タイマー ===== */
  const timerDiv = document.createElement("div");
  timerDiv.style.cssText =
    "position:fixed;top:60px;right:10px;color:white;font-size:22px;z-index:10;";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

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

  /* ===== 泡生成 ===== */
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const size = currentMode.size;
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left =
      Math.random() * (window.innerWidth - size) + "px";
    bubble.style.top = -size + "px";

    document.body.appendChild(bubble);

    const speed = (2 + Math.random() * 3) * currentMode.speed;
    let removed = false;

    function burst() {
      if (removed) return;
      removed = true;

      popSound.currentTime = 0;
      popSound.play().catch(() => {});

      score++;
      scoreDiv.textContent = "Score: " + score;
      bubble.remove();
    }

    function move() {
      if (removed) return;

      let top = parseFloat(bubble.style.top);
      top += speed;
      bubble.style.top = top + "px";

      if (top > window.innerHeight) {
        bubble.remove();
        return;
      }

      for (const p of handPos) {
        const rect = bubble.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - p.x;
        const dy = rect.top + rect.height / 2 - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < size) {
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
      currentBgm.muted = true;
      await currentBgm.play();
      currentBgm.pause();
      currentBgm.currentTime = 0;
      currentBgm.muted = false;
      currentBgm.play();
    } catch {}

    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());

    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bubbleInterval = setInterval(createBubble, currentMode.interval);

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(bubbleInterval);
        currentBgm.pause();
        currentBgm.currentTime = 0;
        alert(`終了！あなたのスコア: ${score}`);
      }
    }, 1000);
  });
});
