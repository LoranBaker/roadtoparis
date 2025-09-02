// inline-3d-model.component.ts - Enhanced with improved orbit controls
import {
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Model3DIntegrationService } from '../../services/3d-model-integration.service';

@Component({
  selector: 'app-inline3d-model',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-model-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">3D-Modell wird geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{{ errorMessage }}</p>
        <button (click)="retry()" class="retry-button">Erneut versuchen</button>
      </div>

      <!-- No Model State -->
      <div *ngIf="!hasModel && !isLoading && !hasError" class="no-model-state">
        <div class="no-model-icon">🏢</div>
        <p class="no-model-text">Kein 3D-Modell verfügbar</p>
        <small class="no-model-subtext">Für diese Adresse ist kein 3D-Modell verfügbar</small>
      </div>

      <!-- 3D Canvas -->
      <div 
        #canvas 
        class="canvas-wrapper"
        [class.hidden]="isLoading || hasError || !hasModel"
      ></div>
    </div>
  `,
  styles: [`
    .inline-model-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, #f5f9ff 0%, #e8f2ff 100%);
      box-sizing: border-box;
      user-select: none;
    }

    .canvas-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      min-height: 200px;
      cursor: grab;
      box-sizing: border-box;
      touch-action: none;
      z-index: 1;
      pointer-events: auto;
    }

    .canvas-wrapper canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      outline: none;
      border: none;
      pointer-events: auto !important;
      z-index: 1;
    }

    .canvas-wrapper:active {
      cursor: grabbing;
    }

    .canvas-wrapper.hidden {
      display: none !important;
    }

    .loading-state,
    .error-state,
    .no-model-state {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px;
      z-index: 100;
      background: rgba(245, 249, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      pointer-events: auto;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(59, 130, 246, 0.3);
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon,
    .no-model-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    .loading-text,
    .error-text,
    .no-model-text {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .no-model-subtext {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .retry-button {
      margin: 4px;
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .retry-button:hover {
      transform: translateY(-1px);
      opacity: 0.9;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .inline-model-container {
        min-height: 150px;
      }
      
      .canvas-wrapper {
        min-height: 150px;
      }
    }

    /* Ensure proper event handling */
    .inline-model-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, #f5f9ff 0%, #e8f2ff 100%);
      box-sizing: border-box;
      user-select: none;
    }

    /* Force canvas to receive all mouse events */
    .canvas-wrapper canvas {
      position: relative !important;
      z-index: 1 !important;
    }
  `]
})
export class Inline3DModelComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLDivElement>;
  @Input() address: string = '';
  @Input() buildingId: string | null = null;

  // State management
  isLoading = false;
  hasError = false;
  hasModel = false;
  errorMessage = '';

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private animationId?: number;
  private modelObject?: THREE.Object3D;
  private lastFrameTime: number = 0;

  // Environment enhancement properties
  private terrain?: THREE.Group;
  private sky?: Sky;
  private environmentLights: THREE.Light[] = [];

  constructor(
    private building3DService: Model3DIntegrationService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initScene();
        setTimeout(() => {
          this.loadModel();
        }, 100);
      }, 200);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (isPlatformBrowser(this.platformId)) {
      if (changes['address'] || changes['buildingId']) {
        this.resetStates();
        setTimeout(() => {
          this.loadModel();
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // State management methods
  private resetStates(): void {
    this.isLoading = false;
    this.hasError = false;
    this.hasModel = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  private updateStates(loading: boolean, hasModel: boolean, hasError: boolean, errorMessage: string = ''): void {
    this.isLoading = loading;
    this.hasModel = hasModel;
    this.hasError = hasError;
    this.errorMessage = errorMessage;
    
    console.log('🔄 State updated:', { loading, hasModel, hasError, errorMessage });
    this.cdr.detectChanges();
  }

  retry(): void {
    console.log('🔄 Retry clicked');
    this.updateStates(false, false, false, '');
    
    const cacheInfo = this.building3DService.getCacheInfo();
    console.log('🔄 Retrying with current service cache status:', cacheInfo);
    
    setTimeout(() => {
      this.loadModel();
    }, 100);
  }

  // Debug methods - removed for production
  testDirectRequest(): void {
    // Method kept for compatibility but functionality removed
  }

  generateDebugReport(): void {
    // Method kept for compatibility but functionality removed
  }

  // Scene initialization with enhanced orbit controls
  private initScene(): void {
    if (!this.canvas) {
      console.error('❌ Canvas element not found');
      return;
    }

    const container = this.canvas.nativeElement;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    console.log('🎭 Initializing scene with dimensions:', { width, height });

    try {
      // Enhanced scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf5f9ff);
      this.scene.fog = new THREE.FogExp2(0xf5f9ff, 0.005);

      // Enhanced camera
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
      this.camera.position.set(15, 15, 15);

      // Enhanced renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      
      // Ensure canvas styling
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
      this.renderer.domElement.style.outline = 'none';
      this.renderer.domElement.style.border = 'none';
      this.renderer.domElement.tabIndex = -1;
      
      container.appendChild(this.renderer.domElement);

      // ENHANCED ORBIT CONTROLS - Much better interaction
      this.setupOrbitControls();

      // Handle context loss
      this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
        console.warn('WebGL context lost. Trying to restore...');
        event.preventDefault();
        this.recreateRenderer();
      }, false);

      // Enhanced resize handler
      if (isPlatformBrowser(this.platformId)) {
        const resizeObserver = new ResizeObserver(() => this.onResize());
        resizeObserver.observe(container);
        
        // Also handle window resize as fallback
        window.addEventListener('resize', () => this.onResize());
      }

      // Create environment
      this.createEnvironment();

      // Start animation loop
      this.lastFrameTime = performance.now();
      this.animate();

      console.log('✅ Scene initialized successfully with enhanced orbit controls');

    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
      this.updateStates(false, false, true, 'Fehler beim Initialisieren des 3D-Viewers');
    }
  }

  // ENHANCED ORBIT CONTROLS SETUP
  private setupOrbitControls(): void {
    if (!this.camera || !this.renderer) return;

    console.log('🎮 Setting up enhanced orbit controls...');

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Core movement settings - optimized for smooth interaction
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08; // Smoother damping
    this.controls.screenSpacePanning = false; // Better for 3D navigation

    // Rotation settings - smooth and responsive
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.8;
    this.controls.autoRotate = false; // Can be enabled for demo mode
    this.controls.autoRotateSpeed = 1.0;

    // Zoom settings - smooth zooming
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.2;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 500;

    // Pan settings - allow moving around
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;
    this.controls.keyPanSpeed = 7.0;

    // Vertical rotation limits - prevent flipping
    this.controls.minPolarAngle = 0; // No limit at top
    this.controls.maxPolarAngle = Math.PI * 0.8; // Prevent going under ground

    // Keyboard controls (updated for newer Three.js versions)
    this.controls.listenToKeyEvents(window);

    // Touch controls for mobile
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Mouse buttons
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    // ENHANCED: Ensure canvas element receives events properly
    const canvas = this.renderer.domElement;
    canvas.style.pointerEvents = 'auto';
    canvas.style.touchAction = 'none';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1';
    
    // Force focus to enable interactions
    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    // Event listeners for better interaction feedback
    this.controls.addEventListener('start', () => {
      console.log('🎮 Control interaction started');
      canvas.style.cursor = 'grabbing';
    });

    this.controls.addEventListener('end', () => {
      console.log('🎮 Control interaction ended');
      canvas.style.cursor = 'grab';
    });

    this.controls.addEventListener('change', () => {
      // Render on control changes for immediate feedback
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    });

    // ENHANCED: Additional event handling to ensure interaction works
    canvas.addEventListener('mousedown', (e) => {
      console.log('🖱️ Mouse down on canvas:', e.button);
      e.stopPropagation();
    }, { passive: false });

    canvas.addEventListener('wheel', (e) => {
      console.log('🎯 Wheel event on canvas');
      e.stopPropagation();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      console.log('👆 Touch start on canvas');
      e.stopPropagation();
    }, { passive: false });

    // Focus handling for keyboard controls
    canvas.addEventListener('mouseenter', () => {
      canvas.focus();
    });

    // Prevent context menu on right click (used for panning)
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // DEBUGGING: Log when controls are ready
    setTimeout(() => {
      console.log('✅ Enhanced orbit controls configured and ready');
      console.log('🔍 Canvas element:', canvas);
      console.log('🔍 Canvas style:', {
        pointerEvents: canvas.style.pointerEvents,
        position: canvas.style.position,
        zIndex: canvas.style.zIndex,
        touchAction: canvas.style.touchAction
      });
    }, 100);
  }

  // Environment creation
  private createEnvironment(): void {
    if (!this.scene || !this.camera) return;
    
    console.log('🌍 Creating environment...');
    
    this.addPremiumLighting();
    this.createTerrain();
    this.createSky();
    
    console.log('✅ Environment created');
  }

  private addPremiumLighting(): void {
    if (!this.scene) return;
    
    // Remove existing lights
    for (const light of this.environmentLights) {
      this.scene.remove(light);
    }
    this.environmentLights = [];
    
    // Primary directional light (sun)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(50, 100, 75);
    mainLight.castShadow = true;
    
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.bias = -0.0001;
    
    const shadowSize = 100;
    mainLight.shadow.camera.left = -shadowSize;
    mainLight.shadow.camera.bottom = -shadowSize;
    mainLight.shadow.camera.right = shadowSize;
    mainLight.shadow.camera.top = shadowSize;
    
    this.scene.add(mainLight);
    this.environmentLights.push(mainLight);
    
    // Ambient hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3333ff, 0.6);
    this.scene.add(hemiLight);
    this.environmentLights.push(hemiLight);
    
    // Fill lights
    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight1.position.set(-50, 50, -75);
    this.scene.add(fillLight1);
    this.environmentLights.push(fillLight1);
    
    const fillLight2 = new THREE.DirectionalLight(0xffffee, 0.3);
    fillLight2.position.set(100, 25, -100);
    this.scene.add(fillLight2);
    this.environmentLights.push(fillLight2);
    
    // Ground bounce light
    const bounceLight = new THREE.DirectionalLight(0xccffcc, 0.2);
    bounceLight.position.set(0, -10, 0);
    bounceLight.target.position.set(0, 0, 0);
    this.scene.add(bounceLight);
    this.scene.add(bounceLight.target);
    this.environmentLights.push(bounceLight);
  }

  private createTerrain(): void {
    if (!this.scene) return;
    
    if (this.terrain) {
      this.scene.remove(this.terrain);
    }
    
    this.terrain = new THREE.Group();
    this.terrain.name = "terrain";
    
    const gridSize = this.modelObject ? 
      new THREE.Box3().setFromObject(this.modelObject).getSize(new THREE.Vector3()).length() * 3 : 
      300;
    
    const groundSize = gridSize;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xeee9d9,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    
    // Add procedural texture
    const textureSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d')!;
    
    context.fillStyle = '#edebe0';
    context.fillRect(0, 0, textureSize, textureSize);
    
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * textureSize;
      const y = Math.random() * textureSize;
      const size = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.07;
      
      context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      context.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    groundMaterial.map = texture;
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    ground.name = "groundPlane";
    
    this.terrain.add(ground);
    
    // Add water feature
    this.addWaterFeature(groundSize * 0.3);
    
    this.scene.add(this.terrain);
  }

  private addWaterFeature(size: number): void {
    if (!this.terrain) return;
    
    const waterPosition = new THREE.Vector3(size * 0.5, -0.05, size * 0.5);
    
    const waterGeometry = new THREE.PlaneGeometry(size * 0.4, size * 0.3);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x0055aa,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.copy(waterPosition);
    water.name = "waterFeature";
    
    this.terrain.add(water);
  }

  private createSky(): void {
    if (!this.scene) return;
    
    if (this.sky) {
      this.scene.remove(this.sky);
    }
    
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 2;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;
    
    const phi = THREE.MathUtils.degToRad(60);
    const theta = THREE.MathUtils.degToRad(135);
    
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sunPosition);
    
    this.scene.add(this.sky);
    
    console.log('✅ Sky created');
  }

  // Enhanced camera positioning for better orbit experience
  private positionCameraForModel(modelObject: THREE.Object3D): void {
    if (!this.camera || !this.controls) return;

    const boundingBox = new THREE.Box3().setFromObject(modelObject);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Calculate optimal distance for the camera
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 2.5; // 2.5x for better view
    
    // Position camera at an optimal angle
    const theta = Math.PI / 4; // 45 degrees horizontal
    const phi = Math.PI / 6;   // 30 degrees vertical
    
    this.camera.position.set(
      center.x + distance * Math.sin(theta) * Math.cos(phi),
      center.y + distance * Math.sin(phi) + size.y * 0.3,
      center.z + distance * Math.cos(theta) * Math.cos(phi)
    );
    
    // Set target to model center (slightly above ground)
    const targetY = center.y + size.y * 0.3;
    this.controls.target.set(center.x, targetY, center.z);
    
    // Update controls and camera
    this.controls.update();
    this.camera.lookAt(center.x, targetY, center.z);
    
    // Set appropriate zoom limits based on model size
    this.controls.minDistance = maxDim * 0.5;
    this.controls.maxDistance = maxDim * 10;
    
    console.log('📸 Camera positioned optimally for model interaction', {
      center,
      size,
      distance,
      cameraPosition: this.camera.position,
      target: this.controls.target
    });
  }

  // Renderer management
  private recreateRenderer(): void {
    if (!this.canvas) return;
    
    const container = this.canvas.nativeElement;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;
    
    if (this.renderer) {
      container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
      container.appendChild(this.renderer.domElement);
      
      if (this.camera) {
        this.setupOrbitControls();
      }
    } catch (e) {
      console.error('Failed to recreate renderer:', e);
    }
  }

  private onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvas || !this.camera || !this.renderer) return;

    const container = this.canvas.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    
    // Update controls if available
    if (this.controls) {
      this.controls.update();
    }
  }

  // Model loading
  private async loadModel(): Promise<void> {
    if (!this.scene) {
      console.error('❌ Scene not initialized');
      return;
    }

    console.log('🚀 Starting loadModel...');
    this.updateStates(true, false, false, '');

    try {
      let targetBuildingId: string | null = this.buildingId;

      if (!targetBuildingId && this.address) {
        console.log('🔍 Looking up building ID for address:', this.address);
        const result = await this.building3DService.getBuildingIdByAddress(this.address).toPromise();
        targetBuildingId = result || null;
        console.log('📍 Found building ID:', targetBuildingId);
      }

      if (!targetBuildingId) {
        console.log('❌ No building ID found');
        this.updateStates(false, false, false, '');
        return;
      }

      console.log('📥 Attempting to load 3D model for building:', targetBuildingId);
      const model = await this.building3DService.getBuilding3DModel(targetBuildingId).toPromise();

      if (model && model.objData) {
        console.log('✅ Successfully received 3D model data, parsing...');
        
        const parseSuccess = this.parseAndAddModel(model.objData);
        
        if (parseSuccess) {
          this.updateStates(false, true, false, '');
          console.log('🎉 Model loaded and displayed successfully!');
        } else {
          this.updateStates(false, false, true, 'Fehler beim Anzeigen des 3D-Modells');
        }
      } else {
        console.log('❌ No model data received');
        this.updateStates(false, false, false, '');
      }

    } catch (error) {
      console.error('❌ Error loading 3D model:', error);
      
      let errorMsg = 'Fehler beim Laden des 3D-Modells';
      if (error instanceof Error) {
        if (error.message.includes('Serverfehler') || error.message.includes('500')) {
          errorMsg = 'Server-Problem: 3D-Modell temporär nicht verfügbar';
        } else if (error.message.includes('Netzwerkfehler')) {
          errorMsg = 'Netzwerkfehler beim Laden des 3D-Modells';
        }
      }
      
      this.updateStates(false, false, true, errorMsg);
    }
  }

  // Model parsing and processing
  private parseAndAddModel(objData: string): boolean {
    if (!this.scene || !this.camera || !this.controls) {
      console.error('❌ Scene, camera, or controls not initialized');
      return false;
    }

    try {
      console.log('🔧 Starting to parse OBJ data...', objData.substring(0, 200));

      // Clear existing models
      const existingModels = this.scene.children.filter((child: THREE.Object3D) => child.userData['isModel']);
      existingModels.forEach((model: THREE.Object3D) => this.scene!.remove(model));

      // Parse OBJ
      const loader = new OBJLoader();
      const objRoot = loader.parse(objData);

      console.log('📦 OBJ parsed, children count:', objRoot.children.length);

      if (objRoot.children.length === 0) {
        console.warn('⚠️ Empty OBJ model - creating fallback cube');
        this.createFallbackModel();
        return true;
      }

      // Create a new group for the corrected model
      const rootGroup = new THREE.Group();

      // Correct orientation (Z-up to Y-up)
      objRoot.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.rotateX(-Math.PI / 2);
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
          child.position.set(0, 0, 0);
          child.rotation.set(0, 0, 0);
          child.scale.set(1, 1, 1);
        }
      });

      // Calculate bounding box and center model
      const correctedBoundingBox = new THREE.Box3().setFromObject(objRoot);
      const correctedCenter = correctedBoundingBox.getCenter(new THREE.Vector3());

      // Center the model and place it on the ground
      objRoot.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const position = child.geometry.getAttribute('position');
          if (position) {
            for (let i = 0; i < position.count; i++) {
              const x = position.getX(i) - correctedCenter.x;
              const y = position.getY(i) - correctedBoundingBox.min.y;
              const z = position.getZ(i) - correctedCenter.z;
              position.setXYZ(i, x, y, z);
            }
            position.needsUpdate = true;
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
          }
        }
      });

      rootGroup.rotation.set(0, 0, 0);
      rootGroup.add(objRoot);

      // Apply materials and process meshes
      const meshes: THREE.Mesh[] = [];
      objRoot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });

      console.log('📊 Total meshes found:', meshes.length);

      if (meshes.length === 0) {
        console.warn('⚠️ No meshes found in OBJ - creating fallback cube');
        this.createFallbackModel();
        return true;
      }

      // Apply materials
      const materials = [
        // Glass material
        new THREE.MeshPhysicalMaterial({
          color: 0xbedcff,
          metalness: 0.1,
          roughness: 0.05,
          transparent: true,
          opacity: 0.6,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1
        }),
        // Concrete material
        new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          metalness: 0.1,
          roughness: 0.7,
        }),
        // Metal material
        new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.8,
          roughness: 0.2,
        })
      ];
      
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        const materialIndex = i % materials.length;
        mesh.material = materials[materialIndex];
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add edge lines
        const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x333333,
          opacity: 0.5,
          transparent: true,
          linewidth: 1
        });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);
        mesh.add(edgeLines);
        
        console.log(`🎨 Applied material to mesh ${i + 1}/${meshes.length}`);
      }

      // Mark as model and add to scene
      rootGroup.userData['isModel'] = true;
      this.modelObject = rootGroup;
      this.scene.add(rootGroup);

      // ENHANCED: Position camera optimally for orbit controls
      this.positionCameraForModel(rootGroup);

      // Recreate environment with model-based sizing
      this.createEnvironment();

      console.log('🎉 Model parsing and positioning complete with enhanced orbit controls!');
      return true;

    } catch (error) {
      console.error('❌ Error parsing 3D model:', error);
      return false;
    }
  }

  // Fallback model creation
  private createFallbackModel(): void {
    if (!this.scene) return;

    console.log('🎲 Creating fallback model...');

    const group = new THREE.Group();
    
    // Create a colorful building-like structure
    const buildingGeometry = new THREE.BoxGeometry(4, 6, 3);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 3;
    building.castShadow = true;
    building.receiveShadow = true;
    
    // Add a roof
    const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 7;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    
    group.add(building);
    group.add(roof);
    
    // Add wireframe for visibility
    const buildingWireframe = new THREE.WireframeGeometry(buildingGeometry);
    const buildingLines = new THREE.LineSegments(buildingWireframe);
    buildingLines.material = new THREE.LineBasicMaterial({ color: 0x000000 });
    buildingLines.position.copy(building.position);
    group.add(buildingLines);
    
    group.userData['isModel'] = true;
    group.userData['isFallback'] = true;
    this.modelObject = group;
    this.scene.add(group);
    
    // ENHANCED: Position camera optimally for fallback model
    this.positionCameraForModel(group);
    
    console.log('✅ Fallback model created with enhanced orbit controls');
  }

  // Enhanced animation loop
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.animationId = requestAnimationFrame(this.animate);
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    // Smooth controls update with frame limiting
    if (deltaTime < 0.1 && this.controls) {
      this.controls.update();
    }
    
    // Water animation
    if (this.terrain) {
      const water = this.terrain.getObjectByName("waterFeature") as THREE.Mesh;
      if (water && water.material instanceof THREE.MeshPhongMaterial) {
        const time = currentTime * 0.001;
        const r = 0.0;
        const g = 0.2 + Math.sin(time * 0.3) * 0.05;
        const b = 0.5 + Math.sin(time * 0.5) * 0.1;
        water.material.color.setRGB(r, g, b);
      }
    }
    
    // Render the scene
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('❌ Render error:', error);
    }
  };

  // Cleanup
  private cleanup(): void {
    console.log('🧹 Cleaning up 3D scene...');
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.controls) {
      this.controls.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.scene) {
      // Dispose of all geometries and materials
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      this.scene.clear();
    }
    
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize);
    }
    
    console.log('✅ Cleanup complete');
  }
}