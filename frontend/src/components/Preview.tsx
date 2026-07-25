import type { RefObject } from "react";
import RecorderCanvas from "./RecorderCanvas";

interface PreviewProps {
  stream: MediaStream | null;
  webcamStream: MediaStream | null;
  webcamStyle?: "circle" | "rounded" | "square";
  outputWidth: number;
  outputHeight: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function Preview({
  stream,
  webcamStream,
  webcamStyle,
  outputWidth,
  outputHeight,
  canvasRef,
}: PreviewProps) {
  return (
    <RecorderCanvas
      ref={canvasRef}
      displayStream={stream}
      webcamStream={webcamStream}
      webcamStyle={webcamStyle}
      outputWidth={outputWidth}
      outputHeight={outputHeight}
    />
  );
}
