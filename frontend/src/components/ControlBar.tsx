import { useState } from 'react';
import { useScreenRecorder } from '../hooks/useScreenRecorder';

export default function ControlBar() {
  const { isRecording, startRecording, stopRecording } = useScreenRecorder();
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      await startRecording();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStop = async () => {
    try {
      await stopRecording();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  return (
    <div className="control-bar">
      <div className="controls">
        {!isRecording ? (
          <button onClick={handleStart} className="btn btn-primary">
            Start Recording
          </button>
        ) : (
          <button onClick={handleStop} className="btn btn-danger">
            Stop Recording
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      {isRecording && <div className="recording-indicator">● Recording...</div>}
    </div>
  );
}
