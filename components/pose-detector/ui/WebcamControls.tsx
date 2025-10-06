import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff } from "lucide-react";

interface WebcamControlsProps {
  isActive: boolean;
  isInitialized: boolean;
  webcamFps: number;
  onStart: () => void;
  onStop: () => void;
}

export function WebcamControls({
  isActive,
  isInitialized,
  webcamFps,
  onStart,
  onStop,
}: WebcamControlsProps) {
  return (
    <div className='flex items-center gap-3'>
      <Button
        onClick={onStart}
        disabled={isActive || !isInitialized}
        size='lg'
        className='gap-2'
      >
        <Camera className='w-4 h-4' />
        Start Webcam
      </Button>

      <Button
        onClick={onStop}
        disabled={!isActive}
        variant='destructive'
        size='lg'
        className='gap-2'
      >
        <CameraOff className='w-4 h-4' />
        Stop
      </Button>

      {!isInitialized && (
        <Badge variant='secondary'>MediaPipe 초기화 중...</Badge>
      )}

      {webcamFps > 0 && <Badge variant='outline'>{webcamFps} FPS</Badge>}
    </div>
  );
}
