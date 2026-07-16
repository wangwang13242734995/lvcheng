import { describe, it, expect } from 'vitest';
import {
  extractTechStack,
  suggestDifficulty,
  detectOutcome,
  calculateCompleteness,
  generateSuggestions,
  analyzeProject,
} from '@/services/project-parser';

describe('project-parser: extractTechStack', () => {
  it('应从描述中提取技术栈', () => {
    const text = '使用 React 和 Node.js 开发的全栈项目，数据库用的 PostgreSQL';
    const result = extractTechStack(text);
    expect(result).toContain('React');
    expect(result).toContain('Node.js');
    expect(result).toContain('PostgreSQL');
  });

  it('应识别多种别名', () => {
    const text = '前端用 vue3 + ts，后端用 nestjs + postgres';
    const result = extractTechStack(text);
    expect(result).toContain('Vue');
    expect(result).toContain('TypeScript');
    expect(result).toContain('NestJS');
    expect(result).toContain('PostgreSQL');
  });

  it('不应误匹配（如 react 匹配到 reactive）', () => {
    const text = '使用了 reactive 编程模式';
    const result = extractTechStack(text);
    expect(result).not.toContain('React');
  });

  it('空文本应返回空数组', () => {
    expect(extractTechStack('')).toEqual([]);
  });

  it('应识别AI/机器学习技术', () => {
    const text = '基于 PyTorch 和 OpenAI API 构建的 LLM 应用';
    const result = extractTechStack(text);
    expect(result).toContain('PyTorch');
    expect(result).toContain('OpenAI API');
  });

  it('应识别DevOps工具', () => {
    const text = '使用 Docker 容器化部署，Kubernetes 编排，CI/CD 自动化';
    const result = extractTechStack(text);
    expect(result).toContain('Docker');
    expect(result).toContain('Kubernetes');
    expect(result).toContain('CI/CD');
  });

  it('应去重同一技术的不同别名', () => {
    const text = 'React react reactjs React.js';
    const result = extractTechStack(text);
    expect(result.filter(t => t === 'React')).toHaveLength(1);
  });
});

describe('project-parser: suggestDifficulty', () => {
  it('含分布式+高并发应建议EXPERT', () => {
    const text = '设计了分布式架构，支持高并发千万级请求';
    expect(suggestDifficulty(text)).toBe('EXPERT');
  });

  it('含全栈+Docker应建议HARD', () => {
    const text = '全栈开发，使用 Docker 部署';
    expect(suggestDifficulty(text)).toBe('HARD');
  });

  it('含简单CRUD应建议MEDIUM或EASY', () => {
    const text = '简单的 CRUD 操作，前端页面展示';
    const result = suggestDifficulty(text);
    expect(['MEDIUM', 'EASY']).toContain(result);
  });

  it('无关键词应默认MEDIUM', () => {
    expect(suggestDifficulty('一个普通项目')).toBe('MEDIUM');
  });
});

describe('project-parser: detectOutcome', () => {
  it('应检测获奖', () => {
    const text = '项目获得一等奖';
    const result = detectOutcome(text);
    expect(result.type).toBe('AWARD');
  });

  it('应检测上线状态', () => {
    const text = '项目已上线，部署在生产环境';
    const result = detectOutcome(text);
    expect(result.type).toBe('LAUNCHED');
  });

  it('应检测开源', () => {
    const text = '已开源到 GitHub，获得 500 star';
    const result = detectOutcome(text);
    expect(result.type).toBe('OPEN_SOURCE');
  });

  it('应检测量化数据', () => {
    const text = '日活 5000 用户，处理 10万 请求';
    const result = detectOutcome(text);
    expect(result.type).toBe('QUANTIFIED');
    expect(result.quantified.length).toBeGreaterThan(0);
  });

  it('无成果信息应返回空类型', () => {
    const text = '一个普通的项目描述';
    const result = detectOutcome(text);
    expect(result.type).toBe('');
  });
});

describe('project-parser: calculateCompleteness', () => {
  it('完整项目应得高分', () => {
    const score = calculateCompleteness({
      title: '全栈电商平台',
      description: 'a'.repeat(350),
      techStack: ['React', 'Node.js'],
      outcome: '项目获得全国大学生竞赛一等奖，日活用户5000+',
      difficultyEncountered: '高并发场景下的性能瓶颈',
      solution: '引入Redis缓存，QPS提升3倍',
      videoUrl: 'https://video.com/demo',
      links: [{ type: 'GitHub', url: 'https://github.com' }],
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('空项目应得低分', () => {
    const score = calculateCompleteness({});
    expect(score).toBe(0);
  });

  it('只有标题应得10分', () => {
    const score = calculateCompleteness({ title: '测试项目' });
    expect(score).toBe(10);
  });
});

describe('project-parser: generateSuggestions', () => {
  it('空项目应给出所有建议', () => {
    const suggestions = generateSuggestions({});
    expect(suggestions.length).toBeGreaterThanOrEqual(5);
  });

  it('完整项目应给出较少建议', () => {
    const suggestions = generateSuggestions({
      description: 'a'.repeat(200),
      techStack: ['React'],
      outcome: '获奖',
      difficultyEncountered: '遇到困难',
      solution: '解决方案',
      videoUrl: 'https://video.com',
    });
    expect(suggestions.length).toBe(0);
  });
});

describe('project-parser: analyzeProject', () => {
  it('应返回完整的解析结果', () => {
    const result = analyzeProject({
      title: '基于React的推荐系统',
      description: '使用 React 和 Python 开发的推荐系统，日活 1万 用户，已上线',
      difficultyEncountered: '推荐算法精度不够',
      solution: '引入协同过滤算法',
    });

    expect(result.techStack).toContain('React');
    expect(result.techStack).toContain('Python');
    expect(result.suggestedDifficulty).toBeTruthy();
    expect(result.detectedOutcomeType).toBe('LAUNCHED');
    expect(result.quantifiedResults.length).toBeGreaterThan(0);
    expect(result.completenessScore).toBeGreaterThan(0);
    expect(result.suggestions).toBeDefined();
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('应合并已有技术栈和检测到的技术栈', () => {
    const result = analyzeProject({
      description: '使用 Docker 部署',
      existingTechStack: ['React', 'Node.js'],
    });
    expect(result.techStack).toContain('React');
    expect(result.techStack).toContain('Node.js');
    expect(result.techStack).toContain('Docker');
  });
});
