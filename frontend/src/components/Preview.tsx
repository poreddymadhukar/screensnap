import { useEffect, useRef } from "react";

interface PreviewProps {
  stream: MediaStream | null;
}

export default function Preview({ stream }: PreviewProps) {
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
    </div>
  );
}