"use client";
import React, { useState } from "react";
import {
  Layout,
  Card,
  Typography,
  Button,
  Col,
  Row,
  Slider,
  Empty,
  Spin,
  Tag,
  DatePicker,
  Pagination,
} from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useRouter } from "next/navigation";

dayjs.extend(isBetween);

const { Sider, Content } = Layout;
const { Text } = Typography;

/* ───────────────────────── 타입 ───────────────────────── */
interface Segment {
  startSec: number;
  endSec: number;
  pose: string;
  mean: number;
}
interface WorkoutRecord {
  date: string; // "YYYY-MM-DD"
  duration: number;
  youtubeUrl: string;
  mean: number;
  segments?: Segment[]; // ← 10개 묶음(옵션)
}
interface User {
  id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  records: WorkoutRecord[];
}
type DisplayRecord = WorkoutRecord & {
  id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
};

/* ──────────────────────── 샘플 데이터 ──────────────────────── */
/** 10개 묶음 생성기 */
const makeSegments = (seed: number): Segment[] =>
  Array.from({ length: 10 }).map((_, i) => {
    const start = i * 30;
    const end = start + 25 + (seed % 5);
    const poses = [
      "Mountain",
      "Warrior II",
      "Triangle",
      "Chair",
      "Plank",
      "Tree",
    ];
    return {
      startSec: start,
      endSec: end,
      pose: poses[(i + seed) % poses.length],
      mean: 78 + ((i * 7 + seed) % 15), // 78~92
    };
  });

/** 한 사람만 segments 보유(최근 2건), 예시 데이터 두 개(=두 기록) */
const SAMPLE_USER: User = {
  id: "U001",
  name: "홍길동",
  age: 31,
  height: 178,
  weight: 72,
  records: [
    {
      date: "2025-11-02",
      duration: 90,
      youtubeUrl: "https://www.youtube.com/watch?v=1W9gMxLoW6Q",
      mean: 79.6,
      segments: makeSegments(2), // ✅ 세그먼트 포함 (10개)
    },
    {
      date: "2025-11-01",
      duration: 65,
      youtubeUrl: "https://www.youtube.com/watch?v=OBTl49bVk94",
      mean: 87.4,
      segments: makeSegments(7), // ✅ 세그먼트 포함 (10개)
    },
    // 이하 기록은 segments 없음
    {
      date: "2025-10-29",
      duration: 45,
      youtubeUrl: "https://www.youtube.com/watch?v=5g-3Yb8Tiv4",
      mean: 91.2,
    },
    {
      date: "2025-10-27",
      duration: 40,
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      mean: 83.1,
    },
    {
      date: "2025-10-25",
      duration: 55,
      youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      mean: 88.9,
    },
    {
      date: "2025-10-20",
      duration: 70,
      youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      mean: 92.3,
    },
  ],
};

const SAMPLE_RECORDS: DisplayRecord[] = SAMPLE_USER.records.map((rec, idx) => ({
  id: `${SAMPLE_USER.id}-${idx + 1}`,
  name: SAMPLE_USER.name,
  age: SAMPLE_USER.age,
  height: SAMPLE_USER.height,
  weight: SAMPLE_USER.weight,
  ...rec,
}));

/* ─────────────────────── 스타일 ─────────────────────── */
const layoutStyle: React.CSSProperties = {
  height: "100vh",
  background: "#f5f5f5",
};
const siderStyle: React.CSSProperties = {
  background: "#fff",
  padding: 16,
  boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
};
const contentStyle: React.CSSProperties = {
  padding: 24,
  background: "#f5f5f5",
  overflowY: "auto",
};
const cardChrome: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
};
const buttonChrome: React.CSSProperties = {
  ...cardChrome,
  width: "100%",
  textAlign: "left",
  background: "#fff",
  border: "1px solid #eee",
  padding: 16,
  height: "auto",
  whiteSpace: "normal",
  display: "block",
  transition:
    "box-shadow .25s ease, transform .25s ease, border-color .25s ease",
  cursor: "default",
};
const buttonHover: React.CSSProperties = {
  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
  transform: "translateY(-3px)",
  borderColor: "#e2e2e2",
};
const SECTION_TITLE_FS = 17;
const TAG_FS = 14;
const LABEL_FS = 14;
const pill: React.CSSProperties = {
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: TAG_FS,
  lineHeight: "22px",
  border: "none",
};
const labelCss: React.CSSProperties = {
  opacity: 0.75,
  marginRight: 8,
  fontWeight: 600,
  fontSize: LABEL_FS,
};

/* 유튜브 썸네일 */
const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be"))
      return u.pathname.replace("/", "") || null;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
};
const getThumb = (url: string) => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

/* 카드형 컨테이너 */
const CardLikeBox: React.FC<
  React.PropsWithChildren & { onClick?: () => void }
> = ({ children, onClick }) => {
  const [hover, setHover] = useState(false);
  const clickable = typeof onClick === "function";
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      onClick={onClick}
      style={{
        ...buttonChrome,
        ...(hover ? buttonHover : {}),
        cursor: clickable ? "pointer" : "default",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </div>
  );
};

/* ───────────────────── 메인 컴포넌트 ───────────────────── */
const WorkoutDashboard: React.FC = () => {
  const router = useRouter();
  const [records] = useState<DisplayRecord[]>(SAMPLE_RECORDS);
  const [collapsed, setCollapsed] = useState(false);

  // 필터 UI 상태
  const [uiDuration, setUiDuration] = useState<[number, number]>([0, 999]);
  const [uiMean, setUiMean] = useState<[number, number]>([0, 100]);
  const [uiStartDate, setUiStartDate] = useState<Dayjs | null>(null);
  const [uiEndDate, setUiEndDate] = useState<Dayjs | null>(null);

  // 실제 적용값
  const [duration, setDuration] = useState<[number, number]>([0, 999]);
  const [mean, setMean] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const [loading, setLoading] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const applyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setDuration(uiDuration);
      setMean(uiMean);
      if (uiStartDate && uiEndDate) {
        const [s, e] = uiEndDate.isBefore(uiStartDate)
          ? [uiEndDate, uiStartDate]
          : [uiStartDate, uiEndDate];
        setDateRange([s.format("YYYY-MM-DD"), e.format("YYYY-MM-DD")]);
      } else {
        setDateRange([null, null]);
      }
      setCurrentPage(1);
      setLoading(false);
    }, 200);
  };

  const parseYMD = (d: string) => dayjs(d, "YYYY-MM-DD", true);
  const isInDateRange = (d: string) => {
    const [start, end] = dateRange;
    if (!start || !end) return true;
    const cur = parseYMD(d);
    return (
      cur.isValid() &&
      cur.isBetween(parseYMD(start), parseYMD(end), "day", "[]")
    );
  };

  const filtered = records.filter(
    (r) =>
      r.duration >= duration[0] &&
      r.duration <= duration[1] &&
      r.mean >= mean[0] &&
      r.mean <= mean[1] &&
      isInDateRange(r.date),
  );

  const sorted = [...filtered].sort(
    (a, b) => parseYMD(b.date).valueOf() - parseYMD(a.date).valueOf(),
  );

  // 페이지 데이터
  const start = (currentPage - 1) * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  const columnsCount = 4;
  const pageColumns: DisplayRecord[][] = Array.from(
    { length: columnsCount },
    () => [],
  );
  pageData.forEach((item, idx) => {
    pageColumns[idx % columnsCount].push(item);
  });

  type SectionProps = React.PropsWithChildren<{
    title: string;
    first?: boolean;
  }>;
  const Section = ({ title, first, children }: SectionProps) => (
    <div
      style={
        first
          ? {}
          : { borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12 }
      }
    >
      <Text strong style={{ fontSize: SECTION_TITLE_FS }}>
        {title}
      </Text>
      {children}
    </div>
  );

  // ✅ 카드 클릭 → 상세 페이지로 데이터 전달(segments가 있으면 함께 전달)
  const gotoDetail = (r: DisplayRecord) => {
    const q = new URLSearchParams({
      id: r.id,
      name: r.name,
      age: String(r.age),
      height: String(r.height),
      weight: String(r.weight),
      date: r.date,
      duration: String(r.duration),
      youtubeUrl: r.youtubeUrl,
      mean: String(r.mean),
      current: "0",
    });
    if (r.segments && r.segments.length > 0) {
      q.set("segments", JSON.stringify(r.segments)); // Next.js 라우터가 자동 인코딩
    }
    router.push(`/record/detail?${q.toString()}`);
  };

  const renderButtonCard = (r: DisplayRecord) => {
    const thumb = getThumb(r.youtubeUrl);
    return (
      <div key={r.id} style={{ marginBottom: 16 }}>
        <CardLikeBox onClick={() => gotoDetail(r)}>
          <Section title="운동 정보" first>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 10,
              }}
            >
              <Tag style={{ ...pill, background: "#FFF1E6" }}>
                <span style={labelCss}>날짜 : </span> {r.date}
              </Tag>
              <Tag style={{ ...pill, background: "#FFEFEF" }}>
                <span style={labelCss}>운동시간 : </span> {r.duration}분
              </Tag>
              {r.segments && (
                <Tag style={{ ...pill, background: "#E7F0FF" }}>
                  세그먼트 <b>&nbsp;{r.segments.length}</b>개
                </Tag>
              )}
            </div>
          </Section>

          <Section title="기록 정보">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 10,
              }}
            >
              <Tag style={{ ...pill, background: "#E9FFF3" }}>
                <span style={{ ...labelCss }}>유사도 평균 : </span>{" "}
                {r.mean.toFixed(1)}%
              </Tag>
            </div>

            {thumb && (
              <a
                href={r.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="유튜브 영상 보기"
                style={{
                  display: "block",
                  marginTop: 12,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    padding: 8,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={thumb}
                    alt="YouTube thumbnail"
                    style={{ width: "100%", borderRadius: 6, display: "block" }}
                  />
                </div>
              </a>
            )}
          </Section>
        </CardLikeBox>
      </div>
    );
  };

  return (
    <Layout style={layoutStyle}>
      {/* 왼쪽: 필터 사이드바 */}
      <Sider
        width={300}
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={siderStyle}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              onClick: () => setCollapsed((v) => !v),
              style: { fontSize: 20, cursor: "pointer" },
            },
          )}
        </div>

        {!collapsed && (
          <Button
            onClick={applyFilters}
            style={{
              width: "100%",
              background: "#003366",
              color: "#fff",
              border: "none",
              height: 38,
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 0.2,
              marginBottom: 16,
              marginTop: 10,
            }}
          >
            필터 적용
          </Button>
        )}

        {/* 간단 필터들 */}
        {!collapsed && (
          <>
            <Card
              size="small"
              title="운동시간 (분)"
              style={{ ...cardChrome, marginBottom: 12, textAlign: "center" }}
              headStyle={{
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 700,
              }}
              bodyStyle={{ padding: 16, fontSize: 15 }}
            >
              <Slider
                range
                min={0}
                max={999}
                value={uiDuration}
                onChange={(v) => setUiDuration(v as [number, number])}
              />
              <div style={{ textAlign: "center", color: "#555", fontSize: 15 }}>
                {uiDuration[0]}분 ~ {uiDuration[1]}분
              </div>
            </Card>

            <Card
              size="small"
              title="유사도 평균 (%)"
              style={{ ...cardChrome, marginBottom: 12, textAlign: "center" }}
              headStyle={{
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 700,
              }}
              bodyStyle={{ padding: 16, fontSize: 15 }}
            >
              <Slider
                range
                min={0}
                max={100}
                value={uiMean}
                onChange={(v) => setUiMean(v as [number, number])}
              />
              <div style={{ textAlign: "center", color: "#555", fontSize: 15 }}>
                {uiMean[0]}% ~ {uiMean[1]}%
              </div>
            </Card>

            <Card
              size="small"
              title="날짜"
              style={{ ...cardChrome, marginBottom: 12, textAlign: "center" }}
              headStyle={{
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 700,
              }}
              bodyStyle={{ padding: 16, fontSize: 15 }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <DatePicker
                  placeholder="Start date"
                  onChange={(val) => setUiStartDate(val)}
                  style={{ width: "100%" }}
                  allowClear
                />
                <DatePicker
                  placeholder="End date"
                  onChange={(val) => setUiEndDate(val)}
                  style={{ width: "100%" }}
                  allowClear
                />
              </div>
              <div
                style={{
                  textAlign: "center",
                  color: "#555",
                  fontSize: 15,
                  marginTop: 8,
                }}
              >
                {uiStartDate && uiEndDate
                  ? `${uiStartDate.format("YYYY-MM-DD")} ~ ${uiEndDate.format("YYYY-MM-DD")}`
                  : "전체 기간"}
              </div>
            </Card>
          </>
        )}
      </Sider>

      {/* 오른쪽: 그리드 + 페이지네이션 */}
      <Layout>
        <Content style={contentStyle}>
          <Spin spinning={loading}>
            {sorted.length === 0 ? (
              <div
                style={{
                  height: "60vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Empty description="조건에 맞는 기록이 없습니다" />
              </div>
            ) : (
              <>
                <Row gutter={16} align="top">
                  {pageColumns.map((colItems, colIdx) => (
                    <Col key={colIdx} span={6}>
                      {colItems.map(renderButtonCard)}
                    </Col>
                  ))}
                </Row>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 16,
                  }}
                >
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={sorted.length}
                    showSizeChanger={false}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </>
            )}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default WorkoutDashboard;
