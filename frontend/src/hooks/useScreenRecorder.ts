import { useState, useRef } from "react"; 
import type {
  RecorderHook,
  RecordingSettings,
} from "../types/recorder";

export function useScreenRecorder(): RecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [settings, setSettings] = useState<RecordingSettings>({
    microphone: true,
    browserAudio: true,
    showCursor: true,
    quality: "1080p",
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  

  const updateSettings = (
    newSettings: Partial<RecordingSettings>
  ) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const startRecording = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    try {
      // Screen
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    cursor: "always",
  },
  audio: true,
});

console.log(
  "Display audio tracks:",
  displayStream.getAudioTracks().length
);
console.log(displayStream.getAudioTracks());

      // Microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      console.log("Mic tracks:", micStream.getAudioTracks().length);
    console.log("Mic track details:", micStream.getAudioTracks());

      // Combine screen + mic
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...micStream.getAudioTracks(),
      ]);

      console.log("Combined stream:", combinedStream);
      console.log("Video tracks:", combinedStream.getVideoTracks().length);
      console.log("Audio tracks:", combinedStream.getAudioTracks().length);

      setStream(combinedStream);

      const options = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9"
      )
        ? { mimeType: "video/webm;codecs=vp9" }
        : { mimeType: "video/webm" };

      const recorder = new MediaRecorder(combinedStream, options);

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

      recorder.start(1000);

      setIsRecording(true);

     // Start timer
     setRecordingTime(0);

        timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
    }, 1000);   

    } catch (err) {
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

  // Stop all tracks
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Reset state
  mediaRecorderRef.current = null;
  setStream(null);
  setIsRecording(false);
};

  return {
  isRecording,
  recordingTime,
  stream,
  settings,
  updateSettings,
  startRecording,
  stopRecording,
};
}