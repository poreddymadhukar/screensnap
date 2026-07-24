import { useEffect, useRef } from "react";
import WebcamOverlay from "./WebcamOverlay";

interface PreviewProps {
  stream: MediaStream | null;
  webcamEnabled: boolean;
}

export default function Preview({
  stream,
  webcamEnabled,
}: PreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (stream) {
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="preview-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="preview-video"
      />

      {!stream && (
        <div className="preview-placeholder">
          Live Preview
        </div>
      )}

      <WebcamOverlay enabled={webcamEnabled} />
    </div>
  );
}