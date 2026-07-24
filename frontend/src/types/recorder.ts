export interface RecordingSettings {
  microphone: boolean;
  webcam: boolean;
  browserAudio: boolean;
  showCursor: boolean;
  quality: "720p" | "1080p";
}

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  stream: MediaStream | null;
}

export interface RecorderControls {
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
}

export type RecorderHook = RecorderState &
  RecorderControls & {
    settings: RecordingSettings;
    updateSettings: (settings: Partial<RecordingSettings>) => void;
  };