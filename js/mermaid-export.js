// 이 파일의 역할: 캔버스의 도형·화살표 상태 → Mermaid flowchart 코드 자동 생성
// 우측 패널 실시간 미리보기 + [📋 코드 복사] + [🌐 mermaid.live 열기] 처리

(function () {
  // 라벨에 들어가면 Mermaid 파싱 오류 나는 문자 처리
  function sanitizeLabel(text) {
    if (!text) return "노드";
    return String(text)
      .replace(/"/g, "'")           // 큰따옴표 제거 (라벨 충돌)
      .replace(/\[\(/g, "(")        // 중첩 괄호 단순화
      .replace(/\)\]/g, ")")
      .replace(/\[/g, "(")          // 사각괄호 → 둥근괄호 (라벨 안)
      .replace(/\]/g, ")")
      .replace(/\{/g, "(")          // 중괄호 → 둥근괄호
      .replace(/\}/g, ")")
      .replace(/\|/g, "/")          // 파이프 → 슬래시 (화살표 라벨 충돌)
      .replace(/\n/g, " ")          // 개행 제거
      .trim() || "노드";
  }

  // 도형 ID는 N1, N2, N3 ... 자동 부여 (uid 기반)
  function nodeId(uid) {
    return "N" + uid;
  }

  // 도형 1개 → Mermaid 노드 정의
  function shapeToMermaid(shape) {
    const def = SHAPE_TYPES.find(s => s.id === shape.shapeType) || SHAPE_TYPES[0];
    const label = sanitizeLabel(shape.label);
    // Mermaid 라벨은 따옴표로 감싸면 한글 안전
    return `${nodeId(shape.uid)}${def.mermaidOpen}"${label}"${def.mermaidClose}`;
  }

  // 화살표 1개 → Mermaid 엣지
  function arrowToMermaid(arrow) {
    const lbl = arrow.label ? sanitizeLabel(arrow.label) : "";
    const arrow_str = lbl ? `-->|${lbl}|` : "-->";
    return `${nodeId(arrow.fromUid)} ${arrow_str} ${nodeId(arrow.toUid)}`;
  }

  // 전체 상태 → Mermaid flowchart 코드
  function generate() {
    if (!window.Canvas || !window.Canvas.getState) {
      return "flowchart TD\n    A[캔버스 비어 있음]";
    }
    const state = window.Canvas.getState();
    if (!state.shapes || state.shapes.length === 0) {
      return "flowchart TD\n    A[\"도형을 추가하면 여기에 코드가 생성됩니다\"]";
    }

    let code = "flowchart TD\n";

    // 도형 노드 정의
    state.shapes.forEach(s => {
      code += `    ${shapeToMermaid(s)}\n`;
    });

    code += "\n";

    // 화살표 엣지
    if (state.arrows && state.arrows.length > 0) {
      state.arrows.forEach(a => {
        code += `    ${arrowToMermaid(a)}\n`;
      });
    } else {
      code += "    %% 화살표를 추가하려면 🔗 연결모드 ON → 두 도형 클릭\n";
    }

    return code;
  }

  // 우측 패널 실시간 갱신
  function updatePanel() {
    const panel = document.getElementById("mermaid-code");
    if (!panel) return;
    panel.textContent = generate();
  }

  // 코드 복사
  async function copyCode() {
    const code = generate();
    try {
      await navigator.clipboard.writeText(code);
      if (window.Notify) window.Notify("📋 Mermaid 코드가 복사되었습니다!", 2000);
    } catch (e) {
      // 클립보드 API 실패 시 대체
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (window.Notify) window.Notify("📋 코드 복사 완료 (호환 모드)", 2000);
    }
  }

  // mermaid.live 열기 (코드 포함된 URL)
  function openMermaidLive() {
    const code = generate();
    // mermaid.live는 base64 압축된 URL 파라미터 사용. 단순히 클립보드 복사 + 새 탭 열기.
    copyCode();
    setTimeout(() => {
      window.open("https://mermaid.live/", "_blank");
      if (window.Notify) window.Notify("🌐 mermaid.live 열림. Ctrl+V 로 붙여넣기!", 3000);
    }, 300);
  }

  // .md 파일로 저장
  function saveMd() {
    const code = generate();
    const nick = (document.getElementById("player-name-display")?.textContent || "익명")
      .replace(/^👤\s*/, "");
    const date = new Date().toISOString().slice(0, 10);
    const content = `# ${nick}의 업무 흐름도\n\n작성: ${date}\n\n` +
      "```mermaid\n" + code + "```\n\n" +
      "> [mermaid.live](https://mermaid.live/)에 위 코드를 붙여넣으면 그림으로 볼 수 있습니다.\n";
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `흐름도_${nick}_${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.Notify) window.Notify("💾 .md 파일 다운로드 완료", 2000);
  }

  window.MermaidExport = {
    generate,
    updatePanel,
    copyCode,
    openMermaidLive,
    saveMd,
  };
})();
