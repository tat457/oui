document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");

  /* ===== 音 ===== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");
  const bgm = new Audio("bgm_Music.mp3");
  bgm.loop = true;
  bgm.volume = 0.4;

  let bubbleTimer, gameTimer;
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

  /* ===== 共通ボタンCSS ===== */
  const btnBase = `
    position: fixed;
    top: 10px;
    padding: 6px 14px;
    font-size: 14px;
    border-radius: 16px;
    border: none;
    background: rgba(255,255,255,0.9);
    z-index: 20;
  `;

  /* ===== モード選択（左上） ===== */
  const modeSelect = document.createElement("select");
  modeSelect.innerHTML = `
    <option value="easy">やさしい</option>
    <option value="normal">ふつう</option>
    <option value="hard">むずかしい</option>
  `;
  modeSelect.style.cssText = btnBase + "left:10px;";
  document.body.appendChild(modeSelect);

  modeSelect.onchange = e => currentMode = e.target.value;

  /* ===== スタート（上中央） ===== */
  const startBtn = document.createElement("button");
  startBtn.textContent = "スタート";
  startBtn.style.cssText =
    btnBase + "left:50%;transform:translateX(-50%);";
  document.body.appendChild(startBtn);

  /* ===== リセット（右上） ===== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.cssText = btnBase + "right:10px;";
  document.body.appendChild(resetBtn);

  /* ===== 表示 ===== */
  const scoreDiv = document.createElement("div");
  scoreDiv.style.cssText =
    "position:fixed;top:50px;left:10px;color:white;font-size:22px;z-index:10;";
  scoreDiv.textContent = "Score: 0";
  document.body.appendChild(scoreDiv);

  const timerDiv = document.createElement("div");
  timerDiv.style.cssText =
    "position:fixed;top:50px;right:10px;color:white;font-size:22px;z-index:10;";
  timerDiv.textContent = "Time: 30";
  document.body.appendChild(timerDiv);

  /* ===== リセット ===== */
  resetBtn.onclick = () => {
    clearInterval(bubbleTimer);
    clearInterval(gameTimer);
    document.querySelectorAll(".bubble").forEach(b => b.remove());
    bgm.pause(); bgm.currentTime = 0;
    score = 0; timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";
  };

  /* ===== MediaPipe ===== */
  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });
  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(r => {
    handPos = [];
    if (r.multiHandLandmarks?.length) {
      [r.multiHandLandmarks[0][4], r.multiHandLandmarks[0][8]].forEach(p => {
        handPos.push({
          x: innerWidth * (1 - p.x),
          y: innerHeight * p.y
        });
      });
    }
  });

  new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480,
    facingMode: "user"
  }).start();

  /* ===== 泡 ===== */
  function createBubble() {
    const m = modes[currentMode];
    const b = document.createElement("div");
    b.className = "bubble";
    b.style.width = b.style.height = m.size + "px";
    b.style.left = Math.random() * (innerWidth - m.size) + "px";
    b.style.top = "-60px";
    document.body.appendChild(b);

    let y = -m.size, dead = false;

    function burst() {
      if (dead) return;
      dead = true;
      b.classList.add("burst");
      popSound.currentTime = 0;
      popSound.play().catch(()=>{});
      score++;
      scoreDiv.textContent = "Score: " + score;
      setTimeout(() => b.remove(), 200);
    }

    function move() {
      if (dead) return;
      y += m.speed * 3;
      b.style.top = y + "px";
      if (y > innerHeight) return b.remove();

      for (const p of handPos) {
        const r = b.getBoundingClientRect();
        if (Math.hypot(r.left+r.width/2-p.x, r.top+r.height/2-p.y) < m.size) {
          burst(); return;
        }
      }
      requestAnimationFrame(move);
    }
    b.onclick = burst;
    move();
  }

  /* ===== スタート処理 ===== */
  startBtn.onclick = async () => {
    try {
      bgm.muted = true;
      await bgm.play();
      bgm.pause(); bgm.currentTime = 0;
      bgm.muted = false;
      bgm.play();
    } catch {}

    document.querySelectorAll(".bubble").forEach(b => b.remove());
    score = 0; timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";

    bubbleTimer = setInterval(createBubble, modes[currentMode].interval);
    gameTimer = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = "Time: " + timeLeft;
      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        clearInterval(bubbleTimer);
        bgm.pause();
        alert(`終了！スコア: ${score}`);
      }
    }, 1000);
  };
});
