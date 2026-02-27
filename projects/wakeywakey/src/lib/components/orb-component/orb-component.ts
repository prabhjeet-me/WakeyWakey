/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { SubSink } from 'subsink';
import * as THREE from 'three';
import { AudioService } from '../../services/audio/audio-service';
import { MicrophoneService } from '../../services/audio/microphone-service/microphone-service';
import { ConfigService } from '../../services/config/config-service';
import { EventService } from '../../services/event/event-service';
import { PlatformService } from '../../services/platform/platform-service';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

@Component({
  selector: 'app-orb-component',
  template: `
    <div
      #rendererContainer
      role="button"
      tabindex="0"
      class="orb-container"
      [style.width.px]="orbSize"
      [style.height.px]="orbSize"
      (click)="toggleRecording()"
      (keypress)="toggleRecording()"
    ></div>
  `,
  styles: [
    `
      .orb-container {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        cursor: pointer;
      }
      canvas {
        display: block;
        outline: none;
      }
    `,
  ],
})
export class OrbComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);
  private readonly _audio = inject(AudioService);
  private readonly _mic = inject(MicrophoneService);
  private readonly _event = inject(EventService);
  private readonly _ngZone = inject(NgZone);
  private readonly _subs = new SubSink();

  // Three.js Core
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphere!: THREE.Points;
  private material!: THREE.ShaderMaterial;
  private animationFrameId!: number;
  private clock = new THREE.Clock();
  private geometry!: THREE.BufferGeometry;

  // Audio Processing
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;
  private micVolume = 0;

  // State Management
  private currentState: AgentState = 'idle';
  private agentProfiles = {
    idle: {
      spike: 0.05,
      noiseScale: 1.0,
      speed: 0.2,
      twist: 0.0,
      pulse: 0.0,
      base: '#001133',
      peak: '#00aaff',
    },
    listening: {
      spike: 0.2,
      noiseScale: 2.5,
      speed: 1.0,
      twist: 0.0,
      pulse: 0.0,
      base: '#002211',
      peak: '#00ff88',
    },
    thinking: {
      spike: 0.2,
      noiseScale: 1.5,
      speed: 1.5,
      twist: 1.5,
      pulse: 0.0,
      base: '#220033',
      peak: '#ff00ff',
    },
    speaking: {
      spike: 0.1,
      noiseScale: 1.0,
      speed: 0.5,
      twist: 0.0,
      pulse: 0.1,
      base: '#331100',
      peak: '#ff8800',
    },
  };

  private targets = { ...this.agentProfiles.idle };
  private targetColorBase = new THREE.Color(this.targets.base);
  private targetColorPeak = new THREE.Color(this.targets.peak);

  get orbSize(): number {
    return this._config.orb?.size ?? 400;
  }

  ngAfterViewInit(): void {
    if (this._platform.isServer) return;

    this._loadSubscribers();
    this._setupAudioAnalyser();

    // MUST run outside Angular to prevent CD loops
    this._ngZone.runOutsideAngular(() => {
      this._initThreeJs();
      this._animate();
    });

    this.setState('idle');
  }

  ngOnDestroy(): void {
    if (this._platform.isServer) return;

    cancelAnimationFrame(this.animationFrameId);
    this._subs.unsubscribe();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      // Remove canvas from DOM to ensure cleanup
      const domElement = this.renderer.domElement;
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    }

    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();

    // Allow garbage collection
    (this.scene as any) = null;
    (this.camera as any) = null;
    (this.renderer as any) = null;
  }

  @HostListener('window:keydown.Space', ['$event'])
  handleSpacebarPress(event: Event): void {
    event.preventDefault();
    this.toggleRecording();
  }

  toggleRecording() {
    this._audio.toggleRecording();
  }

  setState(state: AgentState): void {
    this.currentState = state;
    const profile = this.agentProfiles[state];
    if (!profile) return;

    this.targets = { ...profile };
    this.targetColorBase.set(profile.base);
    this.targetColorPeak.set(profile.peak);
  }

  private _loadSubscribers(): void {
    this._subs.sink = this._event.speech.subscribe((data) => {
      this.micVolume = this._mic.isMuted ? 0 : data.dbNormalized;
    });

    this._subs.sink = this._event.wakeword.subscribe(() => {
      this.setState('listening');
    });

    this._subs.sink = this._event.silence.subscribe((ev) => {
      if (ev.interimResponse) this.setState('thinking');
      else this.setState('idle');
    });

    this._subs.sink = this._event.recording.subscribe(() => {
      this.setState('listening');
    });
  }

  private _setupAudioAnalyser(): void {
    if (this._mic.audioContext && this._mic.sourceNode) {
      const audioCtx = this._mic.audioContext;
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this._mic.sourceNode.connect(this.analyser);
    }
  }

  private _getTTSVolume(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.dataArray.length / 255.0;
  }

  private _initThreeJs(): void {
    const size = this.orbSize;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(size, size);

    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    const particlesCount = this._config.orb?.particlesCount ?? 20000;
    this.geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount);
    const radius = this._config.orb?.radius ?? 1.8;

    for (let i = 0; i < particlesCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particlesCount);
      const theta = Math.sqrt(particlesCount * Math.PI) * phi;

      posArray[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      posArray[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      posArray[i * 3 + 2] = radius * Math.cos(phi);
      randomArray[i] = Math.random();
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpike: { value: 0.05 },
        uNoiseScale: { value: 1.0 },
        uSpeed: { value: 0.2 },
        uTwist: { value: 0.0 },
        uPulse: { value: 0.0 },
        uColorBase: { value: new THREE.Color('#002244') },
        uColorPeak: { value: new THREE.Color('#00ffff') },
      },
      vertexShader: this._getVertexShader(),
      fragmentShader: this._getFragmentShader(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sphere = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.sphere);
  }

  private _animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this._animate);
    const elapsedTime = this.clock.getElapsedTime();

    this.material.uniforms['uTime'].value = elapsedTime;

    let dynamicSpike = this.targets.spike;
    let dynamicPulse = this.targets.pulse;

    if (this.currentState === 'listening') {
      dynamicSpike += this.micVolume * 1.0;
    } else if (this.currentState === 'speaking') {
      const ttsVolume = this._getTTSVolume();
      dynamicPulse += ttsVolume * 15;
    }

    const lerpFactor = 0.08;
    this.material.uniforms['uSpike'].value +=
      (dynamicSpike - this.material.uniforms['uSpike'].value) * lerpFactor;
    this.material.uniforms['uPulse'].value +=
      (dynamicPulse - this.material.uniforms['uPulse'].value) * lerpFactor;

    this.material.uniforms['uNoiseScale'].value +=
      (this.targets.noiseScale - this.material.uniforms['uNoiseScale'].value) * lerpFactor;
    this.material.uniforms['uSpeed'].value +=
      (this.targets.speed - this.material.uniforms['uSpeed'].value) * lerpFactor;
    this.material.uniforms['uTwist'].value +=
      (this.targets.twist - this.material.uniforms['uTwist'].value) * lerpFactor;

    this.material.uniforms['uColorBase'].value.lerp(this.targetColorBase, lerpFactor);
    this.material.uniforms['uColorPeak'].value.lerp(this.targetColorPeak, lerpFactor);

    this.sphere.rotation.y = elapsedTime * 0.1;
    this.sphere.rotation.z = elapsedTime * 0.01;

    this.renderer.render(this.scene, this.camera);
  };

  private _getVertexShader(): string {
    return `
      uniform float uTime;
      uniform float uSpike;       
      uniform float uNoiseScale;  
      uniform float uSpeed;       
      uniform float uTwist;       
      uniform float uPulse;       
      
      varying vec3 vColor;
      varying float vDisplacement;

      attribute float aRandom;

      // Simplex 3D Noise
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0);
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      void main() {
          vec3 pos = position;
          float time = uTime * uSpeed;
          
          float angle = pos.y * uTwist;
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          pos.xz *= rot;

          vec3 normal = normalize(pos);
          float noise = snoise(pos * uNoiseScale + time);
          
          float totalDisplacement = (noise * uSpike) + uPulse;
          pos += normal * totalDisplacement;
          
          vDisplacement = totalDisplacement;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = (15.0 + totalDisplacement * 20.0) * (1.0 / -mvPosition.z);
          gl_PointSize *= (1.0 + sin(uTime * 5.0 + aRandom * 50.0) * 0.2);

          gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  private _getFragmentShader(): string {
    return `
      varying float vDisplacement;
      uniform vec3 uColorBase; 
      uniform vec3 uColorPeak;

      void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - pow(dist * 2.0, 2.0);
          
          float mixValue = smoothstep(-0.2, 0.5, vDisplacement);
          vec3 finalColor = mix(uColorBase, uColorPeak, mixValue);

          gl_FragColor = vec4(finalColor, alpha * 0.9);
      }
    `;
  }
}
