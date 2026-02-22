import {
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { AudioService } from '../../services/audio/audio-service';
import { ConfigService } from '../../services/config/config-service';
import { PlatformService } from '../../services/platform/platform-service';

@Component({
  selector: 'app-orb-component',
  standalone: true,
  template: `<div
    #rendererContainer
    tabindex="0"
    role="button"
    class="orb-viewport"
    [style.height]="orbSize"
    [style.width]="orbSize"
    (click)="toggleRecording()"
    (keypress)="toggleRecording()"
  ></div>`,
  styles: [
    `
      .orb-viewport {
        background: transparent;
        cursor: pointer;
      }
    `,
  ],
})
export class OrbComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  /**
   * Intensity of wave
   */
  @Input() intensity = 0;

  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);
  private readonly _audio = inject(AudioService);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private orb!: THREE.Mesh;
  private originalVertices: Float32Array | null = null;
  private animationId!: number;

  private targetIntensity = 0;
  private currentIntensity = 0;

  private clock = new THREE.Timer();
  private elapsedTime = 0;

  get isRecording() {
    return this._audio.isRecording;
  }

  get orbSize() {
    return this._config.orb?.size ?? 400;
  }

  /**
   * Toggle recording
   */
  toggleRecording() {
    this._audio.toggleRecording();
  }

  ngOnInit() {
    if (this._platform.isServer) return;

    this._init();
    this._animate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._platform.isServer) return;

    if (changes['intensity']) {
      this.targetIntensity = changes['intensity'].currentValue;
    }
  }

  ngOnDestroy() {
    if (this._platform.isServer) return;

    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.orb.geometry.dispose();
    (this.orb.material as THREE.Material).dispose();
  }

  @HostListener('window:keydown.Space', ['$event'])
  handleSpacebarPress(event: Event): void {
    event.preventDefault(); // Prevents the default space bar action (e.g., scrolling)
    this.toggleRecording();
  }

  /**
   * Initialize
   */
  private _init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.camera.position.z = 3;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Initial resize to fit container
    this._resize();

    // Orb Geometry (Icosahedron for organic detail)
    const geometry = new THREE.IcosahedronGeometry(1.2, 32);
    this.originalVertices = geometry.attributes['position'].array.slice() as Float32Array;

    const material = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      emissive: 0x0066ff,
      emissiveIntensity: 0.5,
    });

    this.orb = new THREE.Mesh(geometry, material);
    this.scene.add(this.orb);

    const light = new THREE.PointLight(0xffffff, 15, 10);
    light.position.set(2, 2, 2);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x404040));
  }

  /**
   * Animate
   */
  private _animate = () => {
    this.animationId = requestAnimationFrame(this._animate);

    // 1. Get the time passed since the last frame (delta)
    const delta = this.clock.getDelta();

    // 2. Smoothly update currentIntensity
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * 0.05;

    // 3. Increment our own elapsedTime ticker.
    // We multiply delta by intensity so the pulse speeds up when busy,
    // but it won't "run away" as performance.now() grows.
    const speedFactor = 1 + this.currentIntensity / 20;
    this.elapsedTime += delta * speedFactor;

    // 4. Rotation (Constant per frame, scaled by intensity)
    this.orb.rotation.y += 0.005 + this.currentIntensity / 5000;
    this.orb.rotation.z += 0.002;

    // 5. Vertex Displacement
    const positionAttribute = this.orb.geometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const x = this.originalVertices![ix];
      const y = this.originalVertices![iy];
      const z = this.originalVertices![iz];

      // We use this.elapsedTime instead of performance.now()
      // This creates a stable frequency regardless of how long the app has been open
      const wave =
        Math.sin(x * 2 + this.elapsedTime) *
        Math.cos(y * 2 + this.elapsedTime) *
        (this.currentIntensity / 300);

      const currentRadius = Math.sqrt(x * x + y * y + z * z) + wave;
      const finalScale = Math.min(currentRadius, 2.5) / 1.5;

      positionAttribute.setXYZ(i, x * finalScale, y * finalScale, z * finalScale);
    }

    positionAttribute.needsUpdate = true;

    // Optional: Update material feedback based on intensity
    const material = this.orb.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 0.2 + this.currentIntensity / 100;
    material.opacity = 0.3 + this.currentIntensity / 200;

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Resize container
   */
  private _resize() {
    const width = this.orbSize ?? this.rendererContainer.nativeElement.clientWidth;
    const height = this.orbSize ?? this.rendererContainer.nativeElement.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
