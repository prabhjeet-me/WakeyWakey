// global.d.ts

declare global {
  interface AudioContext {
    /**
     * Routes the audio context output to a specific audio device.
     * @param sinkId The deviceId of the audio output device (from navigator.mediaDevices.enumerateDevices).
     */
    setSinkId(sinkId: string): Promise<void>;
  }
}

// The empty export ensures TypeScript treats this file as a module,
// allowing us to augment the global scope safely.
export {};
