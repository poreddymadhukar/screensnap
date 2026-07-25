import type { RefObject } from "react";
import RecorderCanvas from "./RecorderCanvas";

interface PreviewProps {
  stream: MediaStream | null;
  webcamStream: MediaStream | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function Preview({
  stream,
  webcamStream,
  canvasRef,
}: PreviewProps) {
  return (
    <div className="preview-container">
      <RecorderCanvas
        ref={canvasRef}
        displayStream={stream}
        webcamStream={webcamStream}
      />
    </div>
  );
}
