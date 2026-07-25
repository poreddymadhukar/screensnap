import { useEffect, useState, useRef } from "react";
import type { RecorderHook, RecordingSettings } from "../types/recorder";

export function useScreenRecorder(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): RecorderHook {
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [settings, setSettings] = useState<RecordingSettings>({
    microphone: true,
    webcam: false,
    browserAudio: true,
    showCursor: true,
    quality: "1080p",
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canvasStreamRef = useRef<MediaStream | null>(null);

  const updateSettings = (newSettings: Partial<RecordingSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  useEffect(() => {
    let isActive = true;
    let localWebcamStream: MediaStream | null = null;

    if (settings.webcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          if (!isActive) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }

          localWebcamStream = mediaStream;
          setWebcamStream(mediaStream);
        })
        .catch((e) => {
          console.error("Webcam failed:", e);
          setWebcamStream(null);
        });
    } else {
      setWebcamStream((prev) => {
        if (prev) {
          prev.getTracks().forEach((track) => track.stop());
        }

        return null;
      });
    }

    return () => {
      isActive = false;

      if (localWebcamStream) {
        localWebcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [settings.webcam]);

  const startRecording = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    try {
      // Screen
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: settings.showCursor ? "always" : "never",

          width: settings.quality === "1080p" ? 1920 : 1280,
          height: settings.quality === "1080p" ? 1080 : 720,
        },

        audio: settings.browserAudio,
      });

      // Microphone
      let micStream: MediaStream | null = null;

      if (settings.microphone) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        } catch (e) {
          console.error("Microphone failed:", e);

          // Continue recording even if mic fails
          micStream = null;
        }
      }

      // Combine screen + mic (used for the live preview canvas)
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...(micStream ? micStream.getAudioTracks() : []),
      ]);

      setStream(combinedStream);

      // Record from the same canvas used for the live preview, instead of
      // creating a separate hidden canvas. This keeps the recorded video
      // identical to what the user sees (screen + webcam overlay).
      const canvas = canvasRef.current;

      if (!canvas) {
        console.error("Recording canvas is not available yet.");
        displayStream.getTracks().forEach((track) => track.stop());
        micStream?.getTracks().forEach((track) => track.stop());
        setStream(null);
        return;
      }

      const canvasStream = canvas.captureStream(30);
      canvasStreamRef.current = canvasStream;

      // Recording stream: canvas video + unchanged audio handling
      const recordingStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...(micStream ? micStream.getAudioTracks() : []),
      ]);

      const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? { mimeType: "video/webm;codecs=vp9" }
        : { mimeType: "video/webm" };

      const recorder = new MediaRecorder(recordingStream, options);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `screensnap-${Date.now()}.webm`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        chunksRef.current = [];
      };

      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });

      for (let seconds = 3; seconds > 0; seconds -= 1) {
        setCountdown(seconds);
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 1000);
        });
      }

      setCountdown(null);
      recorder.start(1000);

      setIsRecording(true);

      // Start timer
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setCountdown(null);
      if (err instanceof DOMException) {
        console.error("DOMException");
        console.error("Name:", err.name);
        console.error("Message:", err.message);
      } else {
        console.error(err);
      }
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    // Stop recording
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset timer
    setRecordingTime(0);
    setCountdown(null);

    // Stop all tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Stop the canvas capture stream used for recording
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach((track) => track.stop());
      canvasStreamRef.current = null;
    }

    // Reset state
    mediaRecorderRef.current = null;
    setStream(null);
    setIsRecording(false);
  };

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.pause();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "paused") {
      recorder.resume();

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsPaused(false);
    }
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    stream,
    webcamStream,
    countdown,
    settings,
    updateSettings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
