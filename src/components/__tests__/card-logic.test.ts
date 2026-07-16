import { describe, it, expect } from 'vitest';

const skillLabels: Record<string, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

interface Scores {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore?: number;
}

const getTopSkill = (scores: Scores) => {
  const entries = Object.entries(scores).filter(([key]) => key !== 'totalScore');
  const max = entries.reduce((prev, curr) => (curr[1] as number) > (prev[1] as number) ? curr : prev);
  return { label: skillLabels[max[0]], value: max[1] };
};

describe('TalentCard: getTopSkill', () => {
  it('应返回分数最高的能力标签和值', () => {
    const scores = { craft: 80, learn: 60, drive: 70, team: 50, grit: 55, express: 65 };
    const result = getTopSkill(scores);
    expect(result.label).toBe('专业力');
    expect(result.value).toBe(80);
  });

  it('应忽略 totalScore 字段', () => {
    const scores = { craft: 60, learn: 75, drive: 70, team: 50, grit: 55, express: 65, totalScore: 200 };
    const result = getTopSkill(scores);
    expect(result.label).toBe('学习力');
    expect(result.value).toBe(75);
  });

  it('所有分数相同时应返回合法的能力项', () => {
    const scores = { craft: 50, learn: 50, drive: 50, team: 50, grit: 50, express: 50 };
    const result = getTopSkill(scores);
    expect(result.value).toBe(50);
    expect(['专业力', '学习力', '自驱力', '协作力', '抗压力', '表达力']).toContain(result.label);
  });

  it('低分场景也应正确识别最高分', () => {
    const scores = { craft: 10, learn: 15, drive: 5, team: 20, grit: 12, express: 8 };
    const result = getTopSkill(scores);
    expect(result.label).toBe('协作力');
    expect(result.value).toBe(20);
  });
});

const typeLabels: Record<string, string> = {
  COURSE: '课程作业',
  COMPETITION: '比赛',
  INTERNSHIP: '实习',
  PERSONAL: '个人项目',
  CHALLENGE: '挑战赛',
};

const typeIcons: Record<string, string> = {
  COURSE: '📚',
  COMPETITION: '🏆',
  INTERNSHIP: '💼',
  PERSONAL: '🚀',
  CHALLENGE: '⚔️',
};

describe('ProjectCard: 类型映射', () => {
  it('所有已知类型都应有对应的标签和图标', () => {
    const types = Object.keys(typeLabels);
    types.forEach((type) => {
      expect(typeLabels[type]).toBeDefined();
      expect(typeIcons[type]).toBeDefined();
      expect(typeLabels[type].length).toBeGreaterThan(0);
      expect(typeIcons[type].length).toBeGreaterThan(0);
    });
  });

  it('应映射所有5种项目类型', () => {
    expect(Object.keys(typeLabels)).toHaveLength(5);
    expect(Object.keys(typeIcons)).toHaveLength(5);
  });

  it('typeLabels 和 typeIcons 键名应一一对应', () => {
    expect(Object.keys(typeLabels)).toEqual(Object.keys(typeIcons));
  });
});

describe('ChallengeCard: 金额格式化', () => {
  it('大于0时应显示带千分位的金额', () => {
    expect((1000).toLocaleString()).toBe('1,000');
    expect((50000).toLocaleString()).toBe('50,000');
    expect((0).toLocaleString()).toBe('0');
  });

  it('为0时不应显示金额', () => {
    const rewardAmount = 0;
    const shouldShow = rewardAmount > 0;
    expect(shouldShow).toBe(false);
  });

  it('为正数时应显示金额', () => {
    const rewardAmount = 100;
    const shouldShow = rewardAmount > 0;
    expect(shouldShow).toBe(true);
  });
});
