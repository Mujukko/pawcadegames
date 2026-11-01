export interface SlopeObstacle {
  x: number; // Lateral position (-0.8 to 0.8)
  z: number; // Distance down the track (meters)
  width: number;
  height: number;
  type: 'block' | 'ramp';
}

export interface TrackSegment {
  z: number;
  width: number; // Platform width at this z
  curve: number; // Track curvature offset X
  obstacles: SlopeObstacle[];
}

export interface SlopeBall {
  x: number; // Lateral position (-1.0 to 1.0 within track)
  y: number; // Vertical height above track (0 if grounded, >0 if jumping from ramp)
  vy: number;
  rollAngle: number;
  speed: number; // Current forward speed (meters/sec)
}

export interface SlopeState {
  ball: SlopeBall;
  distance: number; // Total distance traveled (meters)
  score: number;
  bestScore: number;
  status: 'playing' | 'crashed';
  segments: TrackSegment[];
}

export interface SlopeInput {
  steerX: number; // -1 (left) to 1 (right)
}
