import { NgClass } from '@angular/common';
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
import { OrbComponentService } from './orb-component-service';
import { AgentState } from './orb-component.type';

@Component({
  selector: 'app-orb-component',
  imports: [NgClass],
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
      [ngClass]="{ muted: isMuted }"
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
      .muted {
        cursor: not-allowed;
      }
      canvas {
        display: block;
        outline: none;
      }
    `,
  ],
})
export class OrbComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  private _rendererContainer!: ElementRef<HTMLDivElement>;

  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);
  private readonly _audio = inject(AudioService);
  private readonly _mic = inject(MicrophoneService);
  private readonly _event = inject(EventService);
  private readonly _ngZone = inject(NgZone);
  private readonly _service = inject(OrbComponentService);
  private readonly _subs = new SubSink();

  // Three.js Core
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _renderer!: THREE.WebGLRenderer;
  private _sphere!: THREE.Points;
  private _material!: THREE.ShaderMaterial;
  private _animationFrameId!: number;
  private _timer = new THREE.Timer();
  private _geometry!: THREE.BufferGeometry;

  // Audio Processing
  private dataArray!: Uint8Array<ArrayBuffer>;
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
      peak: '#ff4000',
    },
    initialized: {
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

  get isMuted() {
    return this._mic.isMuted;
  }

  ngAfterViewInit(): void {
    if (this._platform.isServer) return;

    this.dataArray = new Uint8Array(this._mic.analyzer!.frequencyBinCount);
    this._loadSubscribers();

    // MUST run outside Angular to prevent CD loops
    this._ngZone.runOutsideAngular(() => {
      this._initThreeJs();
      this._timer.connect(document);
      this._animate();
    });
  }

  ngOnDestroy(): void {
    if (this._platform.isServer) return;

    cancelAnimationFrame(this._animationFrameId);

    this._subs.unsubscribe();

    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.forceContextLoss();
      // Remove canvas from DOM to ensure cleanup
      const domElement = this._renderer.domElement;
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    }

    if (this._geometry) this._geometry.dispose();
    if (this._material) this._material.dispose();
  }

  /**
   * Space bar press
   */
  @HostListener('window:keydown', ['$event'])
  handleSpacebarPress(event: KeyboardEvent): void {
    if (event.code !== this._config.hotkey) return;

    event.preventDefault();
    this.toggleRecording();
  }

  /**
   * Toggle recording
   */
  toggleRecording() {
    if (this.isMuted) return;

    this._audio.toggleRecording();
  }

  /**
   * Set state of orb
   *
   * @param state orb state
   */
  setState(state: AgentState): void {
    const profile = this.agentProfiles[state];

    this.currentState = state;
    this.targets = { ...profile };
    this.targetColorBase.set(profile.base);
    this.targetColorPeak.set(profile.peak);
  }

  /**
   * Subscriptions
   */
  private _loadSubscribers(): void {
    this._subs.sink = this._event.speech.subscribe((data) => {
      this.micVolume = this.isMuted ? 0 : data.dbNormalized;
    });

    // only update orb state if mode is auto
    if (!this._config.orb?.mode || this._config.orb?.mode === 'auto') {
      // after wakeword, set to listening
      this._subs.sink = this._event.wakeword.subscribe(() => {
        this.setState('listening');
      });

      // after silence, set thinking or idle
      this._subs.sink = this._event.silence.subscribe((ev) => {
        if (ev.interimResponse) this.setState('thinking');
        else this.setState('idle');
      });

      // if recording started
      this._subs.sink = this._event.recording.subscribe(() => {
        this.setState('listening');
      });

      // state change using service
      this._subs.sink = this._service.state.subscribe((state) => {
        this.setState(state);
      });
    }
  }

  /**
   * Speech volume for animation
   */
  private _getTTSVolume(): number {
    this._mic.analyzer!.getByteFrequencyData(this.dataArray);
    const sum = this.dataArray.reduce((a, b) => a + b, 0);
    return sum / this.dataArray.length / 255.0;
  }

  /**
   * Init
   */
  private _initThreeJs(): void {
    const size = this.orbSize;

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this._camera.position.z = 6;

    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(size, size);

    this._rendererContainer.nativeElement.appendChild(this._renderer.domElement);

    const particlesCount = this._config.orb?.particlesCount ?? 30000;
    this._geometry = new THREE.BufferGeometry();
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

    this._geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this._geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

    this._material = new THREE.ShaderMaterial({
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

    this._sphere = new THREE.Points(this._geometry, this._material);
    this._scene.add(this._sphere);
  }

  /**
   * Animator
   */
  private _animate = (): void => {
    this._animationFrameId = requestAnimationFrame(this._animate);
    this._timer.update();
    const elapsedTime = this._timer.getElapsed();

    this._material.uniforms['uTime'].value = elapsedTime;

    let dynamicSpike = this.targets.spike;
    let dynamicPulse = this.targets.pulse;

    if (this.currentState === 'listening') {
      dynamicSpike += this.micVolume * 1.0;
    } else if (this.currentState === 'speaking') {
      const ttsVolume = this._getTTSVolume();
      dynamicPulse += ttsVolume * 0.5;
    }

    const lerpFactor = 0.08;
    this._material.uniforms['uSpike'].value +=
      (dynamicSpike - this._material.uniforms['uSpike'].value) * lerpFactor;
    this._material.uniforms['uPulse'].value +=
      (dynamicPulse - this._material.uniforms['uPulse'].value) * lerpFactor;

    this._material.uniforms['uNoiseScale'].value +=
      (this.targets.noiseScale - this._material.uniforms['uNoiseScale'].value) * lerpFactor;
    this._material.uniforms['uSpeed'].value +=
      (this.targets.speed - this._material.uniforms['uSpeed'].value) * lerpFactor;
    this._material.uniforms['uTwist'].value +=
      (this.targets.twist - this._material.uniforms['uTwist'].value) * lerpFactor;

    this._material.uniforms['uColorBase'].value.lerp(this.targetColorBase, lerpFactor);
    this._material.uniforms['uColorPeak'].value.lerp(this.targetColorPeak, lerpFactor);

    this._sphere.rotation.y = elapsedTime * 0.1;
    this._sphere.rotation.z = elapsedTime * 0.01;

    this._renderer.render(this._scene, this._camera);
  };

  /**
   * Vertex shader
   */
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

  /**
   * Fragment shader
   */
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
