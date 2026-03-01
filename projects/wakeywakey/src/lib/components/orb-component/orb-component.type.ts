export interface OrbConfig {
  /**
   * Height and width (px)
   */
  size?: number;

  /**
   * Particle count
   */
  particlesCount?: number;

  /**
   * Radius
   */
  radius?: number;

  /**
   * Mode of orb
   *
   * auto: Automatically switches states based on inputs (idle, speaking, listening, thinking)
   * manual: user manually controls orb
   */
  mode?: 'auto' | 'manual';
}

export type AgentState = 'idle' | 'initialized' | 'listening' | 'thinking' | 'speaking';
