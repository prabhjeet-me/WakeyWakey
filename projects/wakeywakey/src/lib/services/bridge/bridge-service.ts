import { inject, Injectable } from '@angular/core';
import { OrbComponentService } from '../../components/orb-component/orb-component-service';
import { AudioService } from '../audio/audio-service';
import { MicrophoneService } from '../audio/microphone-service/microphone-service';
import { SpeakerService } from '../audio/speaker-service/speaker-service';
import { SpeechRecognitionService } from '../audio/speech-recognition/speech-recognition-service';
import { VadService } from '../audio/vad-service/vad-service';
import { ConfigService } from '../config/config-service';
import { EventService } from '../event/event-service';
import { ModelService } from '../model/model-service';
import { PipelineService } from '../pipeline/pipeline-service';
import { PlatformService } from '../platform/platform-service';

@Injectable()
export class BridgeService {
  readonly mic = inject(MicrophoneService);
  readonly speaker = inject(SpeakerService);
  readonly speechRecognition = inject(SpeechRecognitionService);
  readonly vad = inject(VadService);
  readonly audio = inject(AudioService);
  readonly config = inject(ConfigService);
  readonly event = inject(EventService);
  readonly model = inject(ModelService);
  readonly pipeline = inject(PipelineService);
  readonly platform = inject(PlatformService);
  readonly orbComponentService = inject(OrbComponentService);
}
