// 이 파일의 역할: 사이드바 통계(도형 수, 연결 수, 갤러리 수) 실시간 갱신

(function () {
  function refresh() {
    const shapes = window.Canvas
      ? (window.Canvas.shapes || window.Canvas.cards || []).length
      : 0;
    const arrows = window.Arrows ? window.Arrows.count() : 0;
    const sEl = document.getElementById("stat-shapes");
    const cEl = document.getElementById("stat-cards");  // 호환
    const aEl = document.getElementById("stat-arrows");
    if (sEl) sEl.textContent = shapes;
    if (cEl) cEl.textContent = shapes;
    if (aEl) aEl.textContent = arrows;
    refreshGalleryCount();
  }

  function refreshGalleryCount() {
    const n = window.Gallery ? window.Gallery.count() : 0;
    const el = document.getElementById("gallery-count");
    if (el) el.textContent = n;
  }

  window.Stats = { refresh, refreshGalleryCount };
})();
