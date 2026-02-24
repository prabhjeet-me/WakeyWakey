import { inject, provideAppInitializer } from '@angular/core';
import { env, InferenceSession } from 'onnxruntime-web';
import { AudioService } from './lib/services/audio/audio-service';
import { MicrophoneService } from './lib/services/audio/microphone-service/microphone-service';
import { SpeakerService } from './lib/services/audio/speaker-service/speaker-service';
import { SpeechRecognitionService } from './lib/services/audio/speech-recognition/speech-recognition-service';
import { VadService } from './lib/services/audio/vad-service/vad-service';
import { BridgeService } from './lib/services/bridge/bridge-service';
import { ConfigService } from './lib/services/config/config-service';
import { CONFIG, Config } from './lib/services/config/config-service.type';
import { EventService } from './lib/services/event/event-service';
import { ModelService } from './lib/services/model/model-service';
import { PipelineService } from './lib/services/pipeline/pipeline-service';
import { PlatformService } from './lib/services/platform/platform-service';

/**
 * Provide wakey wakey configuration
 *
 * @param config Wakey Wakey configuration
 * @returns
 */
export function provideWakeyWakey(config: Config) {
  return [
    {
      provide: CONFIG,
      useValue: config,
    },
    ConfigService,
    MicrophoneService,
    SpeakerService,
    VadService,
    AudioService,
    PlatformService,
    EventService,
    PipelineService,
    SpeechRecognitionService,
    ModelService,
    BridgeService,
    provideAppInitializer(async () => {
      const _config = inject(ConfigService);
      const _model = inject(ModelService);
      const _platform = inject(PlatformService);
      const _mic = inject(MicrophoneService);

      if (_platform.isServer) return;

      // Set wasm path
      env.wasm.wasmPaths = _config.onnx.runtimePath ?? `${_config.basePath}/wasm/`;

      const modelPath: string[] = [
        _config.onnx.model.melspectrogram ?? `${_config.basePath}/models/melspectrogram.onnx`,
        _config.onnx.model.embedding_model ?? `${_config.basePath}/models/embedding_model.onnx`,
        _config.onnx.model.silero_vad ?? `${_config.basePath}/models/silero_vad_v4.onnx`,
        _config.onnx.model.wakeword,
      ];

      // Create sessions
      const sessions = await Promise.all([
        ...Object.values(modelPath).map((path) =>
          InferenceSession.create(path, { executionProviders: ['wasm'] }),
        ),
        _mic.init(),
      ]);

      // set sessions
      _model.session = {
        melspectrogram: sessions[0] as InferenceSession,
        embedding_model: sessions[1] as InferenceSession,
        silero_vad: sessions[2] as InferenceSession,
        wakeword: sessions[3] as InferenceSession,
      };
    }),
  ];
}
