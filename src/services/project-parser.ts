/**
 * 项目智能解析服务
 * 基于规则引擎从项目描述中自动提取技术栈、难度、成果等信息
 * 减少用户手动填写负担，提升数据质量和能力评估准确性
 */

// ============ 技术栈关键词字典 ============

interface TechEntry {
  name: string;
  aliases: string[];
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'ai' | 'language' | 'tool';
}

const TECH_DICTIONARY: TechEntry[] = [
  // 前端
  { name: 'React', aliases: ['react', 'reactjs', 'react.js'], category: 'frontend' },
  { name: 'Vue', aliases: ['vue', 'vuejs', 'vue.js', 'vue2', 'vue3'], category: 'frontend' },
  { name: 'Angular', aliases: ['angular', 'angularjs'], category: 'frontend' },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next'], category: 'frontend' },
  { name: 'Nuxt.js', aliases: ['nuxt.js', 'nuxtjs', 'nuxt'], category: 'frontend' },
  { name: 'Svelte', aliases: ['svelte', 'sveltekit'], category: 'frontend' },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss'], category: 'frontend' },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], category: 'language' },
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6'], category: 'language' },
  { name: 'HTML/CSS', aliases: ['html', 'css', 'html5', 'css3'], category: 'frontend' },
  { name: 'Sass', aliases: ['sass', 'scss'], category: 'frontend' },
  { name: 'Webpack', aliases: ['webpack'], category: 'tool' },
  { name: 'Vite', aliases: ['vite'], category: 'tool' },

  // 后端
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'], category: 'backend' },
  { name: 'Express', aliases: ['express', 'express.js'], category: 'backend' },
  { name: 'Koa', aliases: ['koa', 'koa.js'], category: 'backend' },
  { name: 'NestJS', aliases: ['nestjs', 'nest.js', 'nest'], category: 'backend' },
  { name: 'Python', aliases: ['python', 'py', 'python3'], category: 'language' },
  { name: 'Django', aliases: ['django'], category: 'backend' },
  { name: 'Flask', aliases: ['flask'], category: 'backend' },
  { name: 'FastAPI', aliases: ['fastapi', 'fast api'], category: 'backend' },
  { name: 'Java', aliases: ['java'], category: 'language' },
  { name: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring'], category: 'backend' },
  { name: 'Go', aliases: ['go', 'golang'], category: 'language' },
  { name: 'Rust', aliases: ['rust'], category: 'language' },
  { name: 'C++', aliases: ['c++', 'cpp', 'c plus plus'], category: 'language' },
  { name: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet'], category: 'language' },
  { name: 'PHP', aliases: ['php'], category: 'language' },
  { name: 'Laravel', aliases: ['laravel'], category: 'backend' },
  { name: 'Ruby', aliases: ['ruby', 'rb'], category: 'language' },
  { name: 'Rails', aliases: ['rails', 'ruby on rails'], category: 'backend' },

  // 数据库
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'pg'], category: 'database' },
  { name: 'MySQL', aliases: ['mysql'], category: 'database' },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo'], category: 'database' },
  { name: 'Redis', aliases: ['redis'], category: 'database' },
  { name: 'SQLite', aliases: ['sqlite'], category: 'database' },
  { name: 'Supabase', aliases: ['supabase'], category: 'database' },
  { name: 'Prisma', aliases: ['prisma'], category: 'database' },
  { name: 'Elasticsearch', aliases: ['elasticsearch', 'es', 'elastic'], category: 'database' },

  // DevOps
  { name: 'Docker', aliases: ['docker'], category: 'devops' },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'], category: 'devops' },
  { name: 'CI/CD', aliases: ['ci/cd', 'cicd', 'github actions', 'gitlab ci', 'jenkins'], category: 'devops' },
  { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'], category: 'devops' },
  { name: 'GCP', aliases: ['gcp', 'google cloud', 'firebase'], category: 'devops' },
  { name: 'Azure', aliases: ['azure'], category: 'devops' },
  { name: 'Nginx', aliases: ['nginx'], category: 'devops' },
  { name: 'Linux', aliases: ['linux', 'ubuntu', 'centos', 'debian'], category: 'devops' },

  // 移动端
  { name: 'React Native', aliases: ['react native', 'rn'], category: 'mobile' },
  { name: 'Flutter', aliases: ['flutter', 'dart'], category: 'mobile' },
  { name: 'iOS/Swift', aliases: ['swift', 'ios', 'swiftui', 'uikit'], category: 'mobile' },
  { name: 'Android/Kotlin', aliases: ['kotlin', 'android'], category: 'mobile' },

  // AI/数据
  { name: 'TensorFlow', aliases: ['tensorflow', 'tf'], category: 'ai' },
  { name: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'ai' },
  { name: 'Pandas', aliases: ['pandas'], category: 'ai' },
  { name: 'NumPy', aliases: ['numpy'], category: 'ai' },
  { name: 'Scikit-learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'], category: 'ai' },
  { name: 'OpenCV', aliases: ['opencv', 'cv2'], category: 'ai' },
  { name: 'LangChain', aliases: ['langchain'], category: 'ai' },
  { name: 'OpenAI API', aliases: ['openai', 'gpt', 'chatgpt', 'llm'], category: 'ai' },
  { name: 'Hugging Face', aliases: ['hugging face', 'huggingface', 'transformers'], category: 'ai' },

  // 工具
  { name: 'Git', aliases: ['git', 'github', 'gitlab'], category: 'tool' },
  { name: 'Figma', aliases: ['figma'], category: 'tool' },
  { name: 'GraphQL', aliases: ['graphql', 'gql'], category: 'backend' },
  { name: 'WebSocket', aliases: ['websocket', 'ws', 'socket.io', 'socketio'], category: 'backend' },
  { name: 'REST API', aliases: ['rest api', 'restful', 'rest'], category: 'backend' },
];

// ============ 难度评估关键词 ============

const DIFFICULTY_INDICATORS = {
  EXPERT: ['分布式', '微服务', '高并发', '千万级', '亿级', '架构设计', '性能优化', '高可用', '容灾', '中间件', '源码', '编译器', '操作系统', '内核'],
  HARD: ['全栈', '系统设计', '数据库优化', '缓存', '消息队列', 'CI/CD', 'Docker', 'Kubernetes', '机器学习', '深度学习', '实时', '推荐系统', '搜索引擎'],
  MEDIUM: ['CRUD', 'API', '前端', '后端', '数据库', '认证', '授权', '部署', '测试', '第三方'],
  EASY: ['静态', '页面', '展示', '简单', '入门', '基础', 'Demo', '作业'],
};

// ============ 成果识别模式 ============

const OUTCOME_PATTERNS = {
  QUANTIFIED: /(\d+(?:\.\d+)?)\s*(万|千|百|k|K|M|次|个|人|用户|访问|下载|请求|秒|ms|MB|GB)/g,
  AWARD: /(?:获|拿|得|赢得)(?:一等|二等|三等|特等|优秀|最佳|冠军|亚军|季军|金|银|铜)?(?:奖|杯|名)/,
  LAUNCHED: /(?:已上线|上线|部署|发布|launch|deployed|线上|生产环境|公网)/,
  OPEN_SOURCE: /(?:开源|GitHub|open.?source|star|fork|仓库|repo)/,
};

// ============ 解析结果接口 ============

export interface ProjectAnalysis {
  techStack: string[];
  suggestedDifficulty: string;
  detectedOutcomeType: string;
  quantifiedResults: string[];
  completenessScore: number;
  suggestions: string[];
}

// ============ 核心解析函数 ============

/**
 * 从项目描述中提取技术栈
 */
export function extractTechStack(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const tech of TECH_DICTIONARY) {
    for (const alias of tech.aliases) {
      // 使用单词边界匹配，避免误匹配（如 "react" 匹配到 "reactive"）
      const regex = new RegExp(`\\b${alias.replace(/[.+*?^$()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.add(tech.name);
        break;
      }
    }
  }

  return Array.from(found);
}

/**
 * 根据描述内容建议难度等级
 */
export function suggestDifficulty(text: string): string {
  const lowerText = text.toLowerCase();
  let expertCount = 0;
  let hardCount = 0;
  let mediumCount = 0;
  let easyCount = 0;

  for (const keyword of DIFFICULTY_INDICATORS.EXPERT) {
    if (lowerText.includes(keyword.toLowerCase())) expertCount++;
  }
  for (const keyword of DIFFICULTY_INDICATORS.HARD) {
    if (lowerText.includes(keyword.toLowerCase())) hardCount++;
  }
  for (const keyword of DIFFICULTY_INDICATORS.MEDIUM) {
    if (lowerText.includes(keyword.toLowerCase())) mediumCount++;
  }
  for (const keyword of DIFFICULTY_INDICATORS.EASY) {
    if (lowerText.includes(keyword.toLowerCase())) easyCount++;
  }

  if (expertCount >= 2) return 'EXPERT';
  if (expertCount >= 1 || hardCount >= 2) return 'HARD';
  if (hardCount >= 1 || mediumCount >= 2) return 'MEDIUM';
  if (mediumCount >= 1 || easyCount >= 1) return 'EASY';
  return 'MEDIUM';
}

/**
 * 检测成果类型和量化数据
 */
export function detectOutcome(text: string): { type: string; quantified: string[] } {
  let type = '';
  const quantified: string[] = [];

  // 检测量化数据
  let match: RegExpExecArray | null;
  const quantifiedRegex = new RegExp(OUTCOME_PATTERNS.QUANTIFIED);
  while ((match = quantifiedRegex.exec(text)) !== null && quantified.length < 5) {
    quantified.push(match[0]);
  }

  // 检测成果类型（按优先级）
  if (OUTCOME_PATTERNS.AWARD.test(text)) {
    type = 'AWARD';
  } else if (OUTCOME_PATTERNS.LAUNCHED.test(text)) {
    type = 'LAUNCHED';
  } else if (OUTCOME_PATTERNS.OPEN_SOURCE.test(text)) {
    type = 'OPEN_SOURCE';
  } else if (quantified.length > 0) {
    type = 'QUANTIFIED';
  }

  // 清洗量化数据
  const cleanedQuantified = quantified.map(q => q.trim()).filter(q => q.length > 1);

  return { type, quantified: cleanedQuantified };
}

/**
 * 计算描述完整度评分（0-100）
 */
export function calculateCompleteness(fields: {
  title?: string;
  description?: string;
  techStack?: string[];
  outcome?: string;
  difficultyEncountered?: string;
  solution?: string;
  videoUrl?: string;
  links?: unknown[];
}): number {
  let score = 0;

  if (fields.title && fields.title.trim().length > 3) score += 10;
  if (fields.description) {
    const len = fields.description.length;
    if (len >= 300) score += 25;
    else if (len >= 100) score += 18;
    else if (len >= 50) score += 12;
    else if (len > 0) score += 5;
  }
  if (fields.techStack && fields.techStack.length > 0) score += 15;
  if (fields.outcome && fields.outcome.length > 10) score += 15;
  if (fields.difficultyEncountered && fields.difficultyEncountered.length > 10) score += 10;
  if (fields.solution && fields.solution.length > 10) score += 10;
  if (fields.videoUrl) score += 10;
  if (fields.links && fields.links.length > 0) score += 5;

  return Math.min(score, 100);
}

/**
 * 生成改进建议
 */
export function generateSuggestions(fields: {
  title?: string;
  description?: string;
  techStack?: string[];
  outcome?: string;
  difficultyEncountered?: string;
  solution?: string;
  videoUrl?: string;
  links?: unknown[];
}): string[] {
  const suggestions: string[] = [];

  if (!fields.description || fields.description.length < 100) {
    suggestions.push('描述可以更详细，建议至少100字，说明项目背景、目标和实现方式');
  }
  if (!fields.techStack || fields.techStack.length === 0) {
    suggestions.push('添加技术栈信息，帮助评估技术广度');
  }
  if (!fields.outcome || fields.outcome.length === 0) {
    suggestions.push('记录项目成果，如量化数据、获奖情况或上线状态');
  }
  if (!fields.difficultyEncountered || fields.difficultyEncountered.length === 0) {
    suggestions.push('记录遇到的困难，体现解决问题的能力');
  }
  if (!fields.solution || fields.solution.length === 0) {
    suggestions.push('记录解决方案，展示技术深度');
  }
  if (!fields.videoUrl) {
    suggestions.push('添加演示视频，大幅提升展示力评分');
  }

  return suggestions;
}

/**
 * 综合解析项目信息
 */
export function analyzeProject(input: {
  title?: string;
  description?: string;
  difficultyEncountered?: string;
  solution?: string;
  videoUrl?: string;
  links?: unknown[];
  existingTechStack?: string[];
}): ProjectAnalysis {
  const fullText = [input.title, input.description, input.difficultyEncountered, input.solution]
    .filter(Boolean)
    .join(' ');

  // 提取技术栈（合并已有和检测到的）
  const detectedTech = extractTechStack(fullText);
  const existingTech = input.existingTechStack || [];
  const techStack = Array.from(new Set([...existingTech, ...detectedTech]));

  // 建议难度
  const suggestedDifficulty = suggestDifficulty(fullText);

  // 检测成果
  const { type: detectedOutcomeType, quantified: quantifiedResults } = detectOutcome(fullText);

  // 完整度
  const completenessScore = calculateCompleteness({
    title: input.title,
    description: input.description,
    techStack,
    outcome: input.description,
    difficultyEncountered: input.difficultyEncountered,
    solution: input.solution,
    videoUrl: input.videoUrl,
    links: input.links,
  });

  // 建议
  const suggestions = generateSuggestions({
    title: input.title,
    description: input.description,
    techStack,
    outcome: input.description,
    difficultyEncountered: input.difficultyEncountered,
    solution: input.solution,
    videoUrl: input.videoUrl,
    links: input.links,
  });

  return {
    techStack,
    suggestedDifficulty,
    detectedOutcomeType,
    quantifiedResults,
    completenessScore,
    suggestions,
  };
}
