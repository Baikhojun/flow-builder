// 이 파일의 역할: SVG 캔버스에 도형(4종) 추가/드래그/선택/삭제 + 상태 관리
// (draw-toast의 카드 기반 → FlowBuilder의 도형 4종 기반)

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SHAPE_W = 140;
  const SHAPE_H = 72;

  const state = {
    shapes: [],         // { uid, shapeType, label, x, y }
    arrows: [],         // arrows.js 관리
    nextUid: 1,
    selectedUid: null,
    drag: null,
    connectMode: false,
    connectSource: null,
  };

  function el(tag, attrs = {}) {
    const e = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function getSvg() { return document.getElementById("canvas"); }
  function getLayer() { return document.getElementById("cards-layer"); }

  function svgPoint(evt) {
    const svg = getSvg();
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: evt.clientX, y: evt.clientY };
    const tr = pt.matrixTransform(ctm.inverse());
    return { x: tr.x, y: tr.y };
  }

  // 도형 추가 — shapeType: "rect" | "round" | "diamond" | "circle"
  function addShape(shapeType, opts = {}) {
    const def = SHAPE_TYPES.find(s => s.id === shapeType) || SHAPE_TYPES[0];
    const svg = getSvg();
    const rect = svg.getBoundingClientRect();
    const cx = (opts.x !== undefined ? opts.x : rect.width / 2 - SHAPE_W / 2 + (Math.random() * 80 - 40));
    const cy = (opts.y !== undefined ? opts.y : rect.height / 2 - SHAPE_H / 2 + (Math.random() * 80 - 40));

    const shape = {
      uid: state.nextUid++,
      shapeType: def.id,
      label: opts.label || def.label,
      x: cx,
      y: cy,
    };
    state.shapes.push(shape);
    renderShape(shape);
    onChanged();
    return shape.uid;
  }

  // 도형 종류별 SVG 요소 생성
  function createShapeEl(shapeType) {
    const def = SHAPE_TYPES.find(s => s.id === shapeType) || SHAPE_TYPES[0];
    let shapeEl;
    if (shapeType === "rect") {
      // 일반 사각형 (Mermaid [텍스트])
      shapeEl = el("rect", { width: SHAPE_W, height: SHAPE_H, rx: 6, ry: 6 });
    } else if (shapeType === "round") {
      // 스타디움 (Mermaid (텍스트))
      shapeEl = el("rect", { width: SHAPE_W, height: SHAPE_H, rx: SHAPE_H / 2, ry: SHAPE_H / 2 });
    } else if (shapeType === "diamond") {
      // 마름모 (Mermaid {텍스트})
      const cx = SHAPE_W / 2, cy = SHAPE_H / 2;
      const points = `${cx},0 ${SHAPE_W},${cy} ${cx},${SHAPE_H} 0,${cy}`;
      shapeEl = el("polygon", { points });
    } else if (shapeType === "circle") {
      // 타원 (Mermaid ((텍스트)))
      shapeEl = el("ellipse", {
        cx: SHAPE_W / 2,
        cy: SHAPE_H / 2,
        rx: SHAPE_W / 2,
        ry: SHAPE_H / 2,
      });
    } else {
      shapeEl = el("rect", { width: SHAPE_W, height: SHAPE_H, rx: 6, ry: 6 });
    }
    shapeEl.setAttribute("fill", def.color);
    shapeEl.setAttribute("stroke", def.stroke);
    shapeEl.setAttribute("stroke-width", "2");
    shapeEl.classList.add("shape-bg", `shape-${shapeType}`);
    return shapeEl;
  }

  function renderShape(shape) {
    const g = el("g", {
      class: `card-node shape-node shape-${shape.shapeType}`,
      transform: `translate(${shape.x},${shape.y})`,
      "data-uid": shape.uid,
    });
    g.appendChild(createShapeEl(shape.shapeType));

    // 라벨 (가운데 정렬, 한 줄 또는 두 줄)
    const lines = wrapLabel(shape.label, 14);
    const lineHeight = 16;
    const startY = SHAPE_H / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const t = el("text", {
        class: "card-label shape-label",
        x: SHAPE_W / 2,
        y: startY + i * lineHeight,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      t.textContent = line;
      g.appendChild(t);
    });

    g.addEventListener("mousedown", (e) => onShapeMouseDown(e, shape.uid));
    g.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (window.Labels) window.Labels.startEdit(shape.uid);
    });
    getLayer().appendChild(g);
  }

  // 라벨이 너무 길면 자동 줄바꿈 (단어 단위 또는 길이 단위)
  function wrapLabel(label, maxLen) {
    if (!label) return [""];
    const text = String(label);
    if (text.length <= maxLen) return [text];
    // 공백 단위 줄바꿈 우선
    const words = text.split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= maxLen) {
        cur = (cur + " " + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    // 너무 많으면 2줄까지만
    if (lines.length > 2) {
      const truncated = lines.slice(0, 2);
      truncated[1] = truncated[1].slice(0, maxLen - 1) + "…";
      return truncated;
    }
    return lines;
  }

  function findNode(uid) {
    return getLayer().querySelector(`[data-uid="${uid}"]`);
  }

  function onShapeMouseDown(e, uid) {
    e.stopPropagation();
    if (state.connectMode) {
      handleConnectClick(uid);
      return;
    }
    selectShape(uid);
    const shape = state.shapes.find((c) => c.uid === uid);
    const p = svgPoint(e);
    state.drag = {
      uid,
      offsetX: p.x - shape.x,
      offsetY: p.y - shape.y,
      moved: false,
    };
    document.body.style.userSelect = "none";
  }

  function onMouseMove(e) {
    if (!state.drag) return;
    const shape = state.shapes.find((c) => c.uid === state.drag.uid);
    if (!shape) return;
    const p = svgPoint(e);
    shape.x = p.x - state.drag.offsetX;
    shape.y = p.y - state.drag.offsetY;
    const node = findNode(shape.uid);
    if (node) {
      node.setAttribute("transform", `translate(${shape.x},${shape.y})`);
      node.classList.add("dragging");
    }
    state.drag.moved = true;
    if (window.Arrows) window.Arrows.refreshFor(shape.uid);
  }

  function onMouseUp() {
    if (state.drag) {
      const node = findNode(state.drag.uid);
      if (node) node.classList.remove("dragging");
      state.drag = null;
      document.body.style.userSelect = "";
    }
  }

  function selectShape(uid) {
    state.selectedUid = uid;
    getLayer().querySelectorAll(".card-node").forEach((n) => n.classList.remove("selected"));
    const node = findNode(uid);
    if (node) node.classList.add("selected");
  }

  function deselectAll() {
    state.selectedUid = null;
    getLayer().querySelectorAll(".card-node").forEach((n) => n.classList.remove("selected"));
  }

  function removeShape(uid) {
    state.shapes = state.shapes.filter((c) => c.uid !== uid);
    const node = findNode(uid);
    if (node) node.remove();
    if (window.Arrows) window.Arrows.removeByCard(uid);
    if (state.selectedUid === uid) state.selectedUid = null;
    onChanged();
  }

  function clearAll() {
    state.shapes = [];
    state.arrows = [];
    state.selectedUid = null;
    state.connectSource = null;
    getLayer().innerHTML = "";
    if (window.Arrows) window.Arrows.clear();
    onChanged();
  }

  function setConnectMode(on) {
    state.connectMode = on;
    state.connectSource = null;
    document.body.classList.toggle("connect-mode", on);
    getLayer().querySelectorAll(".connect-source").forEach((n) => n.classList.remove("connect-source"));
    const btn = document.getElementById("connect-mode-btn");
    if (btn) btn.classList.toggle("on", on);
  }

  function handleConnectClick(uid) {
    if (state.connectSource == null) {
      state.connectSource = uid;
      const node = findNode(uid);
      if (node) node.classList.add("connect-source");
      return;
    }
    if (state.connectSource === uid) {
      state.connectSource = null;
      const node = findNode(uid);
      if (node) node.classList.remove("connect-source");
      return;
    }
    if (window.Arrows) window.Arrows.add(state.connectSource, uid);
    const srcNode = findNode(state.connectSource);
    if (srcNode) srcNode.classList.remove("connect-source");
    state.connectSource = null;
  }

  function updateShapeLabel(uid, newLabel) {
    const shape = state.shapes.find((c) => c.uid === uid);
    if (!shape) return;
    shape.label = newLabel;
    const node = findNode(uid);
    if (!node) return;
    // 기존 라벨 모두 제거 후 다시 그리기
    node.querySelectorAll(".shape-label").forEach((t) => t.remove());
    const lines = wrapLabel(newLabel, 14);
    const lineHeight = 16;
    const startY = SHAPE_H / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const t = el("text", {
        class: "card-label shape-label",
        x: SHAPE_W / 2,
        y: startY + i * lineHeight,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      t.textContent = line;
      node.appendChild(t);
    });
    onChanged();  // Mermaid 패널 갱신
  }

  function onChanged() {
    const hint = document.getElementById("canvas-empty-hint");
    if (hint) hint.classList.toggle("hidden", state.shapes.length > 0);
    if (window.Stats) window.Stats.refresh();
    if (window.MermaidExport) window.MermaidExport.updatePanel();
  }

  function getShapePos(uid) {
    const shape = state.shapes.find((c) => c.uid === uid);
    if (!shape) return null;
    return { x: shape.x + SHAPE_W / 2, y: shape.y + SHAPE_H / 2 };
  }

  function getShapeBox(uid) {
    const shape = state.shapes.find((c) => c.uid === uid);
    if (!shape) return null;
    return { x: shape.x, y: shape.y, w: SHAPE_W, h: SHAPE_H };
  }

  function getState() {
    return {
      shapes: state.shapes.map((c) => ({ ...c })),
      arrows: window.Arrows ? window.Arrows.getState() : [],
    };
  }

  function init() {
    const svg = getSvg();
    svg.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("mousedown", (e) => {
      if (e.target === svg) deselectAll();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedUid != null) {
        if (document.activeElement && document.activeElement.tagName === "INPUT") return;
        removeShape(state.selectedUid);
      }
      if (e.key === "Escape") {
        if (state.connectMode) setConnectMode(false);
        deselectAll();
      }
    });
  }

  // 호환 alias (다른 파일에서 addCard 호출하던 곳)
  window.Canvas = {
    init,
    addShape,
    addCard: addShape,           // 호환
    removeShape,
    removeCard: removeShape,     // 호환
    clearAll,
    selectShape,
    selectCard: selectShape,     // 호환
    setConnectMode,
    updateShapeLabel,
    updateCardLabel: updateShapeLabel,  // 호환 (labels.js가 호출)
    getShapePos,
    getCardPos: getShapePos,     // 호환 (arrows.js가 호출)
    getShapeBox,
    getCardBox: getShapeBox,     // 호환
    getState,
    onChanged,
    get connectMode() { return state.connectMode; },
    get shapes() { return state.shapes; },
    get cards() { return state.shapes; },  // 호환
    SHAPE_W,
    SHAPE_H,
    CARD_W: SHAPE_W,
    CARD_H: SHAPE_H,
  };
})();
