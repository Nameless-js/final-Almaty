export type Point2D = { x: number; y: number; z?: number };
export type Frame = Point2D[]; // 21 landmarks
export type GesturePattern = Frame[];

export class GestureSequenceEngine {
  private buffer: Frame[] = [];
  private readonly MAX_BUFFER_SIZE = 60; // 2 seconds at 30fps
  private readonly MIN_SEQUENCE_LENGTH = 15; // 0.5 seconds
  private lastMatchTime: number = 0;
  private readonly DEBOUNCE_TIME = 2000; // 2 seconds

  /**
   * Normalizes hand landmarks to be scale and position invariant.
   * - Centers all points relative to the wrist (point 0).
   * - Scales all points so the distance from wrist to middle finger base (point 9) is 1.
   */
  public normalizeFrame(landmarks: Point2D[]): Frame {
    if (!landmarks || landmarks.length === 0) return [];

    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    
    // Calculate scale factor: distance from wrist to middle finger base
    let scale = Math.sqrt(
      Math.pow(middleBase.x - wrist.x, 2) + 
      Math.pow(middleBase.y - wrist.y, 2)
    );
    
    if (scale === 0) scale = 1;

    return landmarks.map(p => ({
      x: (p.x - wrist.x) / scale,
      y: (p.y - wrist.y) / scale
    }));
  }

  /**
   * Calculates the Euclidean distance between two normalized frames.
   */
  private calculateFrameDistance(f1: Frame, f2: Frame): number {
    let dist = 0;
    for (let i = 0; i < f1.length; i++) {
      dist += Math.sqrt(
        Math.pow(f1[i].x - f2[i].x, 2) + 
        Math.pow(f1[i].y - f2[i].y, 2)
      );
    }
    return dist / f1.length;
  }

  /**
   * Computes Dynamic Time Warping (DTW) distance between two sequences of frames.
   */
  public calculateDTWDistance(seq1: GesturePattern, seq2: GesturePattern): number {
    const n = seq1.length;
    const m = seq2.length;
    
    if (n === 0 || m === 0) return Infinity;

    // Initialize DTW matrix
    const dtw: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = this.calculateFrameDistance(seq1[i - 1], seq2[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],    // insertion
          dtw[i][j - 1],    // deletion
          dtw[i - 1][j - 1] // match
        );
      }
    }

    return dtw[n][m] / Math.max(n, m);
  }

  /**
   * Adds a raw frame to the buffer.
   */
  public addFrame(rawLandmarks: Point2D[]) {
    const normalized = this.normalizeFrame(rawLandmarks);
    this.buffer.push(normalized);
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  /**
   * Clears the current frame buffer.
   */
  public clearBuffer() {
    this.buffer = [];
  }

  /**
   * Returns the motion energy between the last two frames in the buffer.
   * Useful for the Motion Energy Bar.
   */
  public getMotionEnergy(): number {
    if (this.buffer.length < 2) return 0;
    
    const curr = this.buffer[this.buffer.length - 1];
    const prev = this.buffer[this.buffer.length - 2];
    
    return this.calculateFrameDistance(curr, prev);
  }

  /**
   * Returns the current raw buffer (for recording new gestures).
   */
  public getCurrentBuffer(): GesturePattern {
    return this.buffer;
  }

  /**
   * Attempts to find a match in the provided gesture library.
   */
  public match(library: any[]): { word: string | null, confidence: number } {
    const now = Date.now();
    if (now - this.lastMatchTime < this.DEBOUNCE_TIME) {
      return { word: null, confidence: 0 };
    }

    if (this.buffer.length < this.MIN_SEQUENCE_LENGTH) {
      return { word: null, confidence: 0 };
    }

    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    // DTW threshold - can be tuned
    const DTW_THRESHOLD = 0.8;

    for (const gesture of library) {
      if (gesture.pattern_json && Array.isArray(gesture.pattern_json) && gesture.pattern_json.length > 0) {
        // If pattern_json is an array of frames (dynamic)
        const isDynamic = Array.isArray(gesture.pattern_json[0]);
        
        let distance = Infinity;
        if (isDynamic) {
          // Dynamic matching
          // Normalize stored pattern just in case (though it should be saved normalized)
          const storedPattern: GesturePattern = gesture.pattern_json;
          // Extract the recent N frames from our buffer where N is roughly the length of the stored pattern
          const seqLength = Math.min(storedPattern.length * 1.5, this.buffer.length);
          const recentBuffer = this.buffer.slice(this.buffer.length - Math.floor(seqLength));
          
          distance = this.calculateDTWDistance(recentBuffer, storedPattern);
        } else {
          // Fallback for old static single-frame data
          const storedFrame: Frame = gesture.pattern_json;
          const currentFrame = this.buffer[this.buffer.length - 1];
          distance = this.calculateFrameDistance(currentFrame, storedFrame);
        }

        if (distance < bestDistance) {
          bestDistance = distance;
          if (bestDistance < DTW_THRESHOLD) {
            bestMatch = gesture.word;
          }
        }
      }
    }

    if (bestMatch) {
      this.lastMatchTime = now;
      this.clearBuffer(); // Clear buffer after a successful match
    }

    return { 
      word: bestMatch, 
      confidence: bestDistance === Infinity ? 0 : Math.max(0, 1 - bestDistance) 
    };
  }
}
