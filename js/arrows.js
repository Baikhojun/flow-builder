// 이 파일의 역할: 두 도형 사이 화살표(SVG path) + 라벨 텍스트 + 도형 이동 추적

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const state = {
    arrows: [],   // { uid, fromUid, toUid, label }
    nextUid: 1,
  };

  function getLayer() { return document.getElementById("arrows-layer"); }

  function add(fromUid, toUid) {
    if (fromUid === toUid) return;
    const exists = state.arrows.some((a) => a.fromUid === fromUid && a.toUid === toUid);
    if (exists) return;
    const arrow = { uid: state.nextUid++, fromUid, toUid, label: "" };
    state.arrows.push(arrow);
    renderArrow(arrow);
    notifyChange();
  }

  function renderArrow(arrow) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "arrow-group");
    g.setAttribute("data-uid", arrow.uid);

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "arrow-path");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.style.cursor = "pointer";
    path.addEventListener("click", (e) => {
      e.stopPropagation();
      // 단일 클릭: 라벨 편집 (Shift+클릭 시 삭제)
      if (e.shiftKey) {
        remove(arrow.uid);
      } else {
        editLabel(arrow.uid);
      }
    });
    path.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      editLabel(arrow.uid);
    });
    g.appendChild(path);

    const labelText = document.createElementNS(SVG_NS, "text");
    labelText.setAttribute("class", "arrow-label");
    labelText.setAttribute("text-anchor", "middle");
    labelText.setAttribute("dominant-baseline", "middle");
    labelText.style.cursor = "pointer";
    labelText.addEventListener("click", (e) => {
      e.stopPropagation();
      editLabel(arrow.uid);
    });
    g.appendChild(labelText);

    getLayer().appendChild(g);
    updateArrowPath(arrow);
  }

  function updateArrowPath(arrow) {
    const from = window.Canvas.getCardPos(arrow.fromUid);
    const toBox = window.Canvas.getCardBox(arrow.toUid);
    const fromBox = window.Canvas.getCardBox(arrow.fromUid);
    if (!from || !toBox || !fromBox) return;
    const toCenter = { x: toBox.x + toBox.w / 2, y: toBox.y + toBox.h / 2 };
    const fromCenter = { x: fromBox.x + fromBox.w / 2, y: fromBox.y + fromBox.h / 2 };

    const start = boundaryPoint(fromCenter, toCenter, fromBox);
    const end = boundaryPoint(toCenter, fromCenter, toBox);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const g = getLayer().querySelector(`[data-uid="${arrow.uid}"]`);
    if (!g) return;
    const path = g.querySelector(".arrow-path");
    const labelText = g.querySelector(".arrow-label");
    if (path) path.setAttribute("d", `M${start.x},${start.y} L${end.x},${end.y}`);
    if (labelText) {
      labelText.setAttribute("x", midX);
      labelText.setAttribute("y", midY - 8);
      labelText.textContent = arrow.label || "";
    }
  }

  function boundaryPoint(center, target, box) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    if (dx === 0 && dy === 0) return center;
    const halfW = box.w / 2;
    const halfH = box.h / 2;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const tx = adx > 0 ? halfW / adx : Infinity;
    const ty = ady > 0 ? halfH / ady : Infinity;
    const t = Math.min(tx, ty);
    return {
      x: center.x + dx * t,
      y: center.y + dy * t,
    };
  }

  function refreshFor(cardUid) {
    state.arrows
      .filter((a) => a.fromUid === cardUid || a.toUid === cardUid)
      .forEach(updateArrowPath);
  }

  function remove(arrowUid) {
    state.arrows = state.arrows.filter((a) => a.uid !== arrowUid);
    const g = getLayer().querySelector(`[data-uid="${arrowUid}"]`);
    if (g) g.remove();
    notifyChange();
  }

  function removeByCard(cardUid) {
    const affected = state.arrows.filter((a) => a.fromUid === cardUid || a.toUid === cardUid);
    affected.forEach((a) => {
      const g = getLayer().querySelector(`[data-uid="${a.uid}"]`);
      if (g) g.remove();
    });
    state.arrows = state.arrows.filter((a) => a.fromUid !== cardUid && a.toUid !== cardUid);
    notifyChange();
  }

  function clear() {
    state.arrows = [];
    getLayer().innerHTML = "";
    notifyChange();
  }

  function getState() {
    return state.arrows.map((a) => ({ ...a }));
  }

  function count() { return state.arrows.length; }

  // 화살표 라벨 인라인 편집 (예/아니오 등)
  function editLabel(arrowUid) {
    const arrow = state.arrows.find((a) => a.uid === arrowUid);
    if (!arrow) return;
    const current = arrow.label || "";
    const next = window.prompt(
      "화살표에 라벨을 입력하세요 (예: 예 / 아니오 / 다음). 빈 칸이면 라벨이 사라집니다.",
      current
    );
    if (next === null) return;  // 취소
    arrow.label = next.trim();
    updateArrowPath(arrow);
    notifyChange();
  }

  function notifyChange() {
    if (window.Stats) window.Stats.refresh();
    if (window.MermaidExport) window.MermaidExport.updatePanel();
  }

  window.Arrows = { add, refreshFor, remove, removeByCard, clear, getState, count, editLabel };
})();
