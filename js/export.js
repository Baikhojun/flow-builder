// 이 파일의 역할: SVG → PNG 변환 + 한글 폰트(Yooshin) 임베드 + 다운로드
// FlowBuilder 버전 (도형 4종 SVG 합성)

(function () {
  const SHAPE_W = 140, SHAPE_H = 72;
  const fontCache = { medium: null, bold: null };

  async function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  async function loadFonts() {
    if (fontCache.medium && fontCache.bold) return;
    try {
      const [m, b] = await Promise.all([
        fetch("assets/fonts/Yooshin-Medium.ttf").then((r) => r.blob()),
        fetch("assets/fonts/Yooshin-Bold.ttf").then((r) => r.blob()),
      ]);
      fontCache.medium = await blobToBase64(m);
      fontCache.bold = await blobToBase64(b);
    } catch (e) {
      console.warn("폰트 로드 실패 (시스템 폰트로 fallback):", e);
    }
  }

  function fontFaceCss() {
    if (!fontCache.medium || !fontCache.bold) return "";
    return `
      @font-face { font-family: "Yooshin"; font-weight: 400; src: url(data:font/ttf;base64,${fontCache.medium}) format("truetype"); }
      @font-face { font-family: "Yooshin"; font-weight: 700; src: url(data:font/ttf;base64,${fontCache.bold}) format("truetype"); }
    `;
  }

  function escapeXml(s) {
    return String(s || "").replace(/[<>&"']/g, (c) => ({
      "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"
    }[c]));
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

  function buildShape(c) {
    const def = (window.SHAPE_TYPES || []).find(s => s.id === c.shapeType) || { color: "#fff", stroke: "#888" };
    if (c.shapeType === "rect") {
      return `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="6" ry="6" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
    } else if (c.shapeType === "round") {
      return `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="${SHAPE_H/2}" ry="${SHAPE_H/2}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
    } else if (c.shapeType === "diamond") {
      const cx = SHAPE_W/2, cy = SHAPE_H/2;
      const points = `${cx},0 ${SHAPE_W},${cy} ${cx},${SHAPE_H} 0,${cy}`;
      return `<polygon points="${points}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
    } else if (c.shapeType === "circle") {
      return `<ellipse cx="${SHAPE_W/2}" cy="${SHAPE_H/2}" rx="${SHAPE_W/2}" ry="${SHAPE_H/2}" fill="${def.color}" stroke="${def.stroke}" stroke-width="2"/>`;
    }
    return `<rect width="${SHAPE_W}" height="${SHAPE_H}" rx="6" ry="6" fill="#fff" stroke="#888" stroke-width="2"/>`;
  }

  function buildSvgForExport(snapshot, opts = {}) {
    const shapes = snapshot.shapes || snapshot.cards || [];
    const arrows = snapshot.arrows || [];
    if (shapes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#f8fafc"/><text x="300" y="200" text-anchor="middle" font-size="20" fill="#999">(빈 흐름도)</text></svg>`;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + SHAPE_W);
      maxY = Math.max(maxY, c.y + SHAPE_H);
    });
    const pad = 40;
    const vbX = minX - pad, vbY = minY - pad - 30;
    const vbW = (maxX - minX) + pad * 2;
    const vbH = (maxY - minY) + pad * 2 + 60;

    const arrowsSvg = arrows.map((a) => {
      const from = shapes.find((c) => c.uid === a.fromUid);
      const to = shapes.find((c) => c.uid === a.toUid);
      if (!from || !to) return "";
      const fc = { x: from.x + SHAPE_W/2, y: from.y + SHAPE_H/2 };
      const tc = { x: to.x + SHAPE_W/2, y: to.y + SHAPE_H/2 };
      const s = edge(fc, tc, { w: SHAPE_W, h: SHAPE_H });
      const e = edge(tc, fc, { w: SHAPE_W, h: SHAPE_H });
      const midX = (s.x + e.x)/2, midY = (s.y + e.y)/2 - 8;
      const lbl = a.label ? `<text x="${midX}" y="${midY}" text-anchor="middle" font-size="12" fill="#475569" font-family="Yooshin, sans-serif">${escapeXml(a.label)}</text>` : "";
      return `<path d="M${s.x},${s.y} L${e.x},${e.y}" fill="none" stroke="#475569" stroke-width="2.5" marker-end="url(#ex-arrow)"/>${lbl}`;
    }).join("");

    const shapesSvg = shapes.map((c) => `
      <g transform="translate(${c.x},${c.y})">
        ${buildShape(c)}
        <text x="${SHAPE_W/2}" y="${SHAPE_H/2}" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#1e293b" font-family="Yooshin, sans-serif" font-weight="700">${escapeXml((c.label || "").slice(0, 18))}</text>
      </g>
    `).join("");

    const title = opts.title || `🎨 ${snapshot.nickname || "익명"}의 업무 흐름도`;
    const subtitle = opts.subtitle || `made with FlowBuilder · ${(arrows.length || 0)}개 연결 · ${shapes.length}개 도형`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${Math.max(800, vbW)}" height="${Math.max(600, vbH)}">
      <defs>
        <style>${fontFaceCss()}</style>
        <marker id="ex-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#475569"/>
        </marker>
      </defs>
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#f8fafc"/>
      <text x="${vbX + 20}" y="${vbY + 28}" font-family="Yooshin, sans-serif" font-weight="700" font-size="20" fill="#475569">${escapeXml(title)}</text>
      ${arrowsSvg}
      ${shapesSvg}
      <text x="${vbX + vbW - 20}" y="${vbY + vbH - 14}" text-anchor="end" font-family="Yooshin, sans-serif" font-size="11" fill="#94a3b8">${escapeXml(subtitle)}</text>
    </svg>`;
  }

  async function svgToPng(svgStr, filename, scale = 2) {
    await loadFonts();
    const finalSvg = svgStr.includes("@font-face") ? svgStr : svgStr.replace("<defs>", `<defs><style>${fontFaceCss()}</style>`);
    const blob = new Blob([finalSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;
        const canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return reject(new Error("PNG 변환 실패"));
          downloadBlob(pngBlob, filename);
          resolve();
        }, "image/png");
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(s) {
    return String(s).replace(/[\/\\:*?"<>|]/g, "_");
  }

  async function currentToPng() {
    const nickname = window.Game ? window.Game.getNickname() : "익명";
    const state = window.Canvas.getState();
    const snapshot = { nickname, shapes: state.shapes, arrows: state.arrows };
    const svg = buildSvgForExport(snapshot);
    const filename = `흐름도_${safeFilename(nickname)}_${Date.now()}.png`;
    try {
      await svgToPng(svg, filename);
      if (window.Notify) window.Notify("💾 PNG로 저장했어요!");
    } catch (e) {
      console.error(e);
      if (window.Notify) window.Notify("⚠ PNG 변환 실패. 콘솔을 확인하세요.");
    }
  }

  async function snapshotToPng(snapshot, filename) {
    const svg = buildSvgForExport(snapshot);
    try {
      await svgToPng(svg, filename || `흐름도_${safeFilename(snapshot.nickname)}.png`);
      if (window.Notify) window.Notify("💾 PNG로 저장했어요!");
    } catch (e) {
      console.error(e);
      if (window.Notify) window.Notify("⚠ PNG 변환 실패");
    }
  }

  window.Export = { currentToPng, snapshotToPng, loadFonts };
})();
