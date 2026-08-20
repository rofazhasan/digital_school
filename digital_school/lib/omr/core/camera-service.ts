/**
 * Camera Service — ROFAZ OMR Intelligence Engine
 * 
 * Manages device camera lifecycle, hardware capabilities, torch control,
 * dynamic resolution tiers (low-res preview vs high-res capture), frame throttling,
 * and memory safety with explicit buffer cleanup.
 */

export interface DeviceTier {
  category: 'LOW_END' | 'MID_RANGE' | 'HIGH_END' | 'IOS_PREMIUM';
  recommendedLiveWidth: number;
  recommendedLiveHeight: number;
  maxFrameRate: number;
  enableMultiPassConsensus: boolean;
  workerCount: number;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isTorchActive: boolean = false;
  private detectedTier: DeviceTier;

  constructor() {
    this.detectedTier = this.assessDeviceCapabilities();
  }

  /**
   * Assesses device hardware capability to determine optimal processing parameters.
   */
  public assessDeviceCapabilities(): DeviceTier {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        category: 'MID_RANGE',
        recommendedLiveWidth: 640,
        recommendedLiveHeight: 480,
        maxFrameRate: 15,
        enableMultiPassConsensus: true,
        workerCount: 2
      };
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB

    if (isIOS) {
      return {
        category: 'IOS_PREMIUM',
        recommendedLiveWidth: 800,
        recommendedLiveHeight: 600,
        maxFrameRate: 20,
        enableMultiPassConsensus: true,
        workerCount: 2
      };
    }

    if (hardwareConcurrency >= 8 && deviceMemory >= 6) {
      return {
        category: 'HIGH_END',
        recommendedLiveWidth: 960,
        recommendedLiveHeight: 720,
        maxFrameRate: 20,
        enableMultiPassConsensus: true,
        workerCount: 4
      };
    }

    if (hardwareConcurrency <= 4 || deviceMemory <= 2) {
      return {
        category: 'LOW_END',
        recommendedLiveWidth: 480,
        recommendedLiveHeight: 360,
        maxFrameRate: 10,
        enableMultiPassConsensus: false,
        workerCount: 1
      };
    }

    return {
      category: 'MID_RANGE',
      recommendedLiveWidth: 640,
      recommendedLiveHeight: 480,
      maxFrameRate: 15,
      enableMultiPassConsensus: true,
      workerCount: 2
    };
  }

  public getDeviceTier(): DeviceTier {
    return this.detectedTier;
  }

  /**
   * Initializes environment (rear) camera stream with optimal constraints.
   */
  public async initializeStream(videoEl: HTMLVideoElement): Promise<MediaStream> {
    this.videoElement = videoEl;

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = this.stream;
      videoEl.setAttribute('playsinline', 'true');
      await videoEl.play();
      return this.stream;
    } catch (err) {
      console.warn('Failed with high-res constraints, trying fallback camera constraints...', err);
      // Fallback to basic video
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      videoEl.srcObject = this.stream;
      videoEl.setAttribute('playsinline', 'true');
      await videoEl.play();
      return this.stream;
    }
  }

  /**
   * Toggles hardware torch/flashlight if supported.
   */
  public async toggleTorch(): Promise<boolean> {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return false;

    const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
    if (capabilities?.torch) {
      try {
        const nextState = !this.isTorchActive;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        this.isTorchActive = nextState;
        return this.isTorchActive;
      } catch (err) {
        console.error('Failed to toggle torch:', err);
      }
    }
    return false;
  }

  public isTorchOn(): boolean {
    return this.isTorchActive;
  }

  /**
   * Grabs a high-resolution snapshot from the video stream onto an isolated canvas.
   * Performs immediate resource management to prevent memory retention.
   */
  public captureHighResFrame(): { data: ImageData; width: number; height: number } | null {
    if (!this.videoElement || this.videoElement.readyState < 2) return null;

    const width = this.videoElement.videoWidth || 1920;
    const height = this.videoElement.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);

    // Free canvas reference immediately
    canvas.width = 0;
    canvas.height = 0;

    return {
      data: imgData,
      width,
      height
    };
  }

  /**
   * Stops camera stream and frees hardware locks.
   */
  public stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.isTorchActive = false;
  }
}
