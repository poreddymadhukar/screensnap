import { useEffect, useRef, useState } from "react";

interface WebcamOverlayProps {
  enabled: boolean;
}

export default function WebcamOverlay({ enabled }: WebcamOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("webcam-position");

    if (saved) {
      return JSON.parse(saved);
    }

    return {
      x: 20,
      y: 20,
    };
  });
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem("webcam-size");

    if (saved) {
      return Number(saved);
    }

    return 140;
  });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const [startSize, setStartSize] = useState(140);

  const [startMouseX, setStartMouseX] = useState(0);
  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) return;

    setDragging(true);

    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    setResizing(true);
    setStartSize(size);
    setStartMouseX(e.clientX);
  };
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging && !resizing) return;

      if (resizing) {
        const delta = e.clientX - startMouseX;

        const newSize = Math.max(80, Math.min(startSize + delta, 300));

        setSize(newSize);

        return;
      }

      const parent = containerRef.current?.parentElement;
      const overlay = containerRef.current;

      if (!parent || !overlay) return;

      // Parent and webcam dimensions
      const parentRect = parent.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();

      // Calculate new position relative to the parent
      const newX = e.clientX - parentRect.left - offset.x;
      const newY = e.clientY - parentRect.top - offset.y;

      // Maximum allowed position
      const maxX = parentRect.width - overlayRect.width;
      const maxY = parentRect.height - overlayRect.height;

      // Keep webcam inside the preview
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({
        x: boundedX,
        y: boundedY,
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };

    const handleWindowBlur = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [dragging, resizing, offset, startSize, startMouseX]);
  useEffect(() => {
    localStorage.setItem("webcam-position", JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!enabled) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.play().catch((err) => {
            console.error("Play failed:", err);
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem("webcam-size", String(size));
  }, [size]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="webcam-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        draggable={false}
        className="webcam-overlay"
        onMouseDown={handleMouseDown}
      />

      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}
