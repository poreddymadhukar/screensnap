import { useState, useRef } from "react";

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: true,
      });

      setStream(displayStream);

      // Choose best supported format
      const options = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9"
      )
        ? { mimeType: "video/webm;codecs=vp9" }
        : { mimeType: "video/webm" };

      const recorder = new MediaRecorder(displayStream, options);

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

      // If user clicks "Stop sharing" in browser
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });

      recorder.start(1000);

      setIsRecording(true);

      console.log("Recording Started");
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    setStream(null);
    setIsRecording(false);

    console.log("Recording Stopped");
  };

  return {
    isRecording,
    stream,
    startRecording,
    stopRecording,
  };
}