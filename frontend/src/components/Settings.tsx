import { useState } from "react";
import type { RecordingSettings } from "../types/recorder";

interface SettingsProps {
  settings: RecordingSettings;
  updateSettings: (
    settings: Partial<RecordingSettings>
  ) => void;
}

export default function Settings({
  settings,
  updateSettings,
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="settings-card">

     <div
  className="settings-header"
  onClick={() => setIsOpen(!isOpen)}
>
  <div className="settings-title">
    <h3>⚙️ Recording Settings</h3>
    <p className="settings-subtitle">
      Configure audio, video, and cursor options.
    </p>
  </div>

  <span className={`arrow ${isOpen ? "open" : ""}`}>
    ▶
  </span>
</div>

      {isOpen && (
        <>
          <div className="setting-item">
            <label>🎤 Microphone</label>

            <input
              type="checkbox"
              checked={settings.microphone}
              onChange={(e) =>
                updateSettings({
                  microphone: e.target.checked,
                })
              }
            />
          </div>

          <div className="setting-item">
            <label>🔊 Browser Audio</label>

            <input
              type="checkbox"
              checked={settings.browserAudio}
              onChange={(e) =>
                updateSettings({
                  browserAudio: e.target.checked,
                })
              }
            />
          </div>

          <div className="setting-item">
            <label>🖱️ Show Cursor</label>

            <input
              type="checkbox"
              checked={settings.showCursor}
              onChange={(e) =>
                updateSettings({
                  showCursor: e.target.checked,
                })
              }
            />
          </div>

          <div className="setting-item">
            <label>🎥 Video Quality</label>

            <select
              value={settings.quality}
              onChange={(e) =>
                updateSettings({
                  quality: e.target.value as "720p" | "1080p",
                })
              }
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
        </>
      )}

    </div>
  );
}