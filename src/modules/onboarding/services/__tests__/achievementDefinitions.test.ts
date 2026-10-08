import { describe, it, expect } from 'vitest';
import {
  getLevelFromXP,
  ACHIEVEMENTS,
  GUARDIAN_LEVELS,
} from '../achievementDefinitions';

// ================================================================
// ACHIEVEMENTS data
// ================================================================
describe('ACHIEVEMENTS', () => {
  it('has 30 achievements', () => {
    expect(ACHIEVEMENTS.length).toBe(30);
  });

  it('each achievement has required fields', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(['discipline', 'growth', 'consistency', 'mastery', 'special']).toContain(a.category);
      expect(typeof a.xpReward).toBe('number');
      expect(a.condition.type).toBeTruthy();
      expect(typeof a.condition.value).toBe('number');
    });
  });

  it('all IDs are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all 5 categories', () => {
    const categories = new Set(ACHIEVEMENTS.map(a => a.category));
    expect(categories.size).toBe(5);
  });
});

// ================================================================
// GUARDIAN_LEVELS data
// ================================================================
describe('GUARDIAN_LEVELS', () => {
  it('has 10 levels', () => {
    expect(GUARDIAN_LEVELS).toHaveLength(10);
  });

  it('levels are in ascending order', () => {
    for (let i = 1; i < GUARDIAN_LEVELS.length; i++) {
      expect(GUARDIAN_LEVELS[i].level).toBeGreaterThan(GUARDIAN_LEVELS[i - 1].level);
    }
  });

  it('XP requirements are in ascending order', () => {
    for (let i = 1; i < GUARDIAN_LEVELS.length; i++) {
      expect(GUARDIAN_LEVELS[i].xpRequired).toBeGreaterThan(GUARDIAN_LEVELS[i - 1].xpRequired);
    }
  });

  it('level 1 starts at 0 XP', () => {
    expect(GUARDIAN_LEVELS[0].xpRequired).toBe(0);
  });

  it('level 10 requires 10000 XP', () => {
    expect(GUARDIAN_LEVELS[9].xpRequired).toBe(10000);
  });
});

// ================================================================
// getLevelFromXP()
// ================================================================
describe('getLevelFromXP()', () => {
  it('0 XP → level 1, title "Aprendiz Financeiro"', () => {
    const result = getLevelFromXP(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe('Aprendiz Financeiro');
  });

  it('0 XP → progress 0%, next level at 100', () => {
    const result = getLevelFromXP(0);
    expect(result.progress).toBe(0);
    expect(result.nextLevelXP).toBe(100);
  });

  it('50 XP → level 1, progress 50%', () => {
    const result = getLevelFromXP(50);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(50);
  });

  it('99 XP → level 1 (boundary)', () => {
    const result = getLevelFromXP(99);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(99);
  });

  it('100 XP → level 2 "Iniciado"', () => {
    const result = getLevelFromXP(100);
    expect(result.level).toBe(2);
    expect(result.title).toBe('Iniciado');
    expect(result.progress).toBe(0);
  });

  it('200 XP → level 2, progress 50%', () => {
    const result = getLevelFromXP(200);
    expect(result.level).toBe(2);
    // XP in level: 200-100=100, XP needed: 300-100=200 → 50%
    expect(result.progress).toBe(50);
  });

  it('1000 XP → level 5 "Especialista"', () => {
    const result = getLevelFromXP(1000);
    expect(result.level).toBe(5);
    expect(result.title).toBe('Especialista');
  });

  it('9999 XP → level 9 "Lenda"', () => {
    const result = getLevelFromXP(9999);
    expect(result.level).toBe(9);
    expect(result.title).toBe('Lenda');
  });

  it('10000 XP → level 10 "Guardião Supremo"', () => {
    const result = getLevelFromXP(10000);
    expect(result.level).toBe(10);
    expect(result.title).toBe('Guardião Supremo');
  });

  it('max level → progress 100%', () => {
    const result = getLevelFromXP(10000);
    expect(result.progress).toBe(100);
  });

  it('beyond max XP → still level 10, progress 100%', () => {
    const result = getLevelFromXP(99999);
    expect(result.level).toBe(10);
    expect(result.progress).toBe(100);
  });
});
