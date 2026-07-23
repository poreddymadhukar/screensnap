import "./index.css";

function App() {

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      console.log("Recording started", stream);

      // Stop immediately for now
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error("User cancelled or error:", error);
    }
  };

  return (
    <main className="app">
      <section className="hero">

        <h1>🎥 ScreenSnap</h1>

        <p className="tagline">
          Private Screen Recording. Right in Your Browser.
        </p>

        <button
          className="record-btn"
          onClick={startRecording}
        >
          Start Recording
        </button>

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