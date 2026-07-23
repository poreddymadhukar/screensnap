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

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    setStream(null);
    setIsRecording(false);
  };

  return {
    isRecording,
    stream,
    startRecording,
    stopRecording,
  };
}