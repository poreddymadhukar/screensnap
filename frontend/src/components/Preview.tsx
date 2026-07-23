import { useEffect, useRef } from 'react';

interface PreviewProps {
  stream?: MediaStream;
}

export default function Preview({ stream }: PreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="preview">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="preview-video"
      />
    </div>
  );
}
