import "./index.css";

import Recorder from "./components/Recorder";
import Preview from "./components/Preview";
import { useScreenRecorder } from "./hooks/useScreenRecorder";

function App() {

  const recorder = useScreenRecorder();

  return (
    <main className="app">

      <section className="hero">

        <h1>🎥 ScreenSnap</h1>

        <p className="tagline">
          Private Screen Recording. Right in Your Browser.
        </p>

        <Preview stream={recorder.stream} />

        <Recorder {...recorder} />

        <div className="privacy-box">
          <h3>🔒 Privacy First</h3>

          <ul>
            <li>✔ No uploads</li>
            <li>✔ No login required</li>
            <li>✔ Everything stays on your device</li>
          </ul>

        </div>

      </section>

    </main>
  );
}

export default App;