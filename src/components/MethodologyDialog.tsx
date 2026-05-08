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

export function MethodologyDialog({ areas, variant = "v1" }: { areas: AreaMetric[]; variant?: "v1" | "v2" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const counts = bandCounts(areas);
  const isV2 = variant === "v2";

  return (
    <section className="methodologyDialogLauncher" aria-label="점수 산식과 데이터 출처 확인">
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        점수 산식·출처 확인
      </button>
      <dialog ref={dialogRef} className={isV2 ? "methodologyDialog methodologyDialogV2" : "methodologyDialog"}>
        <div className="dialogHead">
          <div>
            <p className="eyebrow">산정 방식</p>
            <h3>{isV2 ? "분석 기준과 데이터 갱신 구조" : "왜 이 10개 동이고, 점수는 어떻게 계산했나"}</h3>
          </div>
          <button type="button" aria-label="산정 방식 닫기" onClick={() => dialogRef.current?.close()}>
            닫기
          </button>
        </div>

        {isV2 ? (
          <div className="methodologyGrid methodologyGridV2">
            <article>
              <h4>사용 데이터</h4>
              <table className="methodSourceTable">
                <tbody>
                  <tr>
                    <th>서비스</th>
                    <td>의료기관, 약국, 노인복지관, 실제 버스정류장 좌표</td>
                  </tr>
                  <tr>
                    <th>수요</th>
                    <td>행정동별 인구, 고령층, 1인가구, 돌봄수요 지표</td>
                  </tr>
                  <tr>
                    <th>공간 단위</th>
                    <td>대표 생활권 10개 동, 동일 컬럼 CSV로 전체 행정동 확장 가능</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article>
              <h4>지표 산식</h4>
              <dl className="formulaList formulaCards">
                <div>
                  <dt>종합 접근성</dt>
                  <dd>의료 30% + 약국 20% + 교통 25% + 돌봄 25%</dd>
                </div>
                <div>
                  <dt>지원수요</dt>
                  <dd>고령층, 1인가구, 돌봄수요를 0~100점으로 표준화해 결합</dd>
                </div>
              </dl>
            </article>

            <article>
              <h4>점수 구간</h4>
              <p>대표 생활권 점수 분포를 기준으로 우선 점검, 주의 관찰, 대체로 양호 구간을 나눴습니다.</p>
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
            </article>

            <article>
              <h4>대표 동 선정 기준</h4>
              <p>고령층 비중, 1인가구 비중, 생활서비스 접근 편차, 수정·중원·분당 권역 대표성을 함께 반영했습니다.</p>
            </article>

            <article>
              <h4>한계와 확장</h4>
              <p>현재 점수는 위치 기반 근사 접근성입니다. 정류장 좌표, 보행 네트워크, 실제 이동시간 데이터를 결합하면 10분 도달성 지표로 확장할 수 있습니다.</p>
            </article>

            <article>
              <h4>데이터 갱신 가능성</h4>
              <p>동일한 CSV 컬럼으로 최신 공공데이터를 교체하면 지도, 차트, 우선순위 카드가 같은 구조로 갱신됩니다.</p>
            </article>
          </div>
        ) : (
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
        )}
      </dialog>
    </section>
  );
}
