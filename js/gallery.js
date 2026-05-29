// 이 파일의 역할: 완성된 흐름도를 localStorage에 저장하고 갤러리/비교 모달로 보여주기

(function () {
  const STORAGE_KEY = "flow-builder.gallery.v1";
  const MAX_ITEMS = 30;
  const SHAPE_W = 140, SHAPE_H = 72;

  const ui = {
    modal: null,
    content: null,
    mode: "grid",
    compareSlots: [null, null],
  };

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Gallery load failed:", e);
      return [];
    }
  }

  function saveAll(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Gallery save failed:", e);
      if (window.Notify) window.Notify("⚠ 저장 공간 부족 — 오래된 작품을 정리하세요.");
    }
  }

  function save(snapshot) {
    const items = loadAll();
    const entry = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      nickname: snapshot.nickname || "익명",
      shapes: snapshot.shapes || snapshot.cards || [],
      arrows: snapshot.arrows || [],
      mermaid: snapshot.mermaid || "",
      createdAt: new Date().toISOString(),
    };
    items.unshift(entry);
    while (items.length > MAX_ITEMS) items.pop();
    saveAll(items);
    if (window.Stats) window.Stats.refreshGalleryCount();
    return entry;
  }

  function remove(id) {
    let items = loadAll();
    items = items.filter((it) => it.id !== id);
    saveAll(items);
    if (window.Stats) window.Stats.refreshGalleryCount();
    if (ui.modal && !ui.modal.classList.contains("hidden")) render();
  }

  function clear() {
    if (!confirm("갤러리의 모든 흐름도를 삭제할까요?")) return;
    saveAll([]);
    if (window.Stats) window.Stats.refreshGalleryCount();
    render();
  }

  function count() { return loadAll().length; }

  // 도형 SVG 미리보기
  function buildPreviewSvg(item) {
    const shapes = item.shapes || item.cards || [];
    if (shapes.length === 0) {
      return `<svg viewBox="0 0 400 300"><text x="200" y="150" text-anchor="middle" fill="#999">(빈 흐름도)</text></svg>`;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + SHAPE_W);
      maxY = Math.max(maxY, c.y + SHAPE_H);
    });
    const pad = 30;
    const vbX = minX - pad, vbY = minY - pad;
    const vbW = (maxX - minX) + pad * 2;
    const vbH = (maxY - minY) + pad * 2;

    const arrowsSvg = (item.arrows || []).map((a) => {
      const from = shapes.find((c) => c.uid === a.fromUid);
      const to = shapes.find((c) => c.uid === a.toUid);
      if (!from || !to) return "";
      const fc = { x: from.x + SHAPE_W / 2, y: from.y + SHAPE_H / 2 };
      const tc = { x: to.x + SHAPE_W / 2, y: to.y + SHAPE_H / 2 };
      const start = edge(fc, tc, { w: SHAPE_W, h: SHAPE_H });
      const end = edge(tc, fc, { w: SHAPE_W, h: SHAPE_H });
      const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2 - 6;
      const lbl = a.label ? `<text x="${midX}" y="${midY}" text-anchor="middle" font-size="11" fill="#475569">${escapeXml(a.label)}</text>` : "";
      return `<path d="M${start.x},${start.y} L${end.x},${end.y}" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#ph-arrow)"/>${lbl}`;
    }).join("");

    const shapesSvg = shapes.map((c) => {
      const def = (window.SHAPE_TYPES || []).find(s => s.id === c.shapeType) || { color: "#fff", stroke: "#e2e8f0" };
      let shapeEl = "";
      if (c.shapeType === "rect") {
        shapeEl = `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="6" ry="6" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
      } else if (c.shapeType === "round") {
        shapeEl = `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="${SHAPE_H/2}" ry="${SHAPE_H/2}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
      } else if (c.shapeType === "diamond") {
        const cx = SHAPE_W/2, cy = SHAPE_H/2;
        const points = `${cx},0 ${SHAPE_W},${cy} ${cx},${SHAPE_H} 0,${cy}`;
        shapeEl = `<polygon points="${points}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
      } else if (c.shapeType === "circle") {
        shapeEl = `<ellipse cx="${SHAPE_W/2}" cy="${SHAPE_H/2}" rx="${SHAPE_W/2}" ry="${SHAPE_H/2}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
      } else {
        shapeEl = `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="6" ry="6" fill="#fff" stroke="#ccc" stroke-width="2"/>`;
      }
      return `
        <g transform="translate(${c.x},${c.y})">
          ${shapeEl}
          <text x="${SHAPE_W/2}" y="${SHAPE_H/2}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="#1e293b">${escapeXml((c.label || "").slice(0, 14))}</text>
        </g>
      `;
    }).join("");

    return `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="ph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#475569"/>
        </marker>
      </defs>
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#f8fafc" opacity="0.5"/>
      ${arrowsSvg}
      ${shapesSvg}
    </svg>`;
  }

  function edge(center, target, box) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    if (dx === 0 && dy === 0) return center;
    const tx = box.w/2 / Math.abs(dx || 1);
    const ty = box.h/2 / Math.abs(dy || 1);
    const t = Math.min(tx, ty);
    return { x: center.x + dx * t, y: center.y + dy * t };
  }

  function escapeXml(s) {
    return String(s || "").replace(/[<>&"']/g, (c) => ({
      "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"
    }[c]));
  }

  function open() {
    if (!ui.modal) ui.modal = document.getElementById("gallery-modal");
    if (!ui.content) ui.content = document.getElementById("gallery-content");
    ui.modal.classList.remove("hidden");
    ui.mode = "grid";
    ui.compareSlots = [null, null];
    setActiveModeBtn();
    render();
  }

  function close() {
    if (ui.modal) ui.modal.classList.add("hidden");
  }

  function setActiveModeBtn() {
    const g = document.getElementById("gallery-mode-grid");
    const c = document.getElementById("gallery-mode-compare");
    if (g) g.classList.toggle("active", ui.mode === "grid");
    if (c) c.classList.toggle("active", ui.mode === "compare");
  }

  function render() {
    const items = loadAll();
    if (items.length === 0) {
      ui.content.innerHTML = `<div class="gallery-empty">아직 저장된 흐름도가 없어요.<br/><br/>캔버스에서 흐름도를 완성한 뒤 <b>✅ 완성!</b> 버튼을 눌러 추가하세요.</div>`;
      return;
    }
    if (ui.mode === "grid") renderGrid(items);
    else renderCompare(items);
  }

  function renderGrid(items) {
    ui.content.innerHTML = `<div class="gallery-grid">${items.map((it) => itemHtml(it)).join("")}</div>`;
    bindItemActions();
  }

  function bindItemActions() {
    ui.content.querySelectorAll("[data-act]").forEach((btn) => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener("click", () => handleItemAction(id, act));
    });
  }

  function itemHtml(it) {
    const date = new Date(it.createdAt);
    const dateStr = `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
    const shapes = it.shapes || it.cards || [];
    return `
      <div class="gallery-item" data-id="${it.id}">
        <div class="gallery-item-preview">${buildPreviewSvg(it)}</div>
        <div class="gallery-item-meta">
          <div class="name">${escapeXml(it.nickname)}</div>
          <div class="small">도형 ${shapes.length} · 연결 ${(it.arrows||[]).length} · ${dateStr}</div>
        </div>
        <div class="gallery-item-actions">
          <button data-act="copy" data-id="${it.id}">📋 코드</button>
          <button data-act="png" data-id="${it.id}">💾 PNG</button>
          <button data-act="compare" data-id="${it.id}">⚖ 비교</button>
          <button data-act="delete" data-id="${it.id}">🗑</button>
        </div>
      </div>
    `;
  }

  function handleItemAction(id, act) {
    const item = loadAll().find((it) => it.id === id);
    if (!item) return;
    if (act === "png") {
      if (window.Export && window.Export.snapshotToPng) {
        window.Export.snapshotToPng(item, `흐름도_${item.nickname}_${id}.png`);
      }
    } else if (act === "copy") {
      navigator.clipboard.writeText(item.mermaid || "").then(() => {
        if (window.Notify) window.Notify("📋 Mermaid 코드 복사 완료", 1800);
      });
    } else if (act === "delete") {
      if (confirm(`${item.nickname} 흐름도를 삭제할까요?`)) remove(id);
    } else if (act === "compare") {
      pushToCompare(item);
    }
  }

  function pushToCompare(item) {
    if (ui.compareSlots[0] && ui.compareSlots[0].id === item.id) { ui.compareSlots[0] = null; }
    else if (ui.compareSlots[1] && ui.compareSlots[1].id === item.id) { ui.compareSlots[1] = null; }
    else if (!ui.compareSlots[0]) ui.compareSlots[0] = item;
    else if (!ui.compareSlots[1]) ui.compareSlots[1] = item;
    else ui.compareSlots = [item, ui.compareSlots[0]];
    ui.mode = "compare";
    setActiveModeBtn();
    render();
  }

  function renderCompare(items) {
    const [a, b] = ui.compareSlots;
    const slotHtml = (slot, idx) => {
      if (!slot) return `<div class="compare-slot"><h4>슬롯 ${idx+1}</h4><p style="color:#7a6850;font-size:13px;margin-top:14px;">아래에서 <b>⚖ 비교</b>를 눌러 채우세요.</p></div>`;
      const sh = slot.shapes || slot.cards || [];
      return `<div class="compare-slot filled"><h4>${escapeXml(slot.nickname)} (도형 ${sh.length} · 연결 ${(slot.arrows||[]).length})</h4><div class="gallery-item-preview">${buildPreviewSvg(slot)}</div></div>`;
    };
    const insight = (a && b) ? buildInsight(a, b) : `<div class="compare-insight">두 흐름도를 선택하면 차이가 한눈에 보입니다.</div>`;
    const allItems = items.map((it) => itemHtml(it)).join("");
    ui.content.innerHTML = `
      <div class="gallery-compare">${slotHtml(a, 0)}${slotHtml(b, 1)}${insight}</div>
      <h3 style="margin:18px 0 10px;color:#475569;">📚 전체 흐름도</h3>
      <div class="gallery-grid">${allItems}</div>
    `;
    bindItemActions();
  }

  function buildInsight(a, b) {
    const sA = a.shapes || a.cards || [];
    const sB = b.shapes || b.cards || [];
    const diffCount = Math.abs(sA.length - sB.length);
    const bigger = sA.length > sB.length ? a.nickname : b.nickname;

    const aShapes = shapeTypeCount(sA);
    const bShapes = shapeTypeCount(sB);

    const lines = [
      `📊 도형 수 차이 <b>${diffCount}개</b>${diffCount ? ` — ${escapeXml(bigger)}이(가) 더 자세하게 그렸어요` : ""}`,
      `<b>${escapeXml(a.nickname)}</b>: ▭${aShapes.rect} ▢${aShapes.round} ◇${aShapes.diamond} ⬭${aShapes.circle} · 연결 ${(a.arrows||[]).length}`,
      `<b>${escapeXml(b.nickname)}</b>: ▭${bShapes.rect} ▢${bShapes.round} ◇${bShapes.diamond} ⬭${bShapes.circle} · 연결 ${(b.arrows||[]).length}`,
    ];
    if (aShapes.diamond > 0 && bShapes.diamond === 0) {
      lines.push(`🌿 <b>${escapeXml(a.nickname)}</b>은(는) 분기(◇)를 ${aShapes.diamond}개 사용 — 더 정교한 흐름`);
    } else if (bShapes.diamond > 0 && aShapes.diamond === 0) {
      lines.push(`🌿 <b>${escapeXml(b.nickname)}</b>은(는) 분기(◇)를 ${bShapes.diamond}개 사용 — 더 정교한 흐름`);
    }
    return `<div class="compare-insight">${lines.join("<br/>")}</div>`;
  }

  function shapeTypeCount(shapes) {
    return {
      rect: shapes.filter(s => s.shapeType === "rect").length,
      round: shapes.filter(s => s.shapeType === "round").length,
      diamond: shapes.filter(s => s.shapeType === "diamond").length,
      circle: shapes.filter(s => s.shapeType === "circle").length,
    };
  }

  function init() {
    const closeBtn = document.getElementById("gallery-close");
    const gridBtn = document.getElementById("gallery-mode-grid");
    const compareBtn = document.getElementById("gallery-mode-compare");
    const clearBtn = document.getElementById("gallery-clear");
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (gridBtn) gridBtn.addEventListener("click", () => { ui.mode = "grid"; setActiveModeBtn(); render(); });
    if (compareBtn) compareBtn.addEventListener("click", () => { ui.mode = "compare"; setActiveModeBtn(); render(); });
    if (clearBtn) clearBtn.addEventListener("click", clear);
  }

  window.Gallery = { init, open, close, save, remove, clear, count, loadAll, buildPreviewSvg };
})();
