"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { AreaMetric } from "@/lib/data";

type NeedAccessExplorerProps = {
  areas: AreaMetric[];
  initialAreaId?: string;
  policyTypes: Record<string, string>;
  weakestServices: Record<string, string>;
  variant?: "v1" | "v2";
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const compactSelectionNotes: Record<string, string> = {
  D001: "고령·1인가구 높음",
  D002: "1인가구·교통의존 높음",
  D003: "북부 경계권 편차 확인",
  D004: "수요 높고 접근 낮음",
  D005: "의료·돌봄 편차 확인",
  D006: "교통·돌봄 보완 필요",
  D007: "격차 비교 기준점",
  D008: "중간 수준 비교 표본",
  D009: "밀도·돌봄 편차 비교",
  D010: "돌봄·이동 접근 점검",
};

export function NeedAccessExplorer({ areas, initialAreaId, policyTypes, weakestServices, variant = "v1" }: NeedAccessExplorerProps) {
  const fallbackId = areas[0]?.area_id;
  const [selectedId, setSelectedId] = useState(initialAreaId ?? fallbackId);
  const selected = areas.find((area) => area.area_id === selectedId) ?? areas[0];
  const maxPopulation = Math.max(...areas.map((area) => area.population), 1);

  if (areas.length === 0 || !selected) {
    return (
      <div className="needAccessGrid">
        <div className="scatterPlot emptyChart">
          <strong>데이터 없음</strong>
          <span>동별 접근성 점수와 지원수요 지표가 필요합니다.</span>
        </div>
      </div>
    );
  }

  const compactSelectionNote = compactSelectionNotes[selected.area_id] ?? selected.selection_note;
  const isV2 = variant === "v2";
  const profileSummary = `${weakestServices[selected.area_id]} 접근을 먼저 확인할 생활권입니다.`;

  return (
    <div className={isV2 ? "needAccessGrid needAccessGridV2" : "needAccessGrid"}>
      <div
        className={isV2 ? "scatterPlot scatterPlotV2" : "scatterPlot"}
        role="img"
        tabIndex={0}
        aria-label="10분 접근 어려움과 지원수요를 비교한 산점도"
        aria-describedby="scatter-desc"
      >
        <p id="scatter-desc" className="srOnly">
          X축은 100에서 종합 접근권 점수를 뺀 값이고, Y축은 고령층, 1인가구, 돌봄수요를 결합한 지원수요입니다.
          원 크기는 인구 규모, 색상과 라벨은 정책 보완 유형을 뜻합니다.
        </p>
        <span className="axis x">{isV2 ? "X축: 접근이 어려울수록 →" : "X축: 10분 접근 어려움 = 100 - 종합 접근권"}</span>
        <span className="axis y">{isV2 ? "Y축: 지원수요가 높을수록 ↑" : "Y축: 지원수요 = 고령·1인가구·돌봄수요"}</span>
        {!isV2 && (
          <div className="scatterFormulaNote">
            원 크기: 인구 규모 · 색상: 정책 보완 유형
          </div>
        )}
        <div className="targetZone">
          <strong>우선 점검 구역</strong>
          <span>접근 낮음 · 수요 높음</span>
        </div>
        {areas.map((area) => {
          const accessGap = 100 - area.overall_score;
          const x = clamp(accessGap + (area.area_id.charCodeAt(3) % 5) - 2, 7, 93);
          const y = clamp(area.vulnerable_index + (area.area_id.charCodeAt(2) % 7) - 3, 8, 92);
          const isSelected = area.area_id === selected.area_id;
          const isPriority = policyTypes[area.area_id] === "복합 보완 필요형";
          const dotSize = clamp(30 + (area.population / maxPopulation) * 22, 34, 54);
          const shouldLabel = !isV2 || isSelected || isPriority || area.area_id === "D007";
          const title = [
            `${area.area_name}`,
            `종합 접근권 ${Math.round(area.overall_score)}점`,
            `10분 접근 어려움 ${Math.round(accessGap)}점`,
            `지원수요 ${area.vulnerable_index}점`,
            `의료 ${area.medical_score} · 약국 ${area.pharmacy_score} · 교통 ${area.transit_score} · 돌봄 ${area.care_score}`,
            `해석: ${weakestServices[area.area_id]} 접근을 우선 확인할 생활권입니다.`,
          ].join("\n");

          return (
            <button
              key={area.area_id}
              type="button"
              className={`scatterDot ${isSelected ? "selected" : ""} ${isPriority ? "priority" : ""} ${shouldLabel ? "" : "unlabeled"}`}
              data-policy={policyTypes[area.area_id]}
              style={{ left: `${x}%`, bottom: `${y}%`, "--dot-size": `${dotSize}px` } as CSSProperties}
              onClick={() => setSelectedId(area.area_id)}
              aria-pressed={isSelected}
              aria-label={`${area.area_name} 생활권 프로파일 보기`}
              title={title}
            >
              <span>{shouldLabel ? area.area_name : ""}</span>
            </button>
          );
        })}
      </div>

      <aside className={isV2 ? "profileCard profileCardV2" : "profileCard"}>
        {isV2 ? (
          <>
            <p className="eyebrow">선택 생활권</p>
            <div className="profileHero">
              <h3>{selected.area_name}</h3>
              <strong>{profileSummary}</strong>
              <span>{policyTypes[selected.area_id]}</span>
            </div>
            <div className="profileMetricGrid" aria-label="선택 생활권 핵심 지표">
              <div>
                <span>종합 접근성</span>
                <strong>{Math.round(selected.overall_score)}점</strong>
              </div>
              <div>
                <span>접근 어려움</span>
                <strong>{Math.round(100 - selected.overall_score)}점</strong>
              </div>
              <div>
                <span>지원수요</span>
                <strong>{selected.vulnerable_index}점</strong>
              </div>
              <div>
                <span>우선 확인 축</span>
                <strong>{weakestServices[selected.area_id]}</strong>
              </div>
            </div>
            <p className="profileInterpretation">{compactSelectionNote}</p>
            <div className="profileBars demandBars" aria-label="지원수요 구성 지표">
              {[
                ["고령층", selected.elderly_ratio],
                ["1인가구", selected.single_ratio],
                ["돌봄수요", selected.care_demand],
              ].map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${Number(score)}%` }} />
                  <em>{Math.round(Number(score))}</em>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">선택 생활권</p>
            <h3>{selected.area_name}</h3>
            <div className="profileBadge">{policyTypes[selected.area_id]}</div>
            <dl>
              <div>
                <dt>종합 접근성</dt>
                <dd>{Math.round(selected.overall_score)}점</dd>
              </div>
              <div>
                <dt>접근 어려움</dt>
                <dd>{Math.round(100 - selected.overall_score)}점</dd>
              </div>
              <div>
                <dt>지원수요</dt>
                <dd>{selected.vulnerable_index}점</dd>
              </div>
              <div>
                <dt>우선 확인 축</dt>
                <dd>{weakestServices[selected.area_id]}</dd>
              </div>
              <div>
                <dt>선정 이유</dt>
                <dd>{compactSelectionNote}</dd>
              </div>
            </dl>
            <div className="profileBars" aria-label="서비스별 접근성 점수">
              {[
                ["의료", selected.medical_score],
                ["약국", selected.pharmacy_score],
                ["교통", selected.transit_score],
                ["돌봄", selected.care_score],
              ].map(([label, score]) => (
                <div key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${Number(score)}%` }} />
                  <em>{Math.round(Number(score))}</em>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
