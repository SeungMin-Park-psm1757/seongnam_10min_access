"use client";

import { useState } from "react";
import type { AreaMetric } from "@/lib/data";

type MetricKey = "medical_score" | "pharmacy_score" | "transit_score" | "care_score";

type WeightScenario = {
  id: string;
  label: string;
  description: string;
  weights: Record<MetricKey, number>;
};

const scenarios: WeightScenario[] = [
  {
    id: "balanced",
    label: "균형",
    description: "네 서비스를 같은 비중으로 놓고 기본 생활서비스 접근성을 봅니다.",
    weights: { medical_score: 0.25, pharmacy_score: 0.25, transit_score: 0.25, care_score: 0.25 },
  },
  {
    id: "medical",
    label: "의료 중심",
    description: "건강 안전망과 응급성을 더 크게 반영한 관점입니다.",
    weights: { medical_score: 0.4, pharmacy_score: 0.2, transit_score: 0.25, care_score: 0.15 },
  },
  {
    id: "care",
    label: "돌봄 중심",
    description: "고령·복지 수요를 더 크게 반영한 관점입니다.",
    weights: { medical_score: 0.25, pharmacy_score: 0.15, transit_score: 0.2, care_score: 0.4 },
  },
];

function weightedScore(area: AreaMetric, weights: Record<MetricKey, number>) {
  return Object.entries(weights).reduce((sum, [key, weight]) => sum + Number(area[key as MetricKey]) * weight, 0);
}

function riskScore(area: AreaMetric, weights: Record<MetricKey, number>) {
  return (100 - weightedScore(area, weights)) * 0.58 + area.vulnerable_index * 0.42;
}

export function SensitivityToggle({ areas }: { areas: AreaMetric[] }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const selected = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
  const ranked = [...areas].sort((a, b) => riskScore(b, selected.weights) - riskScore(a, selected.weights)).slice(0, 3);
  const defaultTop = [...areas].sort((a, b) => b.vulnerable_index - a.vulnerable_index).slice(0, 3);
  const overlap = ranked.filter((area) => defaultTop.some((base) => base.area_id === area.area_id)).length;
  const stability = overlap >= 2
    ? "상위 생활권이 크게 바뀌지 않습니다. 우선 점검 판단은 비교적 안정적입니다."
    : "관점에 따라 상위 생활권이 달라집니다. 이 경우 정책 목표를 먼저 정해야 합니다.";

  return (
    <section className="sensitivityCard" aria-label="가중치 민감도 분석">
      <div>
        <p className="eyebrow">민감도</p>
        <h3>가중치를 바꿔도 같은 생활권이 보이는가?</h3>
      </div>
      <div className="scenarioTabs">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={scenario.id === scenarioId ? "active" : ""}
            onClick={() => setScenarioId(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </div>
      <p>{selected.description}</p>
      <ol className="miniRank">
        {ranked.map((area, index) => (
          <li key={area.area_id}>
            <span>{index + 1}</span>
            <strong>{area.area_name}</strong>
            <em>{Math.round(weightedScore(area, selected.weights))}점</em>
          </li>
        ))}
      </ol>
      <strong className="stabilityNote">{stability}</strong>
    </section>
  );
}
