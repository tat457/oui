document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  /* ===== 効果音 & BGM ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
  const bgm = new Audio("bgm_Music.mp3");
  bgm.loop = true;
  bgm.volume = 0.4;

  let bubbleInterval = null;
  let timerInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = [];

  /* ===== 難易度設定 ===== */
  const modes = {
    easy:   { size: 60, speed: 1.0 },
    normal: { size: 45, speed: 1.5 },
    hard:   { size: 35, speed: 2.0 }
  };
  let currentMode = modes.easy;

  /* ===== 上部操作バー（横並び） ===== */
  const uiBar = document.createElement("div");
  uiBar.style.cssText = `
    position: fixed;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    align-items: center;
    z-index: 20;
    background: rgba(0,0,0,0.4);
    padding: 6px 10px;
    border-radius: 8px;
  `;
  document.body.appendChild(uiBar);

  /* ===== モード選択 ===== */
  const modeSelect = document.createElement("select");
  modeSelect.style.fontSize = "14px";
  modeSelect.innerHTML = `
    <option value="easy">やさしい</option>
    <option value="normal">ふつう</option>
    <option value="hard">むずかしい</option>
  `;
  modeSelect.addEventListener("change", () => {
    currentMode = modes[modeSelect.value];
  });
  uiBar.appendChild(modeSelect);

  /* ===== スタートボタン（小） ===== */
  startBtn.style.fontSize = "14px";
  startBtn.style.padding = "4px 12px";
  uiBar.appendChild(startBtn);

  /* ===== リセットボタン（小） ===== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.fontSize = "14px";
  resetBtn.style.padding = "4px 12px";
  uiBar.appendChild(resetBtn);

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

  /* ===== スコア表示 ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:60px;left:10px;color:white;font-size:22px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  /* ===== タイマー表示 ===== */
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

  /* ===== 泡生成（上 → 下） ===== */
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
      bgm.muted = true;
      await bgm.play();
      bgm.pause();
      bgm.currentTime = 0;
      bgm.muted = false;
      bgm.play();
    } catch {}

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
