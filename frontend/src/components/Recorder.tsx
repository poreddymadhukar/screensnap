import { useState } from "react";

interface RecorderProps {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export default function Recorder({
  isRecording,
  recordingTime,
  startRecording,
  stopRecording,
}: RecorderProps) {
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      await startRecording();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
    }
  };

  const handleStop = () => {
    stopRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  };

  return (
    <div className="recorder">
      <div className="controls">
        {!isRecording ? (
          <button onClick={handleStart} className="btn btn-primary">
            🎥 Start Recording
          </button>
        ) : (
          <button onClick={handleStop} className="btn btn-danger">
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          🔴 Recording {formatTime(recordingTime)}
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}