import { forwardRef, useEffect, useRef } from "react";

type RecorderCanvasProps = {
  displayStream: MediaStream | null;
  webcamStream?: MediaStream | null;
};

const RecorderCanvas = forwardRef<HTMLCanvasElement, RecorderCanvasProps>(
  function RecorderCanvas({ displayStream, webcamStream }, forwardedRef) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const webcamPositionRef = useRef<{ x: number; y: number } | null>(null);
    const webcamDiameterRef = useRef(140);
    const isDraggingRef = useRef(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isResizingRef = useRef(false);
    const resizeAnchorRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const video = document.createElement("video");
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      const webcamVideo = document.createElement("video");
      webcamVideo.muted = true;
      webcamVideo.autoplay = true;
      webcamVideo.playsInline = true;

      let frameId: number | null = null;
      let displayWidth = 0;
      let displayHeight = 0;
      const webcamMargin = 16;
      const minDiameter = 80;
      const maxDiameter = 280;
      const handleSize = 16;

      const clampWebcamPosition = (x: number, y: number, diameter: number) => {
        const maxX = Math.max(0, displayWidth - diameter);
        const maxY = Math.max(0, displayHeight - diameter);

        return {
          x: Math.min(Math.max(0, x), maxX),
          y: Math.min(Math.max(0, y), maxY),
        };
      };

      const ensureWebcamPosition = () => {
        const diameter = webcamDiameterRef.current;

        if (!webcamPositionRef.current) {
          webcamPositionRef.current = {
            x: Math.max(0, displayWidth - diameter - webcamMargin),
            y: Math.max(0, displayHeight - diameter - webcamMargin),
          };
          return;
        }

        webcamPositionRef.current = clampWebcamPosition(
          webcamPositionRef.current.x,
          webcamPositionRef.current.y,
          diameter,
        );
      };

      const getMousePosition = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      };

      const isInsideWebcam = (x: number, y: number) => {
        if (!webcamPositionRef.current) {
          return false;
        }

        const diameter = webcamDiameterRef.current;
        const radius = diameter / 2;
        const centerX = webcamPositionRef.current.x + radius;
        const centerY = webcamPositionRef.current.y + radius;
        const dx = x - centerX;
        const dy = y - centerY;

        return dx * dx + dy * dy <= radius * radius;
      };

      const getResizeHandleCenter = () => {
        const position = webcamPositionRef.current;
        if (!position) {
          return null;
        }

        const diameter = webcamDiameterRef.current;
        return {
          x: position.x + diameter,
          y: position.y + diameter,
        };
      };

      const isInsideResizeHandle = (x: number, y: number) => {
        const handleCenter = getResizeHandleCenter();
        if (!handleCenter) {
          return false;
        }

        const half = handleSize / 2 + 4;
        return (
          Math.abs(x - handleCenter.x) <= half &&
          Math.abs(y - handleCenter.y) <= half
        );
      };

      const paintBlack = () => {
        context.fillStyle = "#000000";
        context.fillRect(0, 0, displayWidth, displayHeight);
      };

      const resizeCanvas = () => {
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        if (width <= 0 || height <= 0) {
          return;
        }

        const dpr = window.devicePixelRatio || 1;
        displayWidth = Math.floor(width);
        displayHeight = Math.floor(height);

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        ensureWebcamPosition();
        paintBlack();
      };

      const drawFrame = () => {
        paintBlack();

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          context.drawImage(video, 0, 0, displayWidth, displayHeight);
        }

        if (webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          ensureWebcamPosition();
          const position = webcamPositionRef.current;
          if (!position) {
            frameId = window.requestAnimationFrame(drawFrame);
            return;
          }

          const diameter = webcamDiameterRef.current;
          const x = position.x;
          const y = position.y;
          const radius = diameter / 2;
          const centerX = x + radius;
          const centerY = y + radius;

          context.save();
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, Math.PI * 2);
          context.clip();
          context.drawImage(webcamVideo, x, y, diameter, diameter);
          context.restore();

          context.save();
          context.fillStyle = "#ffffff";
          context.strokeStyle = "#00000080";
          context.lineWidth = 1;
          context.fillRect(
            x + diameter - handleSize / 2,
            y + diameter - handleSize / 2,
            handleSize,
            handleSize,
          );
          context.strokeRect(
            x + diameter - handleSize / 2,
            y + diameter - handleSize / 2,
            handleSize,
            handleSize,
          );
          context.restore();
        }

        frameId = window.requestAnimationFrame(drawFrame);
      };

      resizeCanvas();

      if (displayStream) {
        video.srcObject = displayStream;
        void video.play().catch(() => {
          // If autoplay is blocked, keep drawing a black canvas.
        });
      }

      if (webcamStream) {
        webcamVideo.srcObject = webcamStream;
        void webcamVideo.play().catch(() => {
          // If autoplay is blocked, continue without webcam overlay.
        });
      }

      const handleMouseDown = (event: MouseEvent) => {
        if (
          !webcamStream ||
          webcamVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          return;
        }

        const mouse = getMousePosition(event);
        const position = webcamPositionRef.current;
        if (!position) {
          return;
        }

        if (isInsideResizeHandle(mouse.x, mouse.y)) {
          isResizingRef.current = true;
          resizeAnchorRef.current = { x: position.x, y: position.y };
          canvas.style.cursor = "nwse-resize";
          return;
        }

        if (!isInsideWebcam(mouse.x, mouse.y)) {
          return;
        }

        isDraggingRef.current = true;
        dragOffsetRef.current = {
          x: mouse.x - position.x,
          y: mouse.y - position.y,
        };
        canvas.style.cursor = "grabbing";
      };

      const handleMouseMove = (event: MouseEvent) => {
        const mouse = getMousePosition(event);

        if (isResizingRef.current) {
          const anchor = resizeAnchorRef.current;
          const rawDiameter = Math.max(mouse.x - anchor.x, mouse.y - anchor.y);
          const maxAllowed = Math.min(
            maxDiameter,
            displayWidth - anchor.x,
            displayHeight - anchor.y,
          );
          const nextDiameter = Math.min(
            Math.max(rawDiameter, minDiameter),
            Math.max(minDiameter, maxAllowed),
          );

          webcamDiameterRef.current = nextDiameter;
          webcamPositionRef.current = { x: anchor.x, y: anchor.y };
          canvas.style.cursor = "nwse-resize";
          return;
        }

        if (isDraggingRef.current) {
          const nextX = mouse.x - dragOffsetRef.current.x;
          const nextY = mouse.y - dragOffsetRef.current.y;
          webcamPositionRef.current = clampWebcamPosition(
            nextX,
            nextY,
            webcamDiameterRef.current,
          );
          canvas.style.cursor = "grabbing";
          return;
        }

        if (
          webcamStream &&
          webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          isInsideResizeHandle(mouse.x, mouse.y)
        ) {
          canvas.style.cursor = "nwse-resize";
        } else if (
          webcamStream &&
          webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          isInsideWebcam(mouse.x, mouse.y)
        ) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "default";
        }
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        isResizingRef.current = false;
        canvas.style.cursor = "default";
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      drawFrame();

      const observer = new ResizeObserver(() => {
        resizeCanvas();
      });

      observer.observe(parent);

      return () => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }

        observer.disconnect();
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        canvas.style.cursor = "default";
        video.pause();
        video.srcObject = null;
        webcamVideo.pause();
        webcamVideo.srcObject = null;
      };
    }, [displayStream, webcamStream]);

    return (
      <canvas
        ref={(node) => {
          canvasRef.current = node;

          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: "#000000",
        }}
      />
    );
  },
);

export default RecorderCanvas;
