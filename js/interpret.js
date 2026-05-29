// 이 파일의 역할: 완성 시 자동 진단 — flowchart로서의 자동화 적합도 평가
// (draw-toast의 8타입 진단 자리. FlowBuilder는 5기준 자동화 적합도로 변경)

(function () {
  function analyze() {
    if (!window.Canvas || !window.Canvas.getState) return null;
    const state = window.Canvas.getState();
    const shapes = state.shapes || [];
    const arrows = state.arrows || [];

    if (shapes.length === 0) {
      return {
        type: "empty",
        title: "아직 도형이 없어요",
        message: "도형 4종 중 하나를 클릭해 시작하세요.",
        score: 0,
        tips: [],
      };
    }

    let score = 0;
    const tips = [];
    const counts = {
      total: shapes.length,
      rect: shapes.filter(s => s.shapeType === "rect").length,
      round: shapes.filter(s => s.shapeType === "round").length,
      diamond: shapes.filter(s => s.shapeType === "diamond").length,
      circle: shapes.filter(s => s.shapeType === "circle").length,
      labeled: shapes.filter(s => s.label && s.label.trim() && s.label !== "텍스트 입력").length,
    };

    // ① 노드 수 적정 (5~8개)
    if (counts.total >= 5 && counts.total <= 8) {
      score += 2;
    } else if (counts.total >= 3 && counts.total <= 10) {
      score += 1;
      if (counts.total < 5) tips.push("💡 도형 5~8개를 권장합니다 (지금 " + counts.total + "개)");
      else tips.push("💡 도형 8개 이하를 권장합니다 (지금 " + counts.total + "개 — 일부 합쳐도 좋아요)");
    } else {
      tips.push("⚠ 도형 수가 너무 " + (counts.total < 3 ? "적음" : "많음") + " (권장: 5~8개)");
    }

    // ② 시작·끝 명확 (round ≥ 1)
    if (counts.round >= 1) {
      score += 2;
    } else {
      tips.push("💡 ▢ 시작/끝 도형을 1개 이상 넣으면 흐름이 더 명확해집니다");
    }

    // ③ 화살표 연결 (총 도형 수 - 1 이상)
    const minArrows = Math.max(1, counts.total - 1);
    if (arrows.length >= minArrows) {
      score += 2;
    } else if (arrows.length > 0) {
      score += 1;
      tips.push("💡 화살표 " + (minArrows - arrows.length) + "개 더 — 모든 도형이 흐름에 연결되어야 합니다");
    } else {
      tips.push("⚠ 화살표가 없습니다 — 🔗 연결모드로 도형을 이어보세요");
    }

    // ④ 판단 도형 비율
    const diamondRatio = counts.diamond / counts.total;
    if (diamondRatio <= 0.3) {
      score += 1;
    } else {
      tips.push("💡 판단 도형 ◇이 " + Math.round(diamondRatio * 100) + "% — 너무 많으면 흐름이 복잡해집니다");
    }

    // ⑤ 라벨 충실도
    const labelRatio = counts.labeled / counts.total;
    if (labelRatio >= 0.8) {
      score += 2;
    } else if (labelRatio >= 0.5) {
      score += 1;
      tips.push("💡 도형 " + (counts.total - counts.labeled) + "개에 텍스트를 입력해주세요 (더블클릭)");
    } else {
      tips.push("⚠ 빈 도형이 많습니다 — 텍스트를 추가하면 다음 단계 (Mermaid 코드 복사) 결과가 더 좋아집니다");
    }

    let grade, gradeIcon, title;
    if (score >= 8) {
      grade = "🥇 우수";
      gradeIcon = "🥇";
      title = "자동화 사양으로 바로 쓸 수 있는 흐름도예요!";
    } else if (score >= 6) {
      grade = "🥈 양호";
      gradeIcon = "🥈";
      title = "좋아요! 3교시 1차 프롬프트 작성 준비 완료";
    } else if (score >= 4) {
      grade = "🥉 통과";
      gradeIcon = "🥉";
      title = "흐름이 잡혔어요. 위 팁을 보고 다듬어 보세요";
    } else {
      grade = "🔄 다시";
      gradeIcon = "🔄";
      title = "조금 더 채워볼까요?";
    }

    return {
      type: "flowchart",
      title,
      grade,
      gradeIcon,
      score,
      maxScore: 9,
      counts,
      tips: tips.slice(0, 4),
    };
  }

  function render(analysis) {
    const box = document.getElementById("finish-interpretation");
    if (!box || !analysis) return;

    if (analysis.type === "empty") {
      box.innerHTML = `<p class="empty-hint">${analysis.message}</p>`;
      return;
    }

    let html = `
      <div class="interp-grade">
        <span class="interp-grade-icon">${analysis.gradeIcon}</span>
        <div>
          <div class="interp-grade-title">${analysis.title}</div>
          <div class="interp-grade-score">자동화 적합도: ${analysis.score}/${analysis.maxScore}</div>
        </div>
      </div>
      <div class="interp-counts">
        <span>▭ ${analysis.counts.rect}</span>
        <span>▢ ${analysis.counts.round}</span>
        <span>◇ ${analysis.counts.diamond}</span>
        <span>⬭ ${analysis.counts.circle}</span>
        <span>→ ${(window.Canvas.getState().arrows || []).length}</span>
      </div>
    `;

    if (analysis.tips.length > 0) {
      html += '<div class="interp-tips"><h4>💡 더 좋아지려면</h4><ul>';
      analysis.tips.forEach(tip => {
        html += `<li>${tip}</li>`;
      });
      html += "</ul></div>";
    }

    html += `<div class="interp-next">
      <p>📋 우측의 <b>Mermaid 코드</b>를 복사해서 mermaid.live에 붙여넣어 보세요.</p>
      <p class="small">3교시에는 이 흐름도를 보면서 <b>1차 MD 프롬프트</b>를 작성합니다.</p>
    </div>`;

    box.innerHTML = html;
  }

  function showFinish() {
    const analysis = analyze();
    render(analysis);

    const finishCode = document.getElementById("finish-mermaid-code");
    if (finishCode && window.MermaidExport) {
      finishCode.textContent = window.MermaidExport.generate();
    }
  }

  window.Interpret = { analyze, render, showFinish };
})();
