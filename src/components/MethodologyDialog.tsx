"use client";

import { useRef } from "react";
import type { AreaMetric } from "@/lib/data";

const thresholds = {
  lowMax: 57,
  midMax: 69,
};

function bandCounts(areas: AreaMetric[]) {
  return {
    low: areas.filter((area) => area.overall_score <= thresholds.lowMax).length,
    mid: areas.filter((area) => area.overall_score > thresholds.lowMax && area.overall_score <= thresholds.midMax).length,
    high: areas.filter((area) => area.overall_score > thresholds.midMax).length,
  };
}

export function MethodologyDialog({ areas }: { areas: AreaMetric[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const counts = bandCounts(areas);

  return (
    <section className="methodologyDialogLauncher" aria-label="점수 산식과 데이터 출처 확인">
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        점수 산식·출처 확인
      </button>
      <dialog ref={dialogRef} className="methodologyDialog">
        <div className="dialogHead">
          <div>
            <p className="eyebrow">산정 방식</p>
            <h3>왜 이 10개 동이고, 점수는 어떻게 계산했나</h3>
          </div>
          <button type="button" aria-label="산정 방식 닫기" onClick={() => dialogRef.current?.close()}>
            닫기
          </button>
        </div>

        <div className="methodologyGrid">
          <article>
            <h4>대표 생활권 선정</h4>
            <p>
              고령층 비중, 1인가구 비중, 생활서비스 접근 편차, 수정·중원·분당 권역 대표성을 함께 본 대표 생활권 시각화입니다.
            </p>
            <ul>
              <li>권역별 생활권 차이를 함께 비교</li>
              <li>전체 행정동 CSV 교체 시 전수 분석 가능</li>
              <li>동별 선택 사유는 프로파일 카드에 표시</li>
            </ul>
          </article>

          <article>
            <h4>지표 산식</h4>
            <dl className="formulaList">
              <div>
                <dt>종합 접근권</dt>
                <dd>의료 30% + 약국 20% + 교통 25% + 돌봄 25%</dd>
              </div>
              <div>
                <dt>지원수요</dt>
                <dd>고령층·1인가구·돌봄수요 지표를 0~100점으로 표준화해 결합</dd>
              </div>
              <div>
                <dt>10분 접근 어려움</dt>
                <dd>100 - 종합 접근권 점수</dd>
              </div>
            </dl>
          </article>

          <article>
            <h4>점수 구간 근거</h4>
            <p>
              57점과 69점은 대표 생활권 점수 분포의 자연절단 후보를 바탕으로 하위권·중간권·상위권을 나누는 상대 기준입니다.
            </p>
            <div className="scoreHistogram" aria-label="접근권 점수 분포">
              <span style={{ flexGrow: counts.low }} className="histLow">
                0-57 · {counts.low}곳
              </span>
              <span style={{ flexGrow: counts.mid }} className="histMid">
                58-69 · {counts.mid}곳
              </span>
              <span style={{ flexGrow: counts.high }} className="histHigh">
                70+ · {counts.high}곳
              </span>
            </div>
            <p className="microCopy">전체 행정동 분석 시 동일 방식으로 경계값을 재산정할 수 있습니다.</p>
          </article>

          <article>
            <h4>데이터 출처</h4>
            <ul>
              <li>의료기관·약국 현황: 성남시 또는 공공데이터포털 위치 데이터</li>
              <li>교통 접근: 성남시 버스정류장 현황 또는 정류장 위치 데이터</li>
              <li>돌봄 접근: 성남시 복지·돌봄 생활서비스 거점 현황</li>
              <li>지원수요: 행정동별 인구, 고령층, 1인가구 통계</li>
            </ul>
          </article>
        </div>
      </dialog>
    </section>
  );
}
