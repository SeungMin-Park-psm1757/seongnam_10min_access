import { AccessMap } from "@/components/AccessMap";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { NeedAccessExplorer } from "@/components/NeedAccessExplorer";
import { PresentationModeToggle } from "@/components/PresentationModeToggle";
import { loadDashboardData, type AreaMetric, type DataMetadata, type ServicePoint } from "@/lib/data";
import type { CSSProperties, ReactNode } from "react";

type MetricKey = "medical_score" | "pharmacy_score" | "transit_score" | "care_score";
type DiagnosisKind = "의료·의약 접근 취약" | "정류장·보행 연결 취약" | "돌봄 거점 접근 취약" | "복합 점검 필요";
type PolicyKind = "의료 접근 보완형" | "이동 접근 보완형" | "돌봄 접근 보완형" | "복합 보완 필요형";

const services = [
  {
    key: "medical_score",
    point: "medical",
    label: "의료",
    icon: "+",
    color: "#3f4a50",
    basis: "의료기관 거리와 주변 의료 거점 밀도를 본 접근성 지표",
    policy: "동네의원·보건소 연계망을 우선 확인합니다.",
  },
  {
    key: "pharmacy_score",
    point: "pharmacy",
    label: "약국",
    icon: "Rx",
    color: "#647077",
    basis: "약국 위치와 의료 거점 연결성을 본 의약품 접근성 지표",
    policy: "공공심야약국 접근성을 점검합니다.",
  },
  {
    key: "transit_score",
    point: "bus",
    label: "교통",
    icon: "B",
    color: "#7d8585",
    basis: "실제 버스정류장 좌표와의 거리를 본 접근성 지표",
    policy: "정류장 보행로와 마을버스 배차를 점검합니다.",
  },
  {
    key: "care_score",
    point: "care",
    label: "돌봄",
    icon: "C",
    color: "#96938b",
    basis: "돌봄 거점 위치와 고령·돌봄 수요 관계를 본 지표",
    policy: "찾아가는 복지와 임시 거점 운영을 검토합니다.",
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
    now: "동네의원·약국·야간/휴일 진료 정보를 정리합니다.",
    mid: "공공보건, 방문상담, 복약 안내를 연계합니다.",
    dept: "보건소, 행정복지센터, 공공의료 협력기관",
    accent: "#59646a",
    emptyInsight: "대표 10개 동에서는 복합 보완 유형에 포함됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "이동 접근 보완형": {
    summary: "정류장 접근과 보행 연결을 함께 볼 생활권",
    why: "교통 거점이 있어도 보행동선·경사·횡단 여건이 불편하면 체감 접근성은 낮아집니다.",
    signal: "생활서비스 이동 의존도가 높고 정류장 접근 점수가 낮습니다.",
    now: "정류장 보행동선, 경사, 횡단 안전을 점검합니다.",
    mid: "마을버스 보완과 생활서비스 연결 노선을 검토합니다.",
    dept: "교통기획과, 도로관리부서, 동 행정복지센터",
    accent: "#6f7777",
    emptyInsight: "대표 10개 동에서는 돌봄·복합 보완과 함께 관찰됩니다. 전수 분석에서 단독 유형을 추가 확인합니다.",
  },
  "돌봄 접근 보완형": {
    summary: "돌봄 수요와 생활서비스 거점을 맞춰볼 생활권",
    why: "돌봄 수요와 생활서비스 거점이 어긋나면 안내만으로도 이용 격차가 생깁니다.",
    signal: "돌봄 점수가 낮고 고령·돌봄수요가 높은 생활권입니다.",
    now: "찾아가는 돌봄서비스와 행정복지센터 이용 정보를 정비합니다.",
    mid: "임시 거점, 방문상담, 복지 안내체계를 보완합니다.",
    dept: "복지정책과, 노인복지부서, 동 행정복지센터",
    accent: "#817e76",
    emptyInsight: "현재 대표 표본에서는 돌봄·복합 보완 유형이 우선적으로 관찰됩니다. 단독 돌봄 유형은 전수 분석에서 추가 확인합니다.",
  },
  "복합 보완 필요형": {
    summary: "여러 생활서비스를 함께 점검할 생활권",
    why: "의료·이동·돌봄 중 하나만 보강하면 체감 개선이 제한적일 수 있습니다.",
    signal: "여러 서비스 점수가 함께 낮거나 지원수요가 높은 생활권은 별도 검토합니다.",
    now: "의료·교통·복지 부서가 함께 현장을 점검합니다.",
    mid: "복합 생활서비스 거점 또는 통합 안내체계를 검토합니다.",
    dept: "정책기획과, 보건소, 복지·교통 부서 합동",
    accent: "#414b52",
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

function diagnosisType(area: AreaMetric): DiagnosisKind {
  if (area.overall_score < 58 && area.vulnerable_index >= 70) return "복합 점검 필요";
  const [key] = weakestService(area);
  if (key === "medical_score" || key === "pharmacy_score") return "의료·의약 접근 취약";
  if (key === "transit_score") return "정류장·보행 연결 취약";
  return "돌봄 거점 접근 취약";
}

function policyType(area: AreaMetric): PolicyKind {
  const diagnosis = diagnosisType(area);
  if (diagnosis === "의료·의약 접근 취약") return "의료 접근 보완형";
  if (diagnosis === "정류장·보행 연결 취약") return "이동 접근 보완형";
  if (diagnosis === "돌봄 거점 접근 취약") return "돌봄 접근 보완형";
  return "복합 보완 필요형";
}

function priorityReason(area: AreaMetric) {
  const [key, value] = weakestService(area);
  return [
    `종합 ${Math.round(area.overall_score)}점 · ${serviceLabels[key]} ${Math.round(value)}점`,
  ];
}

const policyHighlightTokens = [
  "의료·약국",
  "고령·1인가구",
  "생활서비스 이동",
  "정류장",
  "돌봄 점수",
  "돌봄수요",
  "여러 서비스",
  "지원수요",
  "동네의원·약국·야간/휴일",
  "방문상담",
  "복약 안내",
  "보행동선",
  "횡단 안전",
  "마을버스",
  "찾아가는 돌봄서비스",
  "행정복지센터",
  "임시 거점",
  "복지 안내체계",
  "의료·교통·복지",
  "복합 생활서비스 거점",
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedPolicyText({ text }: { text: string }) {
  const pattern = new RegExp(`(${policyHighlightTokens.map(escapeRegExp).join("|")})`, "g");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        policyHighlightTokens.includes(part as (typeof policyHighlightTokens)[number]) ? (
          <strong key={`${part}-${index}`}>{part}</strong>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function ServiceTopSummary({ areas, metric }: { areas: AreaMetric[]; metric: MetricKey }) {
  const ranked = sortBy(areas, (area) => Number(area[metric])).slice(0, 3);
  if (ranked.length === 0) return <p className="emptyHint">표시할 데이터가 없습니다.</p>;

  return (
    <p className="serviceTopSummary">
      <span>우선 확인 생활권</span>
      <strong>{ranked.map((area) => area.area_name).join(", ")}</strong>
    </p>
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
      <em className="v2-card-desc">대표 생활권 평균 접근성은 {average || "-"}점입니다.</em>
      <em className="v2-card-desc">점수가 높을수록 생활필수 서비스에 닿기 쉬운 것으로 해석합니다.</em>
    </section>
  );
}

function MethodologyButtonV2({ areas, metadata }: { areas: AreaMetric[]; metadata: DataMetadata | null }) {
  return (
    <div className="v2-methodology-button">
      <MethodologyDialog areas={areas} metadata={metadata} variant="v2" />
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

export async function DashboardV2() {
  const { areas, points, metadata } = loadDashboardData("normal");
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
          <a href="#screen-1">한눈에 보기</a>
          <a href="#screen-2">무엇이 부족한가</a>
          <a href="#screen-3">어디가 우선인가</a>
          <a href="#screen-4">어떻게 보완할까</a>
          <MethodologyButtonV2 areas={areas} metadata={metadata} />
          <PresentationModeToggle />
        </nav>
      </header>

      <section id="screen-1" className="v2-section screen heroScreen v2-hero">
        <SectionHeaderV2
          eyebrow="화면 1 · 한눈에 보기"
          lines={["생활서비스가 있는 것과", "10분 안에 닿는 것은 다릅니다."]}
          note={[
            "성남의 의료·약국·교통·돌봄 접근성을 대표 생활권 단위로 비교했습니다.",
          ]}
          className="heroTitle"
        />
        <strong className="conclusionLine v2-reading-note">생활서비스의 개수보다 실제 접근성이 정책 우선순위를 가릅니다.</strong>
        <div className="heroGrid">
          <MapPanelV2 areas={areas} points={points} metric="overall_score" />
          <aside className="kpiPanel">
            <MetricCardV2 average={areas.length > 0 ? average : 0} />
            <InsightCardV2>
              <h3 className="v2-card-title">우선 확인 생활권</h3>
              <ol className="priorityList">
                {priorityTop.slice(0, 3).map((area, index) => (
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
          </aside>
        </div>
      </section>

      <section id="screen-2" className="v2-section screen serviceScreen">
        <SectionHeaderV2
          eyebrow="화면 2 · 무엇이 부족한가"
          lines={["서비스별 접근성을 나눠 보면", "먼저 확인할 지점이 달라집니다."]}
          note={[
            "의료·약국·교통·돌봄별 평균 점수와 우선 확인 생활권을 함께 비교합니다.",
          ]}
        />
        <strong className="conclusionLine v2-reading-note">정책적 의미: 같은 생활권이라도 먼저 보완할 서비스는 다를 수 있습니다.</strong>
        <LegendV2 />
        <div className="smallMultiples">
          {services.map((service) => (
            <article key={service.key} className="servicePanel">
              <div className="panelHead">
                <div>
                  <p>우선 확인 생활권 TOP 3</p>
                  <h3 className="ko-card-title">
                    <span className="serviceIcon" style={{ color: service.color, borderColor: service.color }}>{service.icon}</span>
                    {service.label} 접근성
                  </h3>
                  <strong className="serviceStatus">평균 {serviceAverage(areas, service.key)}점</strong>
                </div>
                <span style={{ background: service.color }} />
              </div>
              <MapPanelV2 areas={areas} points={points} metric={service.key} compact serviceFilter={service.point} />
              <ServiceTopSummary areas={areas} metric={service.key} />
              <p className="policyHint ko-card-desc">{service.policy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="screen-3" className="v2-section screen overlapScreen">
        <SectionHeaderV2
          eyebrow="화면 3 · 어디가 우선인가"
          title="접근이 어렵고 지원수요가 높은 곳부터 확인합니다."
          note={[
            "가로축은 접근 어려움, 세로축은 지원수요입니다.",
            "오른쪽 위에 가까울수록 현장 확인 우선순위가 높습니다.",
          ]}
          className="prioritySectionTitle"
        />
        <strong className="conclusionLine v2-reading-note">우선 점검은 예산 투입 확정이 아니라, 현장 확인의 우선순위를 정하기 위한 정책 탐색 결과입니다.</strong>
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
            "단기 점검과 중기 검토 과제를 분리해 실제 부서 협업으로 이어지게 구성했습니다.",
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
                  <dd><HighlightedPolicyText text={plan.signal} /></dd>
                </div>
                <div>
                  <dt>단기 점검</dt>
                  <dd><HighlightedPolicyText text={plan.now} /></dd>
                </div>
                <div>
                  <dt>중기 검토</dt>
                  <dd><HighlightedPolicyText text={plan.mid} /></dd>
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
