import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Gauge } from "lucide-react";
import { JointAngles } from "@/types/pose";

interface AngleDisplayCardProps {
  angles: JointAngles | null;
  similarity?: number;
  showSimilarity?: boolean;
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

  return (
    <div className="space-y-6">
      {showSimilarity && (
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
