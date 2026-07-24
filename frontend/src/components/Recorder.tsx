import { useState } from "react";

interface RecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
}

export default function Recorder({
  isRecording,
  isPaused,
  recordingTime,
  startRecording,
  pauseRecording,
  resumeRecording,
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
          <button
            onClick={handleStart}
            className="btn btn-primary"
          >
            🎥 Start Recording
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="btn btn-warning"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="btn btn-primary"
              >
                ▶ Resume
              </button>
            )}

            <button
              onClick={stopRecording}
              className="btn btn-danger"
            >
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          {isPaused ? "⏸ Paused" : "🔴 Recording"}{" "}
          {formatTime(recordingTime)}
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}