import { describe, it, expect } from 'vitest';
import {
  calculateArchetype,
  analyzeStrengths,
  analyzeGrowthAreas,
  ARCHETYPES,
  QUIZ_QUESTIONS,
} from '../personalityAnalyzer';

// ================================================================
// ARCHETYPES data
// ================================================================
describe('ARCHETYPES', () => {
  it('has 5 archetypes', () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(5);
  });

  it('each archetype has required fields', () => {
    Object.values(ARCHETYPES).forEach(a => {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.strengths.length).toBeGreaterThan(0);
    });
  });

  it('archetype IDs match keys', () => {
    Object.entries(ARCHETYPES).forEach(([key, value]) => {
      expect(value.id).toBe(key);
    });
  });
});

// ================================================================
// QUIZ_QUESTIONS data
// ================================================================
describe('QUIZ_QUESTIONS', () => {
  it('has 8 questions', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(8);
  });

  it('each question has 4 options', () => {
    QUIZ_QUESTIONS.forEach(q => {
      expect(q.options).toHaveLength(4);
    });
  });

  it('each option references valid archetypes', () => {
    const validIds = Object.keys(ARCHETYPES);
    QUIZ_QUESTIONS.forEach(q => {
      q.options.forEach(opt => {
        Object.keys(opt.archetypes).forEach(id => {
          expect(validIds).toContain(id);
        });
      });
    });
  });
});

// ================================================================
// calculateArchetype()
// ================================================================
describe('calculateArchetype()', () => {
  it('all first options (strategist-heavy) → primary = strategist', () => {
    const answers = QUIZ_QUESTIONS.map(q => ({
      questionId: q.id,
      optionIndex: 0,
    }));
    const result = calculateArchetype(answers);
    expect(result.primary).toBe('strategist');
    expect(result.scores.strategist).toBeGreaterThan(0);
  });

  it('all second options (explorer-heavy) → primary = explorer', () => {
    const answers = QUIZ_QUESTIONS.map(q => ({
      questionId: q.id,
      optionIndex: 1,
    }));
    const result = calculateArchetype(answers);
    expect(result.primary).toBe('explorer');
  });

  it('all third options (guardian-heavy) → primary = guardian', () => {
    const answers = QUIZ_QUESTIONS.map(q => ({
      questionId: q.id,
      optionIndex: 2,
    }));
    const result = calculateArchetype(answers);
    expect(result.primary).toBe('guardian');
  });

  it('all fourth options (balancer-heavy) → primary = balancer', () => {
    const answers = QUIZ_QUESTIONS.map(q => ({
      questionId: q.id,
      optionIndex: 3,
    }));
    const result = calculateArchetype(answers);
    expect(result.primary).toBe('balancer');
  });

  it('returns all 5 archetype scores', () => {
    const answers = [{ questionId: 'q1', optionIndex: 0 }];
    const result = calculateArchetype(answers);
    expect(Object.keys(result.scores)).toEqual(
      expect.arrayContaining(['strategist', 'explorer', 'guardian', 'visionary', 'balancer'])
    );
  });

  it('empty answers → all scores 0', () => {
    const result = calculateArchetype([]);
    Object.values(result.scores).forEach(score => {
      expect(score).toBe(0);
    });
  });

  it('invalid questionId → ignored gracefully', () => {
    const result = calculateArchetype([{ questionId: 'invalid', optionIndex: 0 }]);
    Object.values(result.scores).forEach(score => {
      expect(score).toBe(0);
    });
  });

  it('invalid optionIndex → ignored gracefully', () => {
    const result = calculateArchetype([{ questionId: 'q1', optionIndex: 99 }]);
    Object.values(result.scores).forEach(score => {
      expect(score).toBe(0);
    });
  });

  it('scores accumulate correctly for single question', () => {
    // q1, option 0: { strategist: 3, guardian: 1 }
    const result = calculateArchetype([{ questionId: 'q1', optionIndex: 0 }]);
    expect(result.scores.strategist).toBe(3);
    expect(result.scores.guardian).toBe(1);
    expect(result.scores.explorer).toBe(0);
  });
});

// ================================================================
// analyzeStrengths()
// ================================================================
describe('analyzeStrengths()', () => {
  it('strategist → 4 strengths', () => {
    const strengths = analyzeStrengths('strategist');
    expect(strengths).toHaveLength(4);
    expect(strengths).toContain('Organização');
  });

  it('guardian → includes Segurança', () => {
    expect(analyzeStrengths('guardian')).toContain('Segurança');
  });

  it('invalid archetype → empty array', () => {
    expect(analyzeStrengths('nonexistent')).toEqual([]);
  });
});

// ================================================================
// analyzeGrowthAreas()
// ================================================================
describe('analyzeGrowthAreas()', () => {
  it('strategist → 3 growth areas', () => {
    const areas = analyzeGrowthAreas('strategist');
    expect(areas).toHaveLength(3);
    expect(areas).toContain('Flexibilidade');
  });

  it('explorer → includes Paciência', () => {
    expect(analyzeGrowthAreas('explorer')).toContain('Paciência');
  });

  it('guardian → includes Diversificação', () => {
    expect(analyzeGrowthAreas('guardian')).toContain('Diversificação');
  });

  it('invalid archetype → empty array', () => {
    expect(analyzeGrowthAreas('nonexistent')).toEqual([]);
  });
});
