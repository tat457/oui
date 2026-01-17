document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");

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

  /* ===== モード設定 ===== */
  const modes = {
    easy:   { size: 60, speed: 1.2, interval: 800 },
    normal: { size: 45, speed: 1.8, interval: 550 },
    hard:   { size: 35, speed: 2.4, interval: 350 }
  };
  let currentMode = "easy";

  /* ===== 共通ボタンスタイル ===== */
  const btnStyle = `
    position: fixed;
    top: 10px;
    padding: 6px 14px;
    font-size: 14px;
    border-radius: 16px;
    border: none;
    background: rgba(255,255,255,0.85);
    z-index: 20;
  `;

  /* ===== モード選択 ===== */
  const modeSelect = document.createElement("select");
  modeSelect.innerHTML = `
    <option value="easy">やさしい</option>
    <option value="normal">ふつう</option>
    <option value="hard">むずかしい</option>
  `;
  modeSelect.style.cssText = btnStyle + "left:10px;";
  document.body.appendChild(modeSelect);

  modeSelect.addEventListener("change", e => {
    currentMode = e.target.value;
  });

  /* ===== スタートボタン ===== */
  const startBtn = document.createElement("button");
  startBtn.textContent = "スタート";
  startBtn.style.cssText = btnStyle + "left:50%;transform:translateX(-50%);";
  document.body.appendChild(startBtn);

  /* ===== リセットボタン ===== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.cssText = btnStyle + "right:10px;";
  document.body.appendChild(resetBtn);

  /* ===== スコア ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:50px;left:10px;color:white;font-size:22px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  /* ===== タイマー ===== */
  const timerDiv = document.createElement("div");
  timerDiv.style.cssText =
    "position:fixed;top:50px;right:10px;color:white;font-size:22px;z-index:10;";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  /* ===== リセット処理 ===== */
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

  /* ===== MediaPipe Hands ===== */
  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });
  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(res => {
    handPos = [];
    if (res.multiHandLandmarks?.length) {
      [res.multiHandLandmarks[0][4], res.multiHandLandmarks[0][8]].forEach(t => {
        handPos.push({
          x: window.innerWidth * (1 - t.x),
          y: window.innerHeight * t.y
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

  /* ===== 泡生成 ===== */
  function createBubble() {
    const m = modes[currentMode];
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.width = bubble.style.height = m.size + "px";
    bubble.style.left = Math.random() * (window.innerWidth - m.size) + "px";
    bubble.style.top = "-60px";
    document.body.appendChild(bubble);

    let y = -m.size;
    let removed = false;

    function burst() {
      if (removed) return;
      removed = true;
      bubble.classList.add("burst");
      popSound.currentTime = 0;
      popSound.play().catch(()=>{});
      score++;
      scoreDiv.textContent = "Score: " + score;
      setTimeout(() => bubble.remove(), 250);
    }

    function move() {
      if (removed) return;
      y += m.speed * 3;
      bubble.style.top = y + "px";

      if (y > window.innerHeight) {
        bubble.remove();
        return;
      }

      for (const p of handPos) {
        const r = bubble.getBoundingClientRect();
        const dx = r.left + r.width/2 - p.x;
        const dy = r.top + r.height/2 - p.y;
        if (Math.hypot(dx, dy) < m.size) {
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

    bubbleInterval = setInterval(
      createBubble,
      modes[currentMode].interval
    );

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(bubbleInterval);
        bgm.pause();
        alert(`🎉 終了！スコア: ${score}`);
      }
    }, 1000);
  });
});
