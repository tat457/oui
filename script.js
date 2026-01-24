document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     基本DOM
  =============================== */
  const video = document.getElementById("video");
  const startBtn = document.getElementById("startBtn");

  /* ★ iOS Safari 対策：最初に強制表示 */
  startBtn.style.display = "block";
  startBtn.style.position = "fixed";
  startBtn.style.top = "8px";
  startBtn.style.left = "50%";
  startBtn.style.transform = "translateX(-50%)";
  startBtn.style.zIndex = "99999";
  startBtn.style.padding = "8px 20px";
  startBtn.style.fontSize = "15px";
  startBtn.style.borderRadius = "20px";
  startBtn.style.border = "none";
  startBtn.style.background = "white";
  startBtn.style.color = "black";

  /* ===============================
     効果音
  =============================== */
  const popSound = new Audio("Balloon-Pop01-1(Dry).mp3");

  /* ===============================
     BGM（難易度別）
  =============================== */
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

  function stopAllBgms() {
    Object.values(bgms).forEach(bgm => {
      bgm.pause();
      bgm.currentTime = 0;
    });
  }

  /* ===============================
     ゲーム状態
  =============================== */
  let bubbleInterval = null;
  let timerInterval = null;
  let score = 0;
  let timeLeft = 30;
  let handPos = [];

  /* ===============================
     難易度
  =============================== */
  const modes = {
    easy:   { size: 60, speed: 1.0, interval: 600 },
    normal: { size: 45, speed: 1.5, interval: 400 },
    hard:   { size: 35, speed: 2.0, interval: 250 }
  };
  let currentMode = modes.easy;

  /* ===============================
     難易度セレクト
  =============================== */
  const modeSelect = document.createElement("select");
  modeSelect.innerHTML = `
    <option value="easy">やさしい</option>
    <option value="normal">ふつう</option>
    <option value="hard">むずかしい</option>
  `;
  modeSelect.style.position = "fixed";
  modeSelect.style.top = "8px";
  modeSelect.style.left = "8px";
  modeSelect.style.zIndex = "99999";
  document.body.appendChild(modeSelect);

  modeSelect.addEventListener("change", () => {
    currentMode = modes[modeSelect.value];
    currentBgm = bgms[modeSelect.value];
  });

  /* ===============================
     リセット
  =============================== */
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "リセット";
  resetBtn.style.position = "fixed";
  resetBtn.style.top = "8px";
  resetBtn.style.right = "8px";
  resetBtn.style.zIndex = "99999";
  resetBtn.style.padding = "6px 16px";
  document.body.appendChild(resetBtn);

  /* ===============================
     表示
  =============================== */
  const scoreDiv = document.createElement("div");
  scoreDiv.textContent = "Score: 0";
  scoreDiv.style.position = "fixed";
  scoreDiv.style.top = "60px";
  scoreDiv.style.left = "10px";
  scoreDiv.style.color = "white";
  scoreDiv.style.fontSize = "22px";
  scoreDiv.style.zIndex = "99999";
  document.body.appendChild(scoreDiv);

  const timerDiv = document.createElement("div");
  timerDiv.textContent = "Time: 30";
  timerDiv.style.position = "fixed";
  timerDiv.style.top = "60px";
  timerDiv.style.right = "10px";
  timerDiv.style.color = "white";
  timerDiv.style.fontSize = "22px";
  timerDiv.style.zIndex = "99999";
  document.body.appendChild(timerDiv);

  resetBtn.onclick = () => {
    clearInterval(bubbleInterval);
    clearInterval(timerInterval);
    document.querySelectorAll(".bubble").forEach(b => b.remove());
    stopAllBgms();
    score = 0;
    timeLeft = 30;
    scoreDiv.textContent = "Score: 0";
    timerDiv.textContent = "Time: 30";
    startBtn.style.display = "block";
  };

  /* ===============================
     MediaPipe Hands
  =============================== */
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
      const h = results.multiHandLandmarks[0];
      [h[4], h[8]].forEach(t => {
        handPos.push({
          x: window.innerWidth * (1 - t.x),
          y: window.innerHeight * t.y
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

  /* ===============================
     泡
  =============================== */
  function createBubble() {
    const b = document.createElement("div");
    b.className = "bubble";
    const s = currentMode.size;
    b.style.width = b.style.height = s + "px";
    b.style.left = Math.random() * (innerWidth - s) + "px";
    b.style.top = -s + "px";
    document.body.appendChild(b);

    const sp = (2 + Math.random() * 3) * currentMode.speed;

    function move() {
      let t = parseFloat(b.style.top) + sp;
      b.style.top = t + "px";
      if (t > innerHeight) return b.remove();

      for (const p of handPos) {
        const r = b.getBoundingClientRect();
        if (Math.hypot(
          r.left + r.width / 2 - p.x,
          r.top + r.height / 2 - p.y
        ) < s) {
          popSound.currentTime = 0;
          popSound.play().catch(()=>{});
          score++;
          scoreDiv.textContent = "Score: " + score;
          b.remove();
          return;
        }
      }
      requestAnimationFrame(move);
    }
    move();
  }

  /* ===============================
     スタート
  =============================== */
  startBtn.onclick = async () => {
    startBtn.style.display = "none";
    stopAllBgms();

    try {
      currentBgm.muted = true;
      await currentBgm.play();
      currentBgm.pause();
      currentBgm.currentTime = 0;
      currentBgm.muted = false;
      currentBgm.play();
    } catch {}

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
        stopAllBgms();
        startBtn.style.display = "block";
        alert(`終了！スコア：${score}`);
      }
    }, 1000);
  };

});
