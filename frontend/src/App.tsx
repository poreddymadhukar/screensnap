import "./index.css";

import Preview from "./components/Preview";
import Recorder from "./components/Recorder";
import { useScreenRecorder } from "./hooks/useScreenRecorder";

function App() {
  const recorder = useScreenRecorder();

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
              :
              {(recorder.recordingTime % 60)
                .toString()
                .padStart(2, "0")}
            </span>
          </div>
        )}

        <Preview stream={recorder.stream} />

        <Recorder {...recorder} />

       <footer className="footer">
         ScreenSnap • Your recordings stay on your device 🔒
      </footer>
      </div>
    </main>
  );
}

export default App;