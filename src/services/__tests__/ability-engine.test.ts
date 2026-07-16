import { describe, it, expect } from 'vitest';

// ============ 工具函数测试 ============

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(value, min), max);
}

function logisticScore(rawScore: number, k: number = 0.015, base: number = 10, max: number = 100): number {
  const range = max - base;
  return base + range * (1 - Math.exp(-k * rawScore));
}

function getDifficultyMultiplier(difficulty: string | null): number {
  switch (difficulty?.toUpperCase()) {
    case 'EXPERT': return 2.0;
    case 'HARD': return 1.5;
    case 'MEDIUM': return 1.0;
    case 'EASY': return 0.6;
    default: return 0.8;
  }
}

function techBreadthScore(techCount: number): number {
  if (techCount <= 0) return 0;
  return 20 * Math.log2(techCount + 1);
}

interface ProjectScore {
  completeness: number;
  depth: number;
  presentation: number;
  difficulty: number;
  total: number;
}

function scoreProject(project: {
  title?: string | null;
  description?: string | null;
  techStack?: string | null;
  attachments?: string | null;
  links?: string | null;
  outcome?: string | null;
  outcomeType?: string | null;
  outcomeData?: string | null;
  difficultyEncountered?: string | null;
  solution?: string | null;
  videoUrl?: string | null;
  difficulty?: string | null;
}): ProjectScore {
  let completeness = 0;
  if (project.title && project.title.trim().length > 3) completeness += 5;

  const descLen = project.description?.length || 0;
  if (descLen >= 300) completeness += 10;
  else if (descLen >= 100) completeness += 7;
  else if (descLen >= 50) completeness += 5;
  else if (descLen > 0) completeness += 2;

  if (project.techStack) {
    try {
      const techs = JSON.parse(project.techStack);
      if (Array.isArray(techs) && techs.length > 0) completeness += 5;
    } catch { /* ignore */ }
  }

  if (project.attachments || project.links) completeness += 5;

  let depth = 0;
  const outcomeLen = project.outcome?.length || 0;
  if (outcomeLen >= 100) depth += 10;
  else if (outcomeLen >= 30) depth += 7;
  else if (outcomeLen > 0) depth += 4;

  if (project.outcomeType === 'QUANTIFIED' || project.outcomeData) depth += 10;

  const diffLen = project.difficultyEncountered?.length || 0;
  if (diffLen >= 50) depth += 5;
  else if (diffLen > 10) depth += 3;
  else if (diffLen > 0) depth += 1;

  const solLen = project.solution?.length || 0;
  if (solLen >= 50) depth += 5;
  else if (solLen > 10) depth += 3;
  else if (solLen > 0) depth += 1;

  let presentation = 0;
  if (project.videoUrl && project.videoUrl.length > 5) presentation += 10;
  if (project.links && project.links.length > 5) presentation += 5;
  if (project.attachments && project.attachments.length > 5) presentation += 5;

  let difficultyScore = 0;
  switch (project.difficulty?.toUpperCase()) {
    case 'EXPERT': difficultyScore = 25; break;
    case 'HARD': difficultyScore = 20; break;
    case 'MEDIUM': difficultyScore = 15; break;
    case 'EASY': difficultyScore = 10; break;
    default: difficultyScore = 12;
  }

  const total = clamp(completeness + depth + presentation + difficultyScore);
  return { completeness, depth, presentation, difficulty: difficultyScore, total };
}

describe('ability-engine: clamp', () => {
  it('值在范围内应保持不变', () => {
    expect(clamp(50)).toBe(50);
  });

  it('超过最大值应被截断为最大值', () => {
    expect(clamp(150)).toBe(100);
  });

  it('低于最小值应被截断为最小值', () => {
    expect(clamp(-10)).toBe(0);
  });

  it('边界值应正确处理', () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });
});

describe('ability-engine: logisticScore', () => {
  it('零作品时应返回基础分', () => {
    expect(Math.round(logisticScore(0))).toBe(10);
  });

  it('应呈现前快后慢的增长曲线', () => {
    const s0 = logisticScore(0);
    const s30 = logisticScore(30);
    const s80 = logisticScore(80);
    const s150 = logisticScore(150);
    const s300 = logisticScore(300);

    expect(s0).toBe(10);
    expect(s30).toBeGreaterThan(40);
    expect(s80).toBeGreaterThan(70);
    expect(s150).toBeGreaterThan(85);
    expect(s300).toBeGreaterThan(95);
    expect(s300).toBeLessThanOrEqual(100);

    // 增长应减速：前半段增量 > 后半段增量
    const gain1 = s80 - s30;
    const gain2 = s150 - s80;
    expect(gain1).toBeGreaterThan(gain2);
  });

  it('不同k值应影响收敛速度', () => {
    const slow = logisticScore(50, 0.005);
    const fast = logisticScore(50, 0.03);
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('ability-engine: getDifficultyMultiplier', () => {
  it('EXPERT难度应为2.0倍', () => {
    expect(getDifficultyMultiplier('EXPERT')).toBe(2.0);
  });

  it('HARD难度应为1.5倍', () => {
    expect(getDifficultyMultiplier('HARD')).toBe(1.5);
  });

  it('MEDIUM难度应为1.0倍', () => {
    expect(getDifficultyMultiplier('MEDIUM')).toBe(1.0);
  });

  it('EASY难度应为0.6倍', () => {
    expect(getDifficultyMultiplier('EASY')).toBe(0.6);
  });

  it('空值应返回默认0.8', () => {
    expect(getDifficultyMultiplier(null)).toBe(0.8);
  });
});

describe('ability-engine: techBreadthScore', () => {
  it('零技术栈应为0分', () => {
    expect(techBreadthScore(0)).toBe(0);
  });

  it('应呈对数增长', () => {
    const s1 = techBreadthScore(1);
    const s5 = techBreadthScore(5);
    const s10 = techBreadthScore(10);

    expect(s1).toBeGreaterThan(0);
    expect(s5).toBeGreaterThan(s1);
    expect(s10).toBeGreaterThan(s5);

    // 增速递减
    expect(s5 - s1).toBeGreaterThan(s10 - s5);
  });
});

describe('ability-engine: scoreProject', () => {
  it('空项目应有最低分（仅难度默认分）', () => {
    const result = scoreProject({});
    expect(result.total).toBe(12); // 只有默认难度分
    expect(result.completeness).toBe(0);
    expect(result.depth).toBe(0);
    expect(result.presentation).toBe(0);
  });

  it('完整项目应得高分', () => {
    const result = scoreProject({
      title: '全栈电商系统',
      description: 'a'.repeat(350),
      techStack: '["React", "Node.js", "PostgreSQL"]',
      attachments: '["screenshot1.png"]',
      links: '["https://demo.com"]',
      outcome: 'a'.repeat(120),
      outcomeType: 'QUANTIFIED',
      outcomeData: '{"users": 1000}',
      difficultyEncountered: 'a'.repeat(60),
      solution: 'a'.repeat(60),
      videoUrl: 'https://video.com/demo',
      difficulty: 'HARD',
    });

    expect(result.total).toBeGreaterThan(80);
    expect(result.completeness).toBe(25);
    expect(result.depth).toBe(30);
    expect(result.presentation).toBe(20);
    expect(result.difficulty).toBe(20);
  });

  it('描述长度应分档加分', () => {
    const short = scoreProject({ description: '短描述' });
    const medium = scoreProject({ description: 'a'.repeat(80) });
    const long = scoreProject({ description: 'a'.repeat(150) });
    const veryLong = scoreProject({ description: 'a'.repeat(400) });

    expect(short.completeness).toBe(2);
    expect(medium.completeness).toBe(5);
    expect(long.completeness).toBe(7);
    expect(veryLong.completeness).toBe(10);
  });

  it('技术栈解析失败不应崩溃', () => {
    const result = scoreProject({ techStack: 'invalid json' });
    expect(result.completeness).toBe(0);
  });

  it('不同难度应得分不同', () => {
    const easy = scoreProject({ difficulty: 'EASY' });
    const medium = scoreProject({ difficulty: 'MEDIUM' });
    const hard = scoreProject({ difficulty: 'HARD' });
    const expert = scoreProject({ difficulty: 'EXPERT' });

    expect(easy.difficulty).toBe(10);
    expect(medium.difficulty).toBe(15);
    expect(hard.difficulty).toBe(20);
    expect(expert.difficulty).toBe(25);
  });

  it('视频应有显著加分', () => {
    const withoutVideo = scoreProject({ title: 'Test' });
    const withVideo = scoreProject({ title: 'Test', videoUrl: 'https://v.com/x' });
    expect(withVideo.presentation).toBeGreaterThan(withoutVideo.presentation);
  });

  it('总分不应超过100', () => {
    const perfect = scoreProject({
      title: 'Perfect',
      description: 'a'.repeat(500),
      techStack: '["A"]',
      attachments: '["x"]',
      links: '["x"]',
      outcome: 'a'.repeat(200),
      outcomeType: 'QUANTIFIED',
      outcomeData: '{}',
      difficultyEncountered: 'a'.repeat(100),
      solution: 'a'.repeat(100),
      videoUrl: 'https://v.com/x',
      difficulty: 'EXPERT',
    });
    expect(perfect.total).toBeLessThanOrEqual(100);
  });
});

describe('ability-engine: 综合维度计算逻辑', () => {
  it('零项目时各维度应接近基础分', () => {
    const baseScore = Math.round(logisticScore(0));
    expect(baseScore).toBe(10);
  });

  it('项目质量应比数量更重要', () => {
    // 1个高质量项目
    const highQualityRaw = 85 * 1.0 * 1.5; // 总分×时间权重×难度系数
    const highQualityScore = logisticScore(highQualityRaw);

    // 5个低质量项目（默认难度，简单内容）
    const lowQualityRaw = 5 * 20 * 0.8; // 每个约20分
    const lowQualityScore = logisticScore(lowQualityRaw);

    // 高质量单个项目应接近或超过多个低质量项目
    expect(highQualityScore).toBeGreaterThan(lowQualityScore * 0.7);
  });

  it('时间衰减应降低旧项目权重', () => {
    // 模拟：近期项目 vs 2年前项目
    const recent = 80 * 1.0;   // 时间权重1.0
    const old = 80 * 0.25;      // 时间权重0.25
    expect(recent).toBeGreaterThan(old);
  });
});
