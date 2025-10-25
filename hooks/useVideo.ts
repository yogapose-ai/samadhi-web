import { useState, useRef, useCallback } from "react";

interface UseVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  selectedVideo: string;
  loadVideo: (videoPath: string, name: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
}

export function useVideo(): UseVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState("");

  // 비디오 로드
  const loadVideo = useCallback((videoPath: string, name: string) => {
    if (!videoRef.current) return;

    videoRef.current.src = videoPath;
    videoRef.current.load();
    setSelectedVideo(name);
    setIsPlaying(false);

    videoRef.current.onloadedmetadata = () => {
      setDuration(videoRef.current?.duration || 0);
    };

    videoRef.current.ontimeupdate = () => {
      setCurrentTime(videoRef.current?.currentTime || 0);
    };

    // console.log(`✅ Video loaded: ${name}`);
  }, []);

  // 재생
  const play = useCallback(() => {
    videoRef.current?.play();
    setIsPlaying(true);
  }, []);

  // 일시정지
  const pause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // 토글
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // 특정 시간으로 이동
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    selectedVideo,
    loadVideo,
    play,
    pause,
    togglePlay,
    seekTo,
  };
}
