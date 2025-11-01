"use client";
import React, { useMemo, useCallback } from "react";
import { Row, Col, Typography, Card, Progress, Tag, Button } from "antd";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

/* ───────────── 스타일 토큰 ───────────── */
const SURFACE = "#ffffff";
const BG = "#f5f7fb";
const RADIUS = 14;
const SHADOW = "0 10px 30px rgba(16,24,40,0.06)";
const G1 = "linear-gradient(135deg, #5B86E5 0%, #36D1DC 100%)";
const G2 = "linear-gradient(135deg, #7F7FD5 0%, #86A8E7 60%, #91EAE4 100%)";
const G3 = "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)";

/* ───────────── 폰트 사이즈 프리셋 ───────────── */
const FS = {
  cardHeader: 18,
  gridLabel: 18,
  gridValue: 22,
  title: "clamp(24px, 2.6vw, 34px)",
  tag: 16,
  avg: 22,
  time: 19,
  pose: "clamp(32px, 4vw, 56px)",
};

/* 공용 카드 */
const UniformCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  gradient?: string;
  minH?: number;
  children: React.ReactNode;
}> = ({ title, icon, gradient = G1, minH = 152, children }) => (
  <div
    style={{
      background: SURFACE,
      borderRadius: RADIUS,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: SHADOW,
      minHeight: minH,
    }}
  >
    <div
      style={{
        background: gradient,
        color: "white",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: "rgba(255,255,255,0.25)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </span>
      <Text
        style={{ color: "white", fontWeight: 800, fontSize: FS.cardHeader }}
      >
        {title}
      </Text>
    </div>
    <div style={{ padding: 16, display: "grid", gap: 12, flex: 1 }}>
      {children}
    </div>
  </div>
);

/* 라벨-값 그리드 */
const InfoGrid: React.FC<{
  data: Record<string, React.ReactNode>;
  cols?: string;
}> = ({ data, cols = "120px 1fr" }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: cols,
      rowGap: 10,
      columnGap: 16,
      alignItems: "start",
    }}
  >
    {Object.entries(data).map(([k, v]) => (
      <React.Fragment key={k}>
        <div
          style={{
            textAlign: "left",
            fontWeight: 800,
            color: "#2c2c2c",
            fontSize: FS.gridLabel,
          }}
        >
          {k}
        </div>
        <div
          style={{
            textAlign: "left",
            color: "#475467",
            fontSize: FS.gridValue,
          }}
        >
          {v}
        </div>
      </React.Fragment>
    ))}
  </div>
);

/* 시간 포맷 mm:ss */
const toMMSS = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

/* ───────────── 타입 ───────────── */
type Segment = { startSec: number; endSec: number; pose: string; mean: number };

/* 왼쪽 세션 요약 */
const BigPanel: React.FC<{
  seg: Segment | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}> = ({ seg, index, total, onPrev, onNext }) => {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: RADIUS,
        boxShadow: SHADOW,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: "min(72vh, calc(100vh - 160px))",
        height: "100%",
      }}
    >
      {/* 중앙 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* 좌/우 이동 버튼 */}
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={onPrev}
          disabled={index <= 0}
          style={{
            position: "absolute",
            left: 24,
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: 999,
            height: 48,
            width: 48,
            fontSize: 18,
          }}
          aria-label="이전 구간"
        />
        <div
          style={{
            width: "min(80%, 960px)",
            minWidth: 460,
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #eef0f4",
            boxShadow: "0 16px 40px rgba(16,24,40,0.07)",
            padding: "52px 40px",
          }}
        >
          <div
            style={{
              fontSize: FS.pose,
              fontWeight: 900,
              letterSpacing: 0.2,
              lineHeight: 1.25,
            }}
          >
            {seg ? seg.pose : "자세 이름"}
          </div>
        </div>
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={onNext}
          disabled={index >= total - 1}
          style={{
            position: "absolute",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: 999,
            height: 48,
            width: 48,
            fontSize: 18,
          }}
          aria-label="다음 구간"
        />

        {/* 인덱스 표시 */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 22,
            fontSize: 22,
            color: "#98a2b3",
            fontWeight: 800,
          }}
        >
          {total > 0 ? `${index + 1} / ${total}` : "- / -"}
        </div>
      </div>

      {/* 박스 밖, 아래쪽 설명 */}
      <div style={{ textAlign: "center", marginTop: 8, marginBottom: 2 }}>
        <div style={{ fontWeight: 800, fontSize: FS.avg, color: "#344054" }}>
          평균 점수{" "}
          <span style={{ fontWeight: 900 }}>
            {seg ? `${seg.mean.toFixed(1)}%` : "-"}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            color: "#667085",
            fontWeight: 700,
            fontSize: FS.time,
          }}
        >
          {seg
            ? `${toMMSS(seg.startSec)} ~ ${toMMSS(seg.endSec)}`
            : "00:00 ~ 00:00"}
        </div>
      </div>
    </div>
  );
};

/* ───────────── 페이지 ───────────── */
const RecordDetailPage: React.FC = () => {
  const sp = useSearchParams();
  const router = useRouter();

  const name = sp.get("name") ?? "";
  const age = sp.get("age") ?? "";
  const height = sp.get("height") ?? "";
  const weight = sp.get("weight") ?? "";
  const date = sp.get("date") ?? "";
  const duration = sp.get("duration") ?? "";
  const youtubeUrl = sp.get("youtubeUrl") ?? "";
  const mean = sp.get("mean") ?? "";
  const meanNum = Number.isFinite(Number(mean)) ? Number(mean) : undefined;

  // segments=[...] (URI 인코딩된 JSON) + current
  const { segments, currentIdx } = useMemo(() => {
    let segs: Segment[] = [];
    let idx = 0;
    const raw = sp.get("segments");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          segs = parsed
            .map((s) => ({
              startSec: Number(s.startSec),
              endSec: Number(s.endSec),
              pose: String(s.pose ?? ""),
              mean: Number(s.mean),
            }))
            .filter(
              (s) =>
                Number.isFinite(s.startSec) &&
                Number.isFinite(s.endSec) &&
                s.pose.length > 0 &&
                Number.isFinite(s.mean),
            );
        }
      } catch {
        /* ignore */
      }
    }
    const c = sp.get("current");
    if (c && Number.isFinite(Number(c))) {
      idx = Math.min(Math.max(0, Number(c)), Math.max(0, segs.length - 1));
    }
    return { segments: segs, currentIdx: idx };
  }, [sp]);

  const sel = segments[currentIdx] ?? null;

  // 〈/〉 버튼 → URL 쿼리 current만 업데이트
  const updateIndex = useCallback(
    (nextIdx: number) => {
      const params = new URLSearchParams(sp.toString());
      params.set("current", String(nextIdx));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, sp],
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: "18px 0" }}>
      <div style={{ margin: "0 auto", padding: "0 18px" }}>
        {/* 헤더 */}
        <Card
          style={{
            width: "100%",
            border: "none",
            borderRadius: RADIUS,
            boxShadow: SHADOW,
            background: SURFACE,
            marginBottom: 14,
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Row align="middle" justify="space-between" gutter={12}>
            <Col>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: G1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 8px 18px rgba(91,134,229,0.35)",
                  }}
                >
                  <UserOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Title
                    level={3}
                    style={{ margin: 0, fontWeight: 900, fontSize: FS.title }}
                  >
                    {name || "운동 기록 상세"}
                  </Title>
                  {(age || height || weight) && (
                    <Text type="secondary" style={{ fontSize: 16 }}>
                      {age && `${age}세`} {height && `· ${height}cm`}{" "}
                      {weight && `· ${weight}kg`}
                    </Text>
                  )}
                </div>
              </div>
            </Col>
            <Col>
              {date && (
                <Tag
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontWeight: 800,
                    fontSize: FS.tag,
                  }}
                  color="blue"
                >
                  <CalendarOutlined /> &nbsp;{date}
                </Tag>
              )}
            </Col>
          </Row>
        </Card>

        {/* 2열: 왼쪽 가로폭 넓힘 (lg/xl=18) */}
        <Row
          gutter={16}
          align="top"
          style={{ display: "flex", alignItems: "stretch" }}
        >
          {/* 왼쪽: 중앙 박스 & 네비 */}
          <Col
            xs={24}
            lg={18}
            xl={18}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <BigPanel
              seg={sel}
              index={currentIdx}
              total={segments.length}
              onPrev={() => currentIdx > 0 && updateIndex(currentIdx - 1)}
              onNext={() =>
                currentIdx < segments.length - 1 && updateIndex(currentIdx + 1)
              }
            />
          </Col>

          {/* 오른쪽: 정보 스택 */}
          <Col xs={24} lg={6} xl={6}>
            <div style={{ display: "grid", gap: 12, height: "100%" }}>
              <UniformCard
                title="개인 정보"
                icon={<UserOutlined />}
                gradient={G2}
                minH={168}
              >
                <InfoGrid
                  data={{
                    나이: age ? `${age}세` : "-",
                    키: height ? `${height}cm` : "-",
                    몸무게: weight ? `${weight}kg` : "-",
                  }}
                />
              </UniformCard>

              <UniformCard
                title="기록 정보"
                icon={<LineChartOutlined />}
                gradient={G3}
                minH={168}
              >
                <InfoGrid
                  data={{
                    "유사도 평균":
                      meanNum !== undefined ? `${meanNum.toFixed(1)}%` : "-",
                  }}
                />
                {typeof meanNum === "number" && (
                  <div style={{ marginTop: 6 }}>
                    <Progress
                      percent={Number(meanNum.toFixed(1))}
                      strokeWidth={10}
                    />
                  </div>
                )}
              </UniformCard>

              <UniformCard
                title="기록 정보"
                icon={<ClockCircleOutlined />}
                gradient={G1}
                minH={168}
              >
                <InfoGrid
                  data={{
                    날짜: date || "-",
                    운동시간: duration ? `${duration}분` : "-",
                    "유튜브 URL": youtubeUrl ? (
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 16 }}
                      >
                        {youtubeUrl}
                      </a>
                    ) : (
                      "-"
                    ),
                  }}
                />
              </UniformCard>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RecordDetailPage;
