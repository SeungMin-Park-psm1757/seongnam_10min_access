import { AccessMap } from "@/components/AccessMap";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { NeedAccessExplorer } from "@/components/NeedAccessExplorer";
import { PresentationModeToggle } from "@/components/PresentationModeToggle";
import { SensitivityToggle } from "@/components/SensitivityToggle";
import { dataScope, loadDashboardData, type AreaMetric, type ServicePoint } from "@/lib/data";
import type { CSSProperties, ReactNode } from "react";

type MetricKey = "medical_score" | "pharmacy_score" | "transit_score" | "care_score";
type PolicyKind = "의료 접근 보완형" | "이동 접근 보완형" | "돌봄 접근 보완형" | "복합 보완 필요형";

const services = [
  {
    key: "medical_score",
    point: "medical",
    label: "의료",
    icon: "+",
    color: "#2f6f68",
    basis: "의료기관 거리와 주변 의료 거점 밀도를 본 접근성 지표",
    policy: "공공보건·방문상담 연계를 우선 검토합니다.",
  },
  {
    key: "pharmacy_score",
    point: "pharmacy",
    label: "약국",
    icon: "Rx",
    color: "#52708f",
    basis: "약국 위치와 의료 거점 연결성을 본 의약품 접근성 지표",
    policy: "야간·휴일 이용 가능성과 위치 안내를 함께 점검합니다.",
  },
  {
    key: "transit_score",
    point: "bus",
    label: "교통",
    icon: "B",
    color: "#9a6b2f",
    basis: "실제 버스정류장 좌표와의 거리를 본 접근성 지표",
    policy: "보행 동선과 경사 데이터를 붙여 10분 도달성을 검증합니다.",
  },
  {
    key: "care_score",
    point: "care",
    label: "돌봄",
    icon: "C",
    color: "#8f4f4f",
    basis: "돌봄 거점 위치와 고령·돌봄 수요 관계를 본 지표",
    policy: "수요 대비 생활서비스·상담 거점 보완을 검토합니다.",
  },
] as const satisfies readonly {
  key: MetricKey;
  point: ServicePoint["service_type"];
  label: string;
  icon: string;
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
    signal: "의료·약국 점수가 낮고 고령·1인가구 비중이 함께 높습니다.",
    now: "동네의원, 약국, 야간·휴일 진료 정보를 한곳에 정리합니다.",
    mid: "공공보건, 방문상담, 복약 안내를 동 행정과 연계합니다.",
    dept: "보건소, 행정복지센터, 공공의료 협력기관",
    accent: "#2f6f68",
    emptyInsight: "대표 10개 동에서는 복합 보완 유형에 포함됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "이동 접근 보완형": {
    summary: "정류장 접근과 보행 연결을 함께 볼 생활권",
    why: "교통 거점이 있어도 보행동선·경사·횡단 여건이 불편하면 체감 접근성은 낮아집니다.",
    signal: "실제 정류장 좌표 기준 교통 점수가 낮고 생활서비스 이동 의존도가 높습니다.",
    now: "정류장까지의 보행동선, 경사, 횡단 안전을 추가 점검합니다.",
    mid: "마을버스 보완과 생활서비스 연결 노선을 함께 검토합니다.",
    dept: "교통기획과, 도로관리부서, 동 행정복지센터",
    accent: "#9a6b2f",
    emptyInsight: "대표 10개 동에서는 돌봄·복합 보완과 함께 관찰됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "돌봄 접근 보완형": {
    summary: "돌봄 수요와 생활서비스 거점을 맞춰볼 생활권",
    why: "돌봄 수요와 생활서비스 거점이 어긋나면 안내만으로도 이용 격차가 생깁니다.",
    signal: "돌봄 점수가 낮고 고령·돌봄 수요가 높은 동에서 확인됩니다.",
    now: "돌봄센터 이용 정보와 복지상담 창구를 함께 안내합니다.",
    mid: "방문돌봄, 생활지원, 고령친화 이동지원을 연계합니다.",
    dept: "복지정책과, 노인복지부서, 동 행정복지센터",
    accent: "#8f4f4f",
    emptyInsight: "현재 대표 표본에서는 돌봄·복합 보완 유형이 우선적으로 관찰됩니다. 단독 돌봄 유형은 전수 분석에서 추가 확인합니다.",
  },
  "복합 보완 필요형": {
    summary: "여러 생활서비스를 함께 점검할 생활권",
    why: "의료·이동·돌봄 중 하나만 보강하면 체감 개선이 제한적일 수 있습니다.",
    signal: "종합 접근성이 낮고 지원수요가 높은 동이 함께 묶입니다.",
    now: "보건·교통·돌봄 상담을 동 단위로 함께 안내합니다.",
    mid: "생활SOC 거점, 이동지원, 방문서비스를 묶어 검토합니다.",
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
    `${serviceLabels[key]} 접근을 먼저 확인할 생활권입니다.`,
    `종합 ${Math.round(area.overall_score)}점 · ${serviceLabels[key]} ${Math.round(value)}점`,
  ];
}

function scoreBand(score: number) {
  if (score < 58) return "우선 점검 필요";
  if (score < 70) return "주의 관찰";
  return "대체로 양호";
}

function ServiceRank({ areas, metric, limit = 5 }: { areas: AreaMetric[]; metric: MetricKey; limit?: number }) {
  const ranked = sortBy(areas, (area) => Number(area[metric])).slice(0, limit);
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

function PageShellV2({ children }: { children: ReactNode }) {
  return <main className="v2-page">{children}</main>;
}

function SectionHeaderV2({
  eyebrow,
  title,
  lines,
  note,
  className = "",
}: {
  eyebrow: string;
  title?: string;
  lines?: string[];
  note: string[];
  className?: string;
}) {
  return (
    <div className={`v2-section-header ${className}`}>
      <p>{eyebrow}</p>
      {lines ? <LineTitle className="v2-title ko-title" lines={lines} /> : <h2 className="v2-title ko-title">{title}</h2>}
      <LineText className="v2-body" lines={note} />
    </div>
  );
}

function MetricCardV2({ average }: { average: number }) {
  return (
    <section className="v2-card v2-metric-card" aria-label="대표 생활권 평균 접근성">
      <span className="v2-muted">대표 생활권 평균 접근성</span>
      <strong className="v2-kpi">{average || "-"}</strong>
      <em className="v2-card-desc">
        {average ? `${scoreBand(average)}. 점수가 높을수록 생활필수 서비스에 닿기 쉽습니다.` : "데이터 필요"}
      </em>
    </section>
  );
}

function MethodologyButtonV2({ areas }: { areas: AreaMetric[] }) {
  return (
    <div className="v2-methodology-button">
      <MethodologyDialog areas={areas} variant="v2" />
    </div>
  );
}

function MapPanelV2({
  areas,
  points,
  metric,
  compact,
  serviceFilter,
}: {
  areas: AreaMetric[];
  points: ServicePoint[];
  metric: MetricKey | "overall_score";
  compact?: boolean;
  serviceFilter?: ServicePoint["service_type"];
}) {
  return (
    <div className="v2-map-shell">
      <AccessMap areas={areas} points={points} metric={metric} compact={compact} serviceFilter={serviceFilter} variant="v2" />
    </div>
  );
}

function InsightCardV2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`v2-card v2-insight-card ${className}`}>{children}</section>;
}

function LegendV2() {
  return (
    <div className="v2-common-legend" aria-label="서비스별 색상 범례">
      <span><i className="low" />우선 점검</span>
      <span><i className="mid" />주의 관찰</span>
      <span><i className="high" />대체로 양호</span>
    </div>
  );
}

function serviceAverage(areas: AreaMetric[], metric: MetricKey) {
  if (areas.length === 0) return 0;
  return Math.round(areas.reduce((sum, area) => sum + Number(area[metric]), 0) / areas.length);
}

function ScopeCard({ count }: { count: number }) {
  return (
    <section className="v2-card scopeCard" aria-label="분석 범위">
      <p className="eyebrow">분석 범위</p>
      <h3 className="v2-card-title ko-card-title">
        <span>{dataScope.title}</span>
      </h3>
      <LineText
        className="v2-card-desc ko-card-desc"
        lines={["수정·중원·분당의 생활권 차이가 함께 보이도록 대표 표본을 구성했습니다."]}
      />
      <div className="v2-scope-tags">
        <span>대표 {count}개 동</span>
        <span>고령·1인가구</span>
        <span>접근성 편차</span>
        <span>권역 대표성</span>
      </div>
    </section>
  );
}

function MethodCard({ average, count }: { average: number; count: number }) {
  return (
    <section className="v2-card methodCard" aria-label="산정 방식">
      <div>
        <p className="eyebrow">산정 방식</p>
        <h3 className="v2-card-title">10분 생활권에 가까운 접근성 지표</h3>
        <LineText
          className="v2-card-desc ko-card-desc"
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
    <section className="v2-card sourceCard" aria-label="데이터 출처 요약">
      <p className="eyebrow">데이터</p>
      <h3 className="v2-card-title">공공데이터로 확장 가능한 구조</h3>
      <ul>
        <li>의료기관, 약국, 버스정류장, 복지·돌봄 생활서비스 거점</li>
        <li>행정동별 인구, 고령층, 1인가구 통계와 돌봄수요 지표</li>
        <li>동일 컬럼 CSV 교체 시 전체 행정동 전수 분석 가능</li>
      </ul>
    </section>
  );
}

export async function DashboardV2() {
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
    <PageShellV2>
      <header className="topBar v2-topbar">
        <div>
          <p className="ko-subtitle">생활서비스의 단순 분포를 넘어, 시민이 체감하는 실질적 도달성을 분석합니다.</p>
          <h1>성남 10분 생활필수 접근권 격차 지도</h1>
        </div>
        <nav aria-label="대시보드 화면 이동">
          <a href="/v1">v1</a>
          <a href="/v2">v2</a>
          <a href="#screen-1">한눈에 보기</a>
          <a href="#screen-2">무엇이 부족한가</a>
          <a href="#screen-3">어디가 우선인가</a>
          <a href="#screen-4">어떻게 보완할까</a>
          <PresentationModeToggle />
        </nav>
      </header>

      <section id="screen-1" className="v2-section screen heroScreen v2-hero">
        <SectionHeaderV2
          eyebrow="화면 1 · 한눈에 보기"
          lines={["생활서비스가 있는 것과", "10분 안에 닿는 것은 다릅니다."]}
          note={[
            "성남의 의료·약국·교통·돌봄 접근성을 생활권 단위로 비교했습니다.",
            "지도는 서비스가 많은 곳보다 실제로 닿기 쉬운 곳과 먼저 보완할 곳을 함께 보여줍니다.",
          ]}
          className="heroTitle"
        />
        <strong className="conclusionLine v2-reading-note">핵심 해석: 생활서비스의 개수보다 체감 도달성이 정책 우선순위를 가릅니다.</strong>
        <div className="heroGrid">
          <MapPanelV2 areas={areas} points={points} metric="overall_score" />
          <aside className="kpiPanel">
            <MetricCardV2 average={areas.length > 0 ? average : 0} />
            <MethodologyButtonV2 areas={areas} />
            <ScopeCard count={areas.length} />
            <InsightCardV2>
              <h3 className="v2-card-title">우선 점검이 필요한 생활권</h3>
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
            </InsightCardV2>
            <div className="v2-supporting-cards">
              <MethodCard average={average} count={areas.length} />
              <SensitivityToggle areas={areas} />
              <DataSourceCard />
            </div>
          </aside>
        </div>
      </section>

      <section id="screen-2" className="v2-section screen serviceScreen">
        <SectionHeaderV2
          eyebrow="화면 2 · 무엇이 부족한가"
          lines={["단순한 취약 지역 분류를 넘어,", "지역 특성에 맞는 보완 방향이 필요합니다."]}
          note={[
            "의료·약국·교통·돌봄을 나눠 보면 같은 지역도 다른 모습을 보입니다.",
            "서비스별 차이를 분리해 소관 부서의 역할과 협업 지점을 읽을 수 있게 했습니다.",
          ]}
        />
        <strong className="conclusionLine v2-reading-note">정책적 의미: 같은 생활권이라도 먼저 보완할 서비스는 다를 수 있습니다.</strong>
        <LegendV2 />
        <div className="smallMultiples">
          {services.map((service) => (
            <article key={service.key} className="servicePanel">
              <div className="panelHead">
                <div>
                  <p>부족 생활권 TOP 3</p>
                  <h3 className="ko-card-title">
                    <span className="serviceIcon" style={{ color: service.color, borderColor: service.color }}>{service.icon}</span>
                    {service.label} 접근성
                  </h3>
                  <strong className="serviceStatus">{serviceAverage(areas, service.key)}점 · {scoreBand(serviceAverage(areas, service.key))}</strong>
                </div>
                <span style={{ background: service.color }} />
              </div>
              <MapPanelV2 areas={areas} points={points} metric={service.key} compact serviceFilter={service.point} />
              <ServiceRank areas={areas} metric={service.key} limit={3} />
              <p className="policyHint ko-card-desc">{service.policy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="screen-3" className="v2-section screen overlapScreen">
        <SectionHeaderV2
          eyebrow="화면 3 · 어디가 우선인가"
          title="접근이 어렵고 지원수요가 높은 생활권부터 먼저 점검합니다."
          note={[
            "가로축은 10분 접근의 어려움, 세로축은 고령·1인가구·돌봄수요입니다.",
            "오른쪽 위에 가까울수록 정책 지원의 우선 검토 대상입니다.",
          ]}
          className="prioritySectionTitle"
        />
        <strong className="conclusionLine v2-reading-note">읽는 법: 접근성이 낮고 지원수요가 높은 곳을 먼저 확인합니다.</strong>
        <NeedAccessExplorer
          areas={areas}
          initialAreaId={selectedArea?.area_id}
          policyTypes={Object.fromEntries(areas.map((area) => [area.area_id, policyType(area)]))}
          weakestServices={Object.fromEntries(areas.map((area) => [area.area_id, serviceLabels[weakestService(area)[0]]]))}
          variant="v2"
        />
      </section>

      <section id="screen-4" className="v2-section screen actionScreen">
        <SectionHeaderV2
          eyebrow="화면 4 · 어떻게 보완할까"
          lines={["데이터 분석 결과를", "부서별 정책 보완 방향으로 연결합니다."]}
          note={[
            "의료 접근, 이동 접근, 돌봄 접근, 복합 보완 필요 유형으로 나눴습니다.",
            "단기 점검과 중기 과제를 분리해 실제 부서 협업으로 이어지게 구성했습니다.",
          ]}
        />
        <strong className="conclusionLine v2-reading-note">정책적 의미: 정책은 순위가 아니라 유형별 보완 방향으로 이어져야 합니다.</strong>
        <div className="actionGrid">
          {policyEntries.map(({ kind, plan, areas: groupedAreas }) => (
            <article
              key={kind}
              className={`v2-card policyCard ${groupedAreas.length === 0 ? "interpretationOnly" : ""}`}
              style={{ "--accent": plan.accent } as CSSProperties}
            >
              <div className="policyCardHead">
                <p>{plan.summary}</p>
                <h3 className="v2-card-title ko-card-title">{kind}</h3>
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
                  <dt>데이터 신호</dt>
                  <dd>{plan.signal}</dd>
                </div>
                <div>
                  <dt>먼저 할 일</dt>
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
    </PageShellV2>
  );
}

export default DashboardV2;
