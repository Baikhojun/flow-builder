// 이 파일의 역할: 좌측 도형 4종 팔레트 + 부서별 빠른 라벨 탭

(function () {
  const state = { activeDept: "common" };

  // 1. 도형 4종 (상단)
  function renderShapeGrid() {
    const grid = document.getElementById("shape-grid");
    if (!grid) return;
    grid.innerHTML = "";
    window.SHAPE_TYPES.forEach((shape) => {
      const el = document.createElement("button");
      el.className = `palette-shape shape-${shape.id}`;
      el.title = shape.desc;
      el.innerHTML = `
        <span class="shape-icon">${shape.icon}</span>
        <span class="shape-name">${shape.label}</span>
        <span class="shape-desc">${shape.desc}</span>
      `;
      el.style.borderColor = shape.stroke;
      el.style.background = shape.color;
      el.addEventListener("click", () => {
        if (window.Canvas) window.Canvas.addShape(shape.id);
      });
      grid.appendChild(el);
    });
  }

  // 2. 부서별 탭 (중단)
  function renderTabs() {
    const wrap = document.getElementById("palette-tabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    window.QUICK_LABELS.forEach((dept) => {
      const btn = document.createElement("button");
      btn.className = "palette-tab" + (dept.id === state.activeDept ? " active" : "");
      btn.textContent = dept.label;
      btn.dataset.dept = dept.id;
      btn.addEventListener("click", () => switchDept(dept.id));
      wrap.appendChild(btn);
    });
  }

  // 3. 부서별 빠른 라벨 그리드 (하단)
  function renderGrid() {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const dept = window.QUICK_LABELS.find((d) => d.id === state.activeDept);
    if (!dept) return;
    dept.items.forEach((item) => {
      const shapeDef = window.SHAPE_TYPES.find(s => s.id === item.shape) || window.SHAPE_TYPES[0];
      const el = document.createElement("button");
      el.className = "palette-quick-label";
      el.title = `${shapeDef.label} (${shapeDef.desc})`;
      el.innerHTML = `
        <span class="ql-icon">${shapeDef.icon}</span>
        <span class="ql-text">${item.text}</span>
      `;
      el.style.borderLeftColor = shapeDef.stroke;
      el.addEventListener("click", () => {
        if (window.Canvas) {
          window.Canvas.addShape(item.shape, { label: item.text });
        }
      });
      grid.appendChild(el);
    });
  }

  function switchDept(deptId) {
    state.activeDept = deptId;
    renderTabs();
    renderGrid();
  }

  function init() {
    renderShapeGrid();
    renderTabs();
    renderGrid();
  }

  window.Palette = { init };
})();
