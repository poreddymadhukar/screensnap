import type { RefObject } from "react";
import RecorderCanvas from "./RecorderCanvas";

interface PreviewProps {
  stream: MediaStream | null;
  webcamStream: MediaStream | null;
  webcamStyle?: "circle" | "rounded" | "square";
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function Preview({
  stream,
  webcamStream,
  webcamStyle,
  canvasRef,
}: PreviewProps) {
  return (
    <RecorderCanvas
      ref={canvasRef}
      displayStream={stream}
      webcamStream={webcamStream}
      webcamStyle={webcamStyle}
    />
  );
}
