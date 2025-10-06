import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { JointAngles } from "@/types/pose";

interface AngleDisplayCardProps {
  webcamAngles: JointAngles | null;
}

export function AngleDisplayCard({ webcamAngles }: AngleDisplayCardProps) {
  if (!webcamAngles) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg flex items-center gap-2'>
          <Activity className='w-5 h-5' />
          Joint Angles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-mono'>
          {Object.entries(webcamAngles).map(([joint, angle]) => (
            <div key={joint} className='flex justify-between'>
              <span className='text-gray-600'>
                {joint.replace(/([A-Z])/g, " $1").trim()}:
              </span>
              <span className='font-semibold'>{angle.toFixed(1)}°</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
