import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, Activity, Gauge, ChartNetwork } from "lucide-react";
import { JointAngles } from "@/types/pose";
import { useEffect, useRef } from "react";

interface AngleDisplayCardProps {
  angles: JointAngles | null;
  similarity?: number;
  showSimilarity?: boolean;
}
function SimilarityMinuteChart({
  value,
  width = 520,
  height = 160,
  yMin = 0,
  yMax = 100,
  intervalMs = 60000,
  maxPoints = 11,
  labelUnit = "m",
  running = true,
}: {
  value: number | undefined;
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
  intervalMs?: number;
  maxPoints?: number;
  labelUnit?: string;
  running?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seriesRef = useRef<number[]>([]);
  const valueRef = useRef<number>(NaN);
  const hasValueRef = useRef(false);
  const sampleCountRef = useRef(0);
  const startedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const n = Number(value);
    if (Number.isFinite(n)) {
      hasValueRef.current = true;
      valueRef.current = Math.min(yMax, Math.max(yMin, n));
    } else {
      hasValueRef.current = false;
      valueRef.current = NaN;
    }
  }, [value, yMin, yMax]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const draw = () => {
      const margin = { left: 40, right: 10, top: 10, bottom: 22 };
      const plotW = width - margin.left - margin.right;
      const plotH = height - margin.top - margin.bottom;

      ctx.clearRect(0, 0, width, height);

      const gridColor = "#cbd5e1";
      const axisColor = "#475569";
      const lineColor = "#2563eb";
      const font =
        "10px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

      const xForSlot = (slot: number) => {
        const n = Math.max(1, maxPoints - 1);
        const ratio = slot / n;
        return margin.left + ratio * plotW;
      };
      const yForV = (v: number) => {
        const r = (v - yMin) / (yMax - yMin);
        return margin.top + (1 - Math.max(0, Math.min(1, r))) * plotH;
      };

      ctx.save();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;

      ctx.fillStyle = axisColor;
      ctx.font = font;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const H_TICKS = 5;
      for (let i = 0; i <= H_TICKS; i++) {
        const v = yMin + ((yMax - yMin) * i) / H_TICKS;
        const y = yForV(v);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillText(`${v}`, margin.left - 6, y);
        ctx.globalAlpha = 0.25;
      }

      const arr = seriesRef.current;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let slot = 0; slot < maxPoints; slot++) {
        const x = xForSlot(slot);
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, height - margin.bottom);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const firstLabel = Math.max(1, sampleCountRef.current - (maxPoints - 1));

      for (let slot = 0; slot < maxPoints; slot++) {
        const x = xForSlot(slot);
        const labelVal = firstLabel + slot;
        ctx.fillText(`${labelVal}${labelUnit}`, x, height - margin.bottom + 4);
      }

      ctx.globalAlpha = 0.25;
      ctx.restore();
      // axes
      ctx.save();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(40, height - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, height - 22);
      ctx.lineTo(width - 10, height - 22);
      ctx.stroke();
      ctx.restore();

      // data
      if (arr.length >= 1) {
        if (arr.length >= 2) {
          ctx.beginPath();
          for (let i = 0; i < arr.length; i++) {
            const x = xForSlot(i);
            const y = yForV(arr[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.lineWidth = 2;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.strokeStyle = lineColor;
          ctx.stroke();
        }
        // 마지막 점 마커
        const lastSlot = arr.length - 1;
        const lastX = xForSlot(lastSlot);
        const lastY = yForV(arr[arr.length - 1]);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
      }
    };

    const pushAndRedraw = () => {
      if (!Number.isFinite(valueRef.current)) return;
      const arr = seriesRef.current;
      arr.push(valueRef.current as number);
      sampleCountRef.current += 1;

      if (arr.length > maxPoints) {
        arr.shift();
      }
      draw();
    };
    draw();

    if (!running) {
      return () => {};
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const waitForFirst = () => {
      if (!hasValueRef.current || !Number.isFinite(valueRef.current)) {
        startTimeoutRef.current = window.setTimeout(waitForFirst, 50);
        return;
      }
      startTimeoutRef.current = window.setTimeout(() => {
        pushAndRedraw();
        intervalRef.current = window.setInterval(pushAndRedraw, intervalMs);
      }, intervalMs);
    };
    waitForFirst();

    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startedRef.current = false;
    };
  }, [running, width, height, yMin, yMax, intervalMs, maxPoints, labelUnit]);

  return <canvas ref={canvasRef} />;
}

const groupAngles = (angles: JointAngles) => {
  const format = (key: keyof JointAngles) => ({
    label: key.replace(/([A-Z])/g, " $1").trim(),
    value: angles[key].toFixed(1),
  });

  return {
    leftSide: {
      arm: [format("leftShoulder"), format("leftElbow"), format("leftWrist")],
      leg: [format("leftHip"), format("leftKnee"), format("leftAnkle")],
    },
    center: [
      format("neckAngle"),
      format("spine"),
      format("leftHipShoulderAlign"),
      format("rightHipShoulderAlign"),
    ],
    rightSide: {
      arm: [
        format("rightShoulder"),
        format("rightElbow"),
        format("rightWrist"),
      ],
      leg: [format("rightHip"), format("rightKnee"), format("rightAnkle")],
    },
  };
};

const AngleSection = ({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: string }[];
}) => (
  <div className="space-y-1">
    <h4 className="text-xs font-bold uppercase text-gray-500 border-b pb-1 mb-1">
      {title}
    </h4>
    {data.map((item) => (
      <div key={item.label} className="flex justify-between font-mono">
        <span className="text-gray-600 truncate">
          {item.label.replace(/Left|Right/g, "").trim()}:
        </span>
        <span className="font-semibold">{item.value}°</span>
      </div>
    ))}
  </div>
);

export function AngleDisplayCard({
  angles: webcamAngles,
  similarity = 0,
  showSimilarity = true,
}: AngleDisplayCardProps) {
  if (!webcamAngles) return null;

  const grouped = groupAngles(webcamAngles);
  // console.log('grouped', grouped);

  return (
    <div className="space-y-6">
      {showSimilarity && (
        <>
          {/* 기존 점수 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Similarity Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center h-20">
                <span className="text-3xl font-bold text-blue-600">
                  {similarity.toFixed(0)}점
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ChartNetwork className="w-5 h-5" />
                Similarity Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2">
                <SimilarityMinuteChart
                  value={similarity}
                  width={520}
                  height={160}
                  intervalMs={60000}
                  maxPoints={10}
                  yMin={0}
                  yMax={100}
                />
                <span className="text-xs text-gray-500">
                  Recent 10-minute data
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Joint Angles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-sm">
            {/* 1열: 왼쪽 팔다리 */}
            <div className="col-span-1 space-y-4">
              <AngleSection title="Left Arm" data={grouped.leftSide.arm} />
              <AngleSection title="Left Leg" data={grouped.leftSide.leg} />
            </div>

            {/* 2열: 중앙 몸통 */}
            <div className="col-span-1 space-y-4">
              <AngleSection title="Torso" data={grouped.center} />
            </div>

            {/* 3열: 오른쪽 팔다리 */}
            <div className="col-span-1 space-y-4">
              <AngleSection title="Right Arm" data={grouped.rightSide.arm} />
              <AngleSection title="Right Leg" data={grouped.rightSide.leg} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
