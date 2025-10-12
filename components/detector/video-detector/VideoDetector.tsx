"use client";

import { useState, useCallback, useEffect } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { usePoseStore } from "@/store/poseStore";
import { useVideo } from "@/hooks/useVideo";
import { VideoControls } from "./ui/VideoControls";
import { VideoCanvas } from "./ui/VideoCanvas";
import { AngleDisplayCard } from "../AngleDisplayCard";

// 샘플 비디오 목록 (public/videos 폴더)
const SAMPLE_VIDEOS = [
  {
    name: "Test_H264",
    path: "/videos/test_h264.m4v",
  },
];

export default function VideoDetector() {
  const { liveLandmarker, isInitialized } = useMediaPipe();
  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    selectedVideo,
    loadVideo,
    togglePlay,
    seekTo,
  } = useVideo();
  const { video } = usePoseStore();

  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // 재생 속도 변경
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [videoRef, playbackSpeed]);

  // 비디오 선택 핸들러
  const handleVideoSelect = useCallback(
    (path: string, name: string) => {
      loadVideo(path, name);
    },
    [loadVideo]
  );

  // 시간 이동
  const handleSeek = useCallback(
    (value: number[]) => {
      seekTo(value[0]);
    },
    [seekTo]
  );

  // 10초 앞으로
  const skipForward = useCallback(() => {
    seekTo(Math.min(currentTime + 10, duration));
  }, [currentTime, duration, seekTo]);

  // 10초 뒤로
  const skipBackward = useCallback(() => {
    seekTo(Math.max(currentTime - 10, 0));
  }, [currentTime, seekTo]);

  return (
    <div className="w-full space-y-4">
      <VideoCanvas
        videoRef={videoRef}
        isPlaying={isPlaying}
        selectedVideo={selectedVideo}
        isInitialized={isInitialized}
        landmarker={liveLandmarker}
      />

      <AngleDisplayCard angles={video.angles} showSimilarity={false} />

      <VideoControls
        selectedVideo={selectedVideo}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackSpeed={playbackSpeed}
        isInitialized={isInitialized}
        videoFps={video.fps}
        sampleVideos={SAMPLE_VIDEOS}
        onVideoSelect={handleVideoSelect}
        onTogglePlay={togglePlay}
        onSkipBackward={skipBackward}
        onSkipForward={skipForward}
        onSeek={handleSeek}
        onSpeedChange={setPlaybackSpeed}
      />
    </div>
  );
}
