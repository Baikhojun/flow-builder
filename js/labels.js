// 이 파일의 역할: 도형 더블클릭 시 라벨 인라인 편집 (한글 IME 호환)

(function () {
  let activeInput = null;

  function startEdit(uid) {
    if (activeInput) return;
    const node = document.querySelector(`#cards-layer [data-uid="${uid}"]`);
    if (!node) return;
    const shape = (window.Canvas.shapes || window.Canvas.cards).find((c) => c.uid === uid);
    if (!shape) return;

    const rect = node.getBoundingClientRect();
    const input = document.createElement("input");
    input.type = "text";
    input.value = shape.label;
    input.maxLength = 30;
    input.className = "label-editor";
    // 도형 중앙에 위치
    input.style.left = rect.left + "px";
    input.style.top = (rect.top + rect.height / 2 - 16) + "px";
    input.style.width = rect.width + "px";
    input.style.textAlign = "center";

    let composing = false;
    let cancelled = false;

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
        if (v.length > 0) window.Canvas.updateShapeLabel(uid, v);
      }
      input.remove();
      activeInput = null;
    });

    document.body.appendChild(input);
    activeInput = input;
    input.focus();
    input.select();
  }

  window.Labels = { startEdit };
})();
