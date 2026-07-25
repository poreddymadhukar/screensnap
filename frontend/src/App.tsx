import "./index.css";

import { useRef } from "react";
import Preview from "./components/Preview";
import Recorder from "./components/Recorder";
import { useScreenRecorder } from "./hooks/useScreenRecorder";
import Settings from "./components/Settings";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorder = useScreenRecorder(canvasRef);

  return (
    <main className="app">
      <div className="recorder-card">
        <div className="card-header">
          <h2>🎥 ScreenSnap</h2>
          <p>Private Screen Recording. Right in Your Browser.</p>
        </div>

        {recorder.isRecording && (
          <div className="status-bar">
            <span>🔴 REC</span>
            <span>
              {Math.floor(recorder.recordingTime / 60)
                .toString()
                .padStart(2, "0")}
              :{(recorder.recordingTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}

        <div className="preview-container">
          <Preview
            canvasRef={canvasRef}
            stream={recorder.stream}
            webcamStream={recorder.webcamStream}
            webcamStyle={recorder.settings.webcamStyle}
          />
          {recorder.countdown !== null && (
            <div className="countdown-overlay" aria-live="assertive">
              <span className="countdown-number">{recorder.countdown}</span>
            </div>
          )}
        </div>

        <Recorder {...recorder} />
        <Settings
          settings={recorder.settings}
          updateSettings={recorder.updateSettings}
        />
        <footer className="footer">
          ScreenSnap • Your recordings stay on your device 🔒
        </footer>
      </div>
    </main>
  );
}

export default App;
