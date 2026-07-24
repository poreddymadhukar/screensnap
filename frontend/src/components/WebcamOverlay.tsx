import { useEffect, useRef, useState } from "react";

interface WebcamOverlayProps {
    enabled: boolean;
}

export default function WebcamOverlay({
    enabled,
}: WebcamOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState({
        x: 20,
        y: 20,
    });

    const [dragging, setDragging] = useState(false);

    const [offset, setOffset] = useState({
        x: 0,
        y: 0,
    });

    const handleMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
        setDragging(true);

        const rect = overlayRef.current?.getBoundingClientRect();

        if (!rect) return;

        setDragging(true);

        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;

            const newX = e.clientX - offset.x;
            const newY = e.clientY - offset.y;

            const parent = overlayRef.current?.parentElement;

            if (!parent || !overlayRef.current) return;

            const parentRect = parent.getBoundingClientRect();
            const overlayRect = overlayRef.current.getBoundingClientRect();

            const maxX = parentRect.width - overlayRect.width;
            const maxY = parentRect.height - overlayRect.height;

            setPosition({
                x: Math.max(0, Math.min(newX - parentRect.left, maxX)),
                y: Math.max(0, Math.min(newY - parentRect.top, maxY)),
            });
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, offset]);

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

                    videoRef.current
                        .play()
                        .then(() => console.log("Webcam playing"))
                        .catch((err) => console.error("Play failed:", err));
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

    if (!enabled) return null;

    return (
        <video
            ref={(el) => {
                videoRef.current = el;
                overlayRef.current = el;
            }}
            autoPlay
            playsInline
            muted
            draggable={false}
            className="webcam-overlay"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onMouseDown={handleMouseDown}
        />
    );
}