// 이 파일의 역할: FlowBuilder 도형 4종 정의 + 부서별 빠른 라벨 풀
// (draw-toast의 cards-data.js 자리)

const SHAPE_TYPES = [
  {
    id: "rect",
    icon: "▭",
    label: "과정",
    desc: "일반 작업·처리",
    mermaidOpen: "[",
    mermaidClose: "]",
    color: "#e0f2fe",
    stroke: "#0284c7",
  },
  {
    id: "round",
    icon: "▢",
    label: "시작/끝",
    desc: "시작·종료·문서",
    mermaidOpen: "(",
    mermaidClose: ")",
    color: "#fef3c7",
    stroke: "#d97706",
  },
  {
    id: "diamond",
    icon: "◇",
    label: "판단",
    desc: "예/아니오 분기",
    mermaidOpen: "{",
    mermaidClose: "}",
    color: "#fce7f3",
    stroke: "#db2777",
  },
  {
    id: "circle",
    icon: "⬭",
    label: "데이터",
    desc: "결과물·산출물",
    mermaidOpen: "((",
    mermaidClose: "))",
    color: "#dcfce7",
    stroke: "#16a34a",
  },
];

// 부서별 빠른 라벨 풀 — 학생이 도형 추가 시 부서 탭에서 1클릭으로 라벨 입력 가능
const QUICK_LABELS = [
  {
    id: "accounting",
    label: "🏢 회계부",
    color: "#dbeafe",
    items: [
      { text: "거래내역 입력", shape: "round" },
      { text: "계정과목 판단", shape: "rect" },
      { text: "차변/대변 분개", shape: "rect" },
      { text: "부가세 대상?", shape: "diamond" },
      { text: "부가세 자동 분리", shape: "rect" },
      { text: "전표 양식 출력", shape: "circle" },
      { text: "회계 마감", shape: "round" },
    ],
  },
  {
    id: "planning",
    label: "🏢 기획실",
    color: "#ede9fe",
    items: [
      { text: "부서별 보고 수집", shape: "round" },
      { text: "성과/이슈 분류", shape: "rect" },
      { text: "부서별 요약", shape: "rect" },
      { text: "긴급 이슈?", shape: "diamond" },
      { text: "이슈 합계 계산", shape: "rect" },
      { text: "1페이지 요약", shape: "circle" },
      { text: "사장단 보고", shape: "round" },
    ],
  },
  {
    id: "hr",
    label: "🏢 총무부",
    color: "#fce7f3",
    items: [
      { text: "채용 정보 입력", shape: "round" },
      { text: "5섹션 구조 매핑", shape: "rect" },
      { text: "우대사항 있음?", shape: "diamond" },
      { text: "톤·문체 조정", shape: "rect" },
      { text: "제출서류 추가", shape: "rect" },
      { text: "채용공고 본문", shape: "circle" },
      { text: "사내 공지", shape: "round" },
    ],
  },
  {
    id: "business",
    label: "🏢 업무부",
    color: "#fef9c3",
    items: [
      { text: "사업 정보 입력", shape: "round" },
      { text: "항목별 소계", shape: "rect" },
      { text: "단가 빈칸?", shape: "diamond" },
      { text: "부가세 10%", shape: "rect" },
      { text: "총공사비 합산", shape: "rect" },
      { text: "견적서 양식", shape: "circle" },
      { text: "발주처 송부", shape: "round" },
    ],
  },
  {
    id: "common",
    label: "🌐 공통",
    color: "#f1f5f9",
    items: [
      { text: "입력 받기", shape: "round" },
      { text: "데이터 정리", shape: "rect" },
      { text: "AI 처리", shape: "rect" },
      { text: "조건 분기?", shape: "diamond" },
      { text: "결과 검증", shape: "rect" },
      { text: "결과 출력", shape: "circle" },
      { text: "완료", shape: "round" },
    ],
  },
];

window.SHAPE_TYPES = SHAPE_TYPES;
window.QUICK_LABELS = QUICK_LABELS;
