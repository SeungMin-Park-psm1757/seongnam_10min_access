import { AccessMap } from "@/components/AccessMap";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { NeedAccessExplorer } from "@/components/NeedAccessExplorer";
import { PresentationModeToggle } from "@/components/PresentationModeToggle";
import { SensitivityToggle } from "@/components/SensitivityToggle";
import { dataScope, loadDashboardData, type AreaMetric, type ServicePoint } from "@/lib/data";
import type { CSSProperties } from "react";

type MetricKey = "medical_score" | "pharmacy_score" | "transit_score" | "care_score";
type PolicyKind = "의료 접근 보완형" | "이동 접근 보완형" | "돌봄 접근 보완형" | "복합 보완 필요형";

const services = [
  {
    key: "medical_score",
    point: "medical",
    label: "의료",
    color: "#2f6f68",
    basis: "의료기관 거리와 주변 의료 거점 밀도를 본 접근성 지표",
    policy: "공공보건·방문상담 연계를 우선 검토합니다.",
  },
  {
    key: "pharmacy_score",
    point: "pharmacy",
    label: "약국",
    color: "#52708f",
    basis: "약국 위치와 의료 거점 연결성을 본 의약품 접근성 지표",
    policy: "야간·휴일 이용 가능성과 위치 안내를 함께 점검합니다.",
  },
  {
    key: "transit_score",
    point: "bus",
    label: "교통",
    color: "#9a6b2f",
    basis: "정류장 접근성과 생활서비스 이동 편의를 반영한 지표",
    policy: "정류장 접근과 보행 동선을 함께 점검합니다.",
  },
  {
    key: "care_score",
    point: "care",
    label: "돌봄",
    color: "#8f4f4f",
    basis: "돌봄 거점 위치와 고령·돌봄 수요 관계를 본 지표",
    policy: "수요 대비 생활서비스·상담 거점 보완을 검토합니다.",
  },
] as const satisfies readonly {
  key: MetricKey;
  point: ServicePoint["service_type"];
  label: string;
  color: string;
  basis: string;
  policy: string;
}[];

const serviceLabels: Record<MetricKey, string> = {
  medical_score: "의료",
  pharmacy_score: "약국",
  transit_score: "교통",
  care_score: "돌봄",
};

const policyPlans: Record<
  PolicyKind,
  {
    summary: string;
    why: string;
    signal: string;
    now: string;
    mid: string;
    dept: string;
    accent: string;
    emptyInsight: string;
  }
> = {
  "의료 접근 보완형": {
    summary: "가까운 의료·약국 이용을 우선 확인할 생활권",
    why: "의료·약국 접근이 낮으면 작은 불편도 건강 안전망의 약점이 될 수 있습니다.",
    signal: "의료·약국 점수가 낮고 고령층 또는 1인가구 비중이 함께 높습니다.",
    now: "동네의원, 약국, 야간·휴일 진료 정보를 한눈에 정리합니다.",
    mid: "공공보건, 방문상담, 복약 안내를 행정복지센터와 연계합니다.",
    dept: "보건소, 행정복지센터, 공공의료 협력기관",
    accent: "#2f6f68",
    emptyInsight: "대표 10개 동에서는 복합 보완 유형에 포함됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "이동 접근 보완형": {
    summary: "정류장 접근과 보행 연결을 함께 볼 생활권",
    why: "정류장이 가까워도 보행동선·경사·횡단 여건이 불편하면 체감 접근성은 낮아집니다.",
    signal: "교통 점수가 낮고 생활서비스 이용을 위한 이동 의존도가 높습니다.",
    now: "정류장까지의 보행동선, 경사, 횡단 안전, 안내표지를 점검합니다.",
    mid: "마을버스 보완, 생활서비스 연결 노선, 보행환경 개선을 함께 검토합니다.",
    dept: "교통기획과, 도로관리부서, 동 행정복지센터",
    accent: "#9a6b2f",
    emptyInsight: "대표 10개 동에서는 돌봄·복합 보완과 함께 관찰됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "돌봄 접근 보완형": {
    summary: "돌봄 수요와 생활서비스 거점을 맞춰볼 생활권",
    why: "돌봄 수요와 생활서비스 거점이 어긋나면 안내만으로도 이용 격차가 생깁니다.",
    signal: "돌봄 점수가 낮고 고령·돌봄 수요가 높은 동에서 먼저 확인됩니다.",
    now: "돌봄센터 이용 정보와 복지상담 창구를 함께 안내합니다.",
    mid: "방문돌봄, 생활지원, 고령친화 이동지원을 연계해 검토합니다.",
    dept: "복지정책과, 노인복지부서, 동 행정복지센터",
    accent: "#8f4f4f",
    emptyInsight: "현재 대표 표본에서는 돌봄·복합 보완 유형이 우선적으로 관찰됩니다. 단독 돌봄 유형은 전수 분석에서 추가 확인합니다.",
  },
  "복합 보완 필요형": {
    summary: "여러 생활서비스를 함께 점검할 생활권",
    why: "의료·이동·돌봄 중 하나만 보강하면 체감 개선이 제한적일 수 있습니다.",
    signal: "종합 접근성이 낮고 지원수요가 높은 동이 함께 묶입니다.",
    now: "보건·교통·돌봄 상담을 동 단위로 함께 안내합니다.",
    mid: "생활SOC 거점, 이동지원, 방문서비스 연계를 검토합니다.",
    dept: "정책기획과, 보건소, 복지·교통 부서 합동",
    accent: "#a84f3f",
    emptyInsight: "복합 보완 필요 생활권이 없으면 서비스별 우선 점검 카드로 나눠 검토합니다.",
  },
};

function sortBy<T>(items: T[], selector: (item: T) => number, direction: "asc" | "desc" = "asc") {
  return [...items].sort((a, b) => (direction === "asc" ? selector(a) - selector(b) : selector(b) - selector(a)));
}

function riskScore(area: AreaMetric) {
  return (100 - area.overall_score) * 0.58 + area.vulnerable_index * 0.42;
}

function weakestService(area: AreaMetric) {
  const values = [
    ["medical_score", area.medical_score],
    ["pharmacy_score", area.pharmacy_score],
    ["transit_score", area.transit_score],
    ["care_score", area.care_score],
  ] as const;
  return values.reduce((lowest, current) => (current[1] < lowest[1] ? current : lowest));
}

function policyType(area: AreaMetric): PolicyKind {
  if (area.overall_score < 58 && area.vulnerable_index >= 70) return "복합 보완 필요형";
  const [key] = weakestService(area);
  if (key === "medical_score" || key === "pharmacy_score") return "의료 접근 보완형";
  if (key === "transit_score") return "이동 접근 보완형";
  return "돌봄 접근 보완형";
}

function priorityReason(area: AreaMetric) {
  const [key, value] = weakestService(area);
  return [
    "생활서비스가 부족한 편입니다.",
    `접근성 ${Math.round(area.overall_score)}점 · 우선 확인 축 ${serviceLabels[key]} ${Math.round(value)}점`,
  ];
}

function scoreBand(score: number) {
  if (score < 58) return "우선 점검 필요";
  if (score < 70) return "주의 관찰";
  return "대체로 양호";
}

function ServiceRank({ areas, metric }: { areas: AreaMetric[]; metric: MetricKey }) {
  const ranked = sortBy(areas, (area) => Number(area[metric])).slice(0, 5);
  if (ranked.length === 0) return <p className="emptyHint">표시할 데이터가 없습니다.</p>;

  return (
    <ol className="rankList serviceRank">
      {ranked.map((area, index) => (
        <li key={`${area.area_id}-${metric}`}>
          <span>{index + 1}</span>
          <strong>{area.area_name}</strong>
          <em>{Math.round(Number(area[metric]))}점</em>
        </li>
      ))}
    </ol>
  );
}

function LineText({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <span className={className}>
      {lines.map((line) => (
        <span key={line} className="textLine">
          {line}
        </span>
      ))}
    </span>
  );
}

function LineTitle({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <h2 className={className}>
      {lines.map((line) => (
        <span key={line} className="titleLine">
          {line}
        </span>
      ))}
    </h2>
  );
}

function ScopeCard({ count }: { count: number }) {
  return (
    <section className="scopeCard" aria-label="분석 범위">
      <p className="eyebrow">분석 범위: 대표 생활권 10개 동</p>
      <h3 className="ko-card-title">
        <span>{dataScope.title}</span>
        <span>고령·1인가구·접근성 편차·권역 대표성 기준</span>
      </h3>
      <LineText
        className="ko-card-desc"
        lines={["수정·중원·분당의 생활권 차이가 함께 보이도록", "대표 표본을 구성했습니다."]}
      />
      <div>
        <span>대표 {count}개 동</span>
        <span>권역 대표성 반영</span>
        <span>전수 분석 가능한 CSV 구조</span>
      </div>
      <div className="expansionSlot">
        <strong>전수 분석 확장 슬롯</strong>
        <span>전체 행정동 CSV 입력 시 평균 범위와 대표 10개 동 분포를 자동 비교합니다.</span>
      </div>
    </section>
  );
}

function MethodCard({ average, count }: { average: number; count: number }) {
  return (
    <section className="methodCard" aria-label="산정 방식">
      <div>
        <p className="eyebrow">산정 방식</p>
        <h3>10분 생활권에 가까운 접근성 지표</h3>
        <LineText
          className="ko-card-desc"
          lines={[
            "본 지표는 위치 기반 근사 접근성 점수입니다.",
            "서비스별 접근성을 0~100점으로 표준화해 비교합니다.",
            "향후 보행 네트워크 기반 10분 도달성으로 확장할 수 있습니다.",
          ]}
        />
      </div>
      <div className="weightGrid">
        <strong>종합 접근성 구성</strong>
        <span>의료 30%</span>
        <span>약국 20%</span>
        <span>교통 25%</span>
        <span>돌봄 25%</span>
      </div>
      <LineText
        className="weightReason"
        lines={["의료와 교통은 긴급성과 이동성이 커 비중을 조금 높였습니다.", "약국과 돌봄은 일상 접근성을 보는 축입니다."]}
      />
      <div className="scoreLegend" aria-label="점수 구간 범례">
        <span><i className="low" />0-57 우선 점검 필요</span>
        <span><i className="mid" />58-69 주의 관찰</span>
        <span><i className="high" />70+ 대체로 양호</span>
      </div>
      <div className="sourceMini">
        <span>분석 단위 {count}개 동</span>
        <span>평균 {average}점</span>
        <span>대표 분포 자연절단 기준</span>
      </div>
    </section>
  );
}

function DataSourceCard() {
  return (
    <section className="sourceCard" aria-label="데이터 출처 요약">
      <p className="eyebrow">데이터</p>
      <h3>공공데이터로 확장 가능한 구조</h3>
      <ul>
        <li>의료기관, 약국, 버스정류장, 복지·돌봄 생활서비스 거점</li>
        <li>행정동별 인구, 고령층, 1인가구 통계와 돌봄수요 지표</li>
        <li>동일 컬럼 CSV 교체 시 전체 행정동 전수 분석 가능</li>
      </ul>
    </section>
  );
}

export default async function Home() {
  const { areas, points } = loadDashboardData("normal");
  const priorityTop = sortBy(areas, riskScore, "desc").slice(0, 5);
  const selectedArea = priorityTop[0];
  const average = areas.length > 0 ? Math.round(areas.reduce((sum, area) => sum + area.overall_score, 0) / areas.length) : 0;
  const policyEntries = (Object.keys(policyPlans) as PolicyKind[]).map((kind) => ({
    kind,
    plan: policyPlans[kind],
    areas: areas.filter((area) => policyType(area) === kind),
  }));

  return (
    <main>
      <header className="topBar">
        <div>
          <p className="ko-subtitle">생활서비스의 단순 분포를 넘어, 시민이 체감하는 실질적 도달성을 분석합니다.</p>
          <h1>성남 10분 생활필수 접근권 격차 지도</h1>
        </div>
        <nav aria-label="대시보드 화면 이동">
          <a href="#screen-1">한눈에 보기</a>
          <a href="#screen-2">무엇이 부족한가</a>
          <a href="#screen-3">어디가 우선인가</a>
          <a href="#screen-4">어떻게 보완할까</a>
          <PresentationModeToggle />
        </nav>
      </header>

      <section id="screen-1" className="screen heroScreen">
        <div className="sectionTitle heroTitle">
          <p>화면 1 · 한눈에 보기</p>
          <h2 className="ko-title heroStatement">
            <span>생활서비스가 있는 것과</span>
            <span>10분 안에 닿는 것은 다릅니다.</span>
          </h2>
          <LineText
            className="ko-body heroBody"
            lines={[
              "성남의 생활서비스는 곳곳에 분포해 있지만, 모든 시민이 같은 속도로 이용할 수 있는 것은 아닙니다.",
              "이 대시보드는 의료·약국·교통·돌봄 접근성을 비교해 생활서비스 보강이 필요한 지역을 찾습니다.",
            ]}
          />
          <strong className="conclusionLine">결론: 생활서비스의 수보다 실제로 닿기 쉬운지가 정책 우선순위를 가릅니다.</strong>
        </div>
        <div className="heroGrid">
          <AccessMap areas={areas} points={points} metric="overall_score" />
          <aside className="kpiPanel">
            <div className="kpi">
              <span>대표 생활권 평균 접근성</span>
              <strong>{areas.length > 0 ? average : "-"}</strong>
              <em className="ko-card-desc">{areas.length > 0 ? `${scoreBand(average)} · 100점에 가까울수록 10분 생활권 접근성이 높음` : "데이터 필요"}</em>
            </div>
            <MethodologyDialog areas={areas} />
            <ScopeCard count={areas.length} />
            <div>
              <h3>우선 점검이 필요한 생활권</h3>
              <ol className="priorityList">
                {priorityTop.map((area, index) => (
                  <li key={area.area_id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{area.area_name}</strong>
                      <LineText className="ko-card-desc priorityReason" lines={priorityReason(area)} />
                    </div>
                    <em>{policyType(area)}</em>
                  </li>
                ))}
              </ol>
            </div>
            <MethodCard average={average} count={areas.length} />
            <SensitivityToggle areas={areas} />
            <DataSourceCard />
          </aside>
        </div>
      </section>

      <section id="screen-2" className="screen serviceScreen">
        <div className="sectionTitle">
          <p>화면 2 · 무엇이 부족한가</p>
          <LineTitle
            className="ko-title"
            lines={["단순한 취약 지역 분류를 넘어,", "지역 특성에 맞는 보완 방향이 필요합니다."]}
          />
          <LineText
            className="ko-body"
            lines={[
              "의료·약국·교통·돌봄을 나눠 보면 같은 지역도 다른 모습을 보입니다.",
              "부족한 필수 서비스 영역을 세분화해 소관 부서의 역할과 협업 지점을 함께 제시합니다.",
            ]}
          />
          <strong className="conclusionLine">결론: 같은 생활권이라도 먼저 보완할 서비스는 다를 수 있습니다.</strong>
        </div>
        <div className="smallMultiples">
          {services.map((service) => (
            <article key={service.key} className="servicePanel">
              <div className="panelHead">
                <div>
                  <p>우선 점검 TOP 5 · 해당 서비스 점수</p>
                  <h3 className="ko-card-title">{service.label} 접근성</h3>
                </div>
                <span style={{ background: service.color }} />
              </div>
              <AccessMap areas={areas} points={points} metric={service.key} compact serviceFilter={service.point} />
              <div className="serviceMethod">
                <strong>산정 기준</strong>
                <span className="ko-card-desc">{service.basis}</span>
              </div>
              <ServiceRank areas={areas} metric={service.key} />
              <p className="policyHint ko-card-desc">{service.policy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="screen-3" className="screen overlapScreen">
        <div className="sectionTitle prioritySectionTitle">
          <p>화면 3 · 어디가 우선인가</p>
          <h2 className="ko-title priorityTitle">접근은 낮고 돌봄 수요는 높은 곳을 먼저 확인합니다.</h2>
          <LineText
            className="ko-body"
            lines={[
              "가로축은 10분 접근의 어려움, 세로축은 고령·1인가구·돌봄수요입니다.",
              "1사분면에 가까울수록 즉각적인 정책 지원이 필요한 핵심 타깃 지역입니다.",
            ]}
          />
          <strong className="conclusionLine">결론: 접근성이 낮고 지원수요가 높은 곳이 우선 점검 대상입니다.</strong>
        </div>
        <NeedAccessExplorer
          areas={areas}
          initialAreaId={selectedArea?.area_id}
          policyTypes={Object.fromEntries(areas.map((area) => [area.area_id, policyType(area)]))}
          weakestServices={Object.fromEntries(areas.map((area) => [area.area_id, serviceLabels[weakestService(area)[0]]]))}
        />
      </section>

      <section id="screen-4" className="screen actionScreen">
        <div className="sectionTitle">
          <p>화면 4 · 어떻게 보완할까</p>
          <LineTitle
            className="ko-title"
            lines={["데이터 분석 결과를", "부서별 정책 보완 방향으로 연결합니다."]}
          />
          <LineText
            className="ko-body"
            lines={[
              "의료 접근, 이동 접근, 돌봄 접근, 복합 보완 필요 유형으로 나눕니다.",
              "즉시 실행 가능한 단기 과제와 구조적 개선이 필요한 중장기 과제를 도출했습니다.",
            ]}
          />
          <strong className="conclusionLine">결론: 정책은 순위가 아니라 유형별 보완 방향으로 이어져야 합니다.</strong>
        </div>
        <div className="actionGrid">
          {policyEntries.map(({ kind, plan, areas: groupedAreas }) => (
            <article
              key={kind}
              className={`policyCard ${groupedAreas.length === 0 ? "interpretationOnly" : ""}`}
              style={{ "--accent": plan.accent } as CSSProperties}
            >
              <div className="policyCardHead">
                <p>{plan.summary}</p>
                <h3 className="ko-card-title">{kind}</h3>
              </div>
              <div className="policyAreas">
                {groupedAreas.length > 0 ? (
                  groupedAreas.slice(0, 4).map((area) => <span key={area.area_id}>{area.area_name}</span>)
                ) : (
                  <strong className="ko-card-desc">{plan.emptyInsight}</strong>
                )}
              </div>
              <dl>
                <div>
                  <dt>왜 보완이 필요한가</dt>
                  <dd>{plan.why}</dd>
                </div>
                <div>
                  <dt>데이터가 보여주는 신호</dt>
                  <dd>{plan.signal}</dd>
                </div>
                <div>
                  <dt>먼저 할 수 있는 일</dt>
                  <dd>{plan.now}</dd>
                </div>
                <div>
                  <dt>중기 검토 과제</dt>
                  <dd>{plan.mid}</dd>
                </div>
                <div>
                  <dt>협업 부서</dt>
                  <dd>{plan.dept}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
