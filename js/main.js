// 이 파일의 역할: 전체 초기화 + 시작화면 전환 + 헤더 버튼 + 완성 흐름 + Toast 알림
// FlowBuilder 버전 (draw-toast의 main.js 자리)

(function () {
  const game = {
    nickname: "",
    started: false,
  };

  function showToast(msg, ms = 2200) {
    const el = document.getElementById("toast-notification");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), ms);
  }
  window.Notify = showToast;

  function startGame() {
    const nickInput = document.getElementById("nickname-input");
    const timerSel = document.getElementById("timer-select");
    let nick = (nickInput.value || "").trim();
    if (!nick) nick = "익명_" + Math.floor(Math.random() * 1000);
    setNickname(nick);
    game.started = true;
    document.getElementById("start-screen").classList.add("hidden");

    const secs = parseInt(timerSel.value, 10);
    if (window.Timer) {
      window.Timer.setDuration(secs);
      if (secs > 0) window.Timer.start();
    }

    if (window.Export && window.Export.loadFonts) window.Export.loadFonts();
    if (window.MermaidExport) window.MermaidExport.updatePanel();
  }

  function setNickname(name) {
    game.nickname = name;
    document.getElementById("player-name-display").textContent = `👤 ${name}`;
  }

  function startNicknameEdit() {
    if (!game.started) return;
    const display = document.getElementById("player-name-display");
    if (!display || display.classList.contains("editing")) return;
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 16;
    input.value = game.nickname;
    input.className = "player-name-input";
    let composing = false, cancelled = false;
    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => { composing = false; });
    input.addEventListener("keydown", (e) => {
      if (composing) return;
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { cancelled = true; input.blur(); }
    });
    input.addEventListener("blur", () => {
      if (!cancelled) {
        const v = input.value.trim();
        if (v.length > 0) setNickname(v);
      }
      input.remove();
      display.classList.remove("editing");
    });
    display.classList.add("editing");
    display.parentNode.insertBefore(input, display.nextSibling);
    input.focus();
    input.select();
  }

  function finishWork() {
    const state = window.Canvas.getState();
    const shapes = state.shapes || state.cards || [];
    if (shapes.length === 0) {
      showToast("아직 도형을 하나도 안 놓았어요. 도형 하나라도 놓아보세요!");
      return;
    }
    const snapshot = {
      nickname: game.nickname,
      shapes,
      arrows: state.arrows,
      mermaid: window.MermaidExport ? window.MermaidExport.generate() : "",
      timestamp: Date.now(),
    };
    if (window.Gallery) window.Gallery.save(snapshot);
    const msg = `🎉 ${game.nickname}님의 흐름도가 갤러리에 저장됐어요!`;
    document.getElementById("finish-message").innerHTML = msg;
    if (window.Interpret) window.Interpret.showFinish();
    document.getElementById("finish-modal").classList.remove("hidden");
  }

  function bindHeader() {
    document.getElementById("connect-mode-btn").addEventListener("click", () => {
      const next = !window.Canvas.connectMode;
      window.Canvas.setConnectMode(next);
      if (next) showToast("🔗 연결모드 ON — 도형 A 클릭 → 도형 B 클릭", 2500);
    });
    document.getElementById("clear-btn").addEventListener("click", () => {
      const shapes = window.Canvas.shapes || window.Canvas.cards || [];
      if (shapes.length === 0) return;
      if (confirm("캔버스를 모두 비울까요?")) window.Canvas.clearAll();
    });
    document.getElementById("finish-btn").addEventListener("click", finishWork);
    document.getElementById("help-btn-top").addEventListener("click", openHelp);
    document.getElementById("player-name-display").addEventListener("click", startNicknameEdit);
  }

  function openHelp() { document.getElementById("help-modal").classList.remove("hidden"); }
  function closeHelp() { document.getElementById("help-modal").classList.add("hidden"); }
  function bindHelpModal() {
    document.getElementById("help-btn-start").addEventListener("click", openHelp);
    document.getElementById("help-close").addEventListener("click", closeHelp);
    document.getElementById("help-close-2").addEventListener("click", closeHelp);
  }

  function bindFinishModal() {
    document.getElementById("finish-copy").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.copyCode();
    });
    document.getElementById("finish-live").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.openMermaidLive();
    });
    document.getElementById("finish-download").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.saveMd();
    });
    document.getElementById("finish-continue").addEventListener("click", () => {
      document.getElementById("finish-modal").classList.add("hidden");
    });
  }

  function bindSidebar() {
    document.getElementById("copy-code-btn").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.copyCode();
    });
    document.getElementById("open-live-btn").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.openMermaidLive();
    });
    document.getElementById("save-md-btn").addEventListener("click", () => {
      if (window.MermaidExport) window.MermaidExport.saveMd();
    });
    document.getElementById("save-png-btn").addEventListener("click", () => {
      if (window.Export) window.Export.currentToPng();
    });
    document.getElementById("gallery-btn").addEventListener("click", () => {
      if (window.Gallery) window.Gallery.open();
    });
  }

  function bindStartScreen() {
    document.getElementById("start-btn").addEventListener("click", startGame);
    document.getElementById("nickname-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
  }

  function init() {
    if (window.Palette) window.Palette.init();
    if (window.Canvas) window.Canvas.init();
    if (window.Timer) window.Timer.init();
    if (window.Gallery) window.Gallery.init();
    if (window.Stats) window.Stats.refresh();
    if (window.MermaidExport) window.MermaidExport.updatePanel();
    bindStartScreen();
    bindHeader();
    bindFinishModal();
    bindSidebar();
    bindHelpModal();
  }

  window.Game = {
    init,
    getNickname: () => game.nickname,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
