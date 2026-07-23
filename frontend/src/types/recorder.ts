export interface RecorderState {
  isRecording: boolean;
  stream: MediaStream | null;
}

export interface RecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}
