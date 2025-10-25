import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Video } from "lucide-react";

interface VideoControlsProps {
  selectedVideo: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  isInitialized: boolean;
  videoFps: number;
  sampleVideos: Array<{ name: string; path: string }>;
  onVideoSelect: (path: string, name: string) => void;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (value: number[]) => void;
  onSpeedChange: (speed: number) => void;
}

export function VideoControls({
  selectedVideo,
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  isInitialized,
  videoFps,
  sampleVideos,
  onVideoSelect,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onSpeedChange,
}: VideoControlsProps) {
  // 시간 포맷 (초 → MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* 샘플 비디오 선택 */}
      <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Video className="w-4 h-4 text-primary" /> 샘플 비디오 선택
        </h4>
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {sampleVideos.map((video) => (
            <Button
              key={video.path}
              onClick={() => onVideoSelect(video.path, video.name)}
              variant={selectedVideo === video.name ? "default" : "outline"}
              className="h-auto py-2 px-4 text-sm whitespace-nowrap flex-shrink-0"
              disabled={!isInitialized}
            >
              {video.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 재생 컨트롤 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>재생 컨트롤</span>
            <Badge
              variant="outline"
              className="text-xs font-mono min-w-16 justify-center"
            >
              {videoFps > 0 ? `${videoFps} FPS` : "FPS -"}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedVideo ? (
            <>
              {/* 시간 슬라이더 */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={onSeek}
                  disabled={!selectedVideo}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span className="text-primary font-bold">
                    {formatTime(currentTime)}
                  </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 버튼 그룹: 뒤로/재생/앞으로 */}
              <div className="flex items-center gap-3">
                {/* 10초 뒤로 가기 버튼 */}
                <Button
                  onClick={onSkipBackward}
                  size="icon"
                  variant="outline"
                  className="w-12 h-12"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                {/* 재생/일시정지 버튼 */}
                <Button
                  onClick={onTogglePlay}
                  size="lg"
                  className="gap-2 flex-1 max-w-48 h-12 text-lg font-bold transition-all duration-150"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      일시정지
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      재생
                    </>
                  )}
                </Button>

                {/* 10초 앞으로 가기 버튼 */}
                <Button
                  onClick={onSkipForward}
                  size="icon"
                  variant="outline"
                  className="w-12 h-12"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* 재생 속도 컨트롤 */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  재생 속도
                </h4>
                <div className="flex gap-1 flex-wrap">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <Button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      className="min-w-12"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
