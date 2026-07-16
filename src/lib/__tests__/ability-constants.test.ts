import { describe, it, expect } from 'vitest';
import {
  ABILITY_BASE_SCORE,
  ABILITY_TOTAL_BASE_SCORE,
  DEFAULT_ABILITY_SCORES,
} from '@/lib/ability-constants';

describe('ability-constants', () => {
  it('基础分应统一为 10', () => {
    expect(ABILITY_BASE_SCORE).toBe(10);
    expect(ABILITY_TOTAL_BASE_SCORE).toBe(10);
  });

  it('DEFAULT_ABILITY_SCORES 应为新基础分', () => {
    expect(DEFAULT_ABILITY_SCORES.craft).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.learn).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.drive).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.team).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.grit).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.express).toBe(10);
    expect(DEFAULT_ABILITY_SCORES.totalScore).toBe(10);
  });

  it('默认值不应残留 30', () => {
    expect(DEFAULT_ABILITY_SCORES.craft).not.toBe(30);
    expect(DEFAULT_ABILITY_SCORES.totalScore).not.toBe(30);
  });
});
