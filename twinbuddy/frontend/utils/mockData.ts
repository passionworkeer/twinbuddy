/**
 * mockData.ts — Frontend mock data utilities
 * Provides mock personas for development / fallback when API is unavailable.
 */

import type { Persona } from '../types/persona';
import {
  PERSONA_EXAMPLES,
  PERSONA_MOCK_DATA,
} from '../src/mocks/personaMock';

/** Randomly pick one of the 3 vivid personas (seeded for reproducibility in dev) */
export function getRandomPersona(): Persona {
  const idx = Math.floor(Math.random() * PERSONA_EXAMPLES.length);
  return PERSONA_EXAMPLES[idx]!;
}

/**
 * Mock persona used when USE_MOCK=true or the API is unreachable.
 * Defaults to the ENFP persona (蔓妮).
 */
export const MOCK_PERSONA: Persona = PERSONA_MOCK_DATA;

/**
 * All available mock personas — useful for preview / demo screens.
 */
export { PERSONA_EXAMPLES };
