
import React, { useRef, useState, useEffect } from 'react';
import { FrameData } from '../types';

interface VideoProcessorProps {
  file: File;
  onFramesExtracted: (frames: FrameData[]) => void;
  onProgress: (progress: number) => void;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ file, onFramesExtracted, onProgress }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file || isProcessing) return;

    const processVideo = async () => {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const url = URL.createObjectURL(file);
      video.src = url;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });

      const duration = video.duration;
      const frameCount = 10;
      const frames: FrameData[] = [];
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < frameCount; i++) {
        const time = (duration / frameCount) * i + (duration / frameCount / 2);
        video.currentTime = time;

        await new Promise((resolve) => {
          video.onseeked = () => resolve(true);
        });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push({
            timestamp: time,
            dataUrl: canvas.toDataURL('image/jpeg', 0.7)
          });
        }
        onProgress(Math.round(((i + 1) / frameCount) * 100));
      }

      onFramesExtracted(frames);
      URL.revokeObjectURL(url);
    };

    processVideo();
  }, [file]);

  return (
    <div className="hidden">
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default VideoProcessor;
