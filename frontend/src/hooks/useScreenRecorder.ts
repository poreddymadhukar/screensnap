import { useEffect, useState, useRef } from "react";
import type { RecorderHook, RecordingSettings } from "../types/recorder";

export function useScreenRecorder(): RecorderHook {
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

  const audioContextRef = useRef<AudioContext | null>(null);

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
      const displayOptions: DisplayMediaStreamOptions & {
        systemAudio?: "include" | "exclude";
        windowAudio?: "system" | "window" | "exclude";
      } = {
        video: {
          cursor: settings.showCursor ? "always" : "never",

          width: {
            ideal: settings.quality === "1080p" ? 1920 : 1280,
            max: settings.quality === "1080p" ? 1920 : 1280,
          },
          height: {
            ideal: settings.quality === "1080p" ? 1080 : 720,
            max: settings.quality === "1080p" ? 1080 : 720,
          },
          frameRate: { ideal: 30, max: 30 },
        } as MediaTrackConstraints & {
          cursor: "always" | "never";
        },

        audio: settings.browserAudio,
        systemAudio: settings.browserAudio ? "include" : "exclude",
        windowAudio: "system",
      };

      const displayStream =
        await navigator.mediaDevices.getDisplayMedia(displayOptions);

      const displayAudioTracks = displayStream.getAudioTracks();
      console.info("Display audio tracks:", displayAudioTracks.length);
      displayAudioTracks.forEach((track) => {
        console.info("Display audio track settings:", track.getSettings());
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

      // Record the original display track so browser background throttling
      // cannot stall the video when the Zoom window is foregrounded.
      const recordingStream = new MediaStream([
        ...displayStream.getVideoTracks(),
      ]);

      const audioStreams = [
        new MediaStream(displayAudioTracks),
        ...(micStream ? [new MediaStream(micStream.getAudioTracks())] : []),
      ].filter((audioStream) => audioStream.getAudioTracks().length > 0);

      if (audioStreams.length > 0) {
        // MediaRecorder is more reliable with one mixed audio track than with
        // separate system-audio and microphone tracks.
        const audioContext = new AudioContext();
        await audioContext.resume();
        const audioDestination = audioContext.createMediaStreamDestination();

        audioStreams.forEach((audioStream) => {
          audioContext
            .createMediaStreamSource(audioStream)
            .connect(audioDestination);
        });

        audioContextRef.current = audioContext;
        recordingStream.addTrack(audioDestination.stream.getAudioTracks()[0]);
      } else {
        console.warn(
          "No audio track was provided. Enable Share system audio and/or Microphone.",
        );
      }

      const videoBitsPerSecond =
        settings.quality === "1080p" ? 5_000_000 : 2_500_000;
      const options: MediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm",
        videoBitsPerSecond,
        audioBitsPerSecond: 128_000,
      };

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
      recorder.start(10_000);

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

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
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
