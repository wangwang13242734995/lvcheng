import { describe, it, expect, beforeEach } from 'vitest';

// E2E 模拟测试：验证关键用户流程的数据流完整性
// 不依赖真实浏览器，通过模拟数据流验证业务逻辑链路

describe('E2E: 注册 → 登录 → 创建项目 → 查看名片 流程', () => {
  interface MockUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
  }

  interface MockProject {
    id: string;
    userId: string;
    title: string;
    type: string;
    status: string;
    techStack: string[];
    description: string;
    outcome: string;
    outcomeType: string;
    difficulty: string;
  }

  interface MockAbilityScore {
    userId: string;
    craft: number;
    learn: number;
    drive: number;
    team: number;
    grit: number;
    express: number;
    totalScore: number;
  }

  let users: MockUser[] = [];
  let projects: MockProject[] = [];
  let scores: MockAbilityScore[] = [];
  let session: { userId: string | null } = { userId: null };

  beforeEach(() => {
    users = [];
    projects = [];
    scores = [];
    session = { userId: null };
  });

  // 步骤1: 注册
  function register(name: string, email: string, password: string): { success: boolean; error?: string; user?: MockUser } {
    if (users.some((u) => u.email === email)) {
      return { success: false, error: '该邮箱已注册' };
    }
    if (password.length < 6) {
      return { success: false, error: '密码至少6位' };
    }
    const user: MockUser = {
      id: `user_${users.length + 1}_${Date.now()}`,
      name,
      email,
      password,
      role: 'STUDENT',
    };
    users.push(user);
    return { success: true, user };
  }

  // 步骤2: 登录
  function login(email: string, password: string): { success: boolean; error?: string } {
    const user = users.find((u) => u.email === email);
    if (!user) return { success: false, error: '用户不存在' };
    if (user.password !== password) return { success: false, error: '密码错误' };
    session.userId = user.id;
    return { success: true };
  }

  // 步骤3: 创建项目
  function createProject(data: Partial<MockProject>): { success: boolean; error?: string; project?: MockProject } {
    if (!session.userId) return { success: false, error: '未登录' };
    const project: MockProject = {
      id: `proj_${Date.now()}`,
      userId: session.userId,
      title: data.title || '',
      type: data.type || 'PERSONAL',
      status: 'DRAFT',
      techStack: data.techStack || [],
      description: data.description || '',
      outcome: data.outcome || '',
      outcomeType: data.outcomeType || '',
      difficulty: data.difficulty || '',
    };
    projects.push(project);
    return { success: true, project };
  }

  // 步骤4: 发布项目
  function publishProject(projectId: string): { success: boolean; error?: string } {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: '项目不存在' };
    if (project.userId !== session.userId) return { success: false, error: '无权操作' };
    project.status = 'PUBLISHED';
    return { success: true };
  }

  // 步骤5: 计算能力分数（简化版mock，使用新引擎基础分10）
  function calculateAbility(userId: string): MockAbilityScore | null {
    const userProjects = projects.filter((p) => p.userId === userId && p.status === 'PUBLISHED');
    // 新引擎：基础分10，对数增长，质量优先
    const base = 10;
    const craft = Math.min(100, base + userProjects.length * 15);
    const allTechs = new Set<string>();
    userProjects.forEach((p) => p.techStack.forEach((t) => allTechs.add(t)));
    const learn = Math.min(100, base + allTechs.size * 8);
    const drive = Math.min(100, base + userProjects.filter((p) => p.outcomeType === 'QUANTIFIED').length * 20);
    const team = base;
    const grit = base;
    const express = base;
    const totalScore = Math.round((craft + learn + drive + team + grit + express) / 6);
    const score: MockAbilityScore = { userId, craft, learn, drive, team, grit, express, totalScore };
    scores.push(score);
    return score;
  }

  // 步骤6: 查看公开名片
  function getPublicProfile(userId: string): { user: any; projects: MockProject[]; score: MockAbilityScore | null } {
    const user = users.find((u) => u.id === userId);
    if (!user) return { user: null, projects: [], score: null };
    const publicProjects = projects.filter((p) => p.userId === userId && p.status === 'PUBLISHED');
    const latestScore = scores.filter((s) => s.userId === userId).pop() || null;
    return {
      user: { id: user.id, name: user.name, email: undefined },
      projects: publicProjects,
      score: latestScore,
    };
  }

  it('完整流程：注册→登录→创建项目→发布→计算能力→查看名片', () => {
    // 1. 注册
    const regResult = register('张三', 'zhangsan@test.com', 'password123');
    expect(regResult.success).toBe(true);
    expect(regResult.user?.name).toBe('张三');

    // 2. 登录
    const loginResult = login('zhangsan@test.com', 'password123');
    expect(loginResult.success).toBe(true);
    expect(session.userId).not.toBeNull();

    // 3. 创建项目
    const projResult = createProject({
      title: '智能推荐系统',
      type: 'COMPETITION',
      techStack: ['React', 'Node.js', 'Python'],
      description: '基于深度学习的推荐系统',
      outcome: '获得一等奖',
      outcomeType: 'QUANTIFIED',
      difficulty: 'HARD',
    });
    expect(projResult.success).toBe(true);
    expect(projResult.project?.status).toBe('DRAFT');

    // 4. 发布项目
    const pubResult = publishProject(projResult.project!.id);
    expect(pubResult.success).toBe(true);
    expect(projects[0].status).toBe('PUBLISHED');

    // 5. 计算能力分数
    const score = calculateAbility(session.userId!);
    expect(score).not.toBeNull();
    expect(score!.craft).toBe(25);
    expect(score!.learn).toBe(34);
    expect(score!.drive).toBe(30);
    expect(score!.totalScore).toBeGreaterThan(10);

    // 6. 查看公开名片
    const profile = getPublicProfile(session.userId!);
    expect(profile.user.name).toBe('张三');
    expect(profile.user.email).toBeUndefined();
    expect(profile.projects).toHaveLength(1);
    expect(profile.projects[0].title).toBe('智能推荐系统');
    expect(profile.score?.totalScore).toBe(score!.totalScore);
  });

  it('未登录用户不能创建项目', () => {
    session.userId = null;
    const result = createProject({ title: '测试项目' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('未登录');
  });

  it('不能发布他人的项目', () => {
    register('用户A', 'userA@test.com', 'password123');
    login('userA@test.com', 'password123');
    const proj = createProject({ title: '用户A的项目' });
    expect(proj.success).toBe(true);

    // 切换到用户B
    session.userId = null;
    register('用户B', 'userB@test.com', 'password123');
    login('userB@test.com', 'password123');

    const pubResult = publishProject(proj.project!.id);
    expect(pubResult.success).toBe(false);
    expect(pubResult.error).toBe('无权操作');
  });

  it('重复注册同一邮箱应失败', () => {
    register('张三', 'dup@test.com', 'password123');
    const result = register('李四', 'dup@test.com', 'password456');
    expect(result.success).toBe(false);
    expect(result.error).toBe('该邮箱已注册');
  });

  it('未发布的项目不出现在公开名片中', () => {
    register('王五', 'wangwu@test.com', 'password123');
    login('wangwu@test.com', 'password123');
    createProject({ title: '草稿项目', type: 'PERSONAL' });
    // 不发布

    const profile = getPublicProfile(session.userId!);
    expect(profile.projects).toHaveLength(0);
  });

  it('密码错误时登录应失败', () => {
    register('赵六', 'zhaoliu@test.com', 'correctPassword');
    const result = login('zhaoliu@test.com', 'wrongPassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('密码错误');
  });
});

describe('E2E: 挑战报名 → 提交作品 流程', () => {
  interface MockApplication {
    id: string;
    challengeId: string;
    userId: string;
    status: string;
  }

  interface MockSubmission {
    id: string;
    challengeId: string;
    userId: string;
    title: string;
    description: string;
    status: string;
  }

  let applications: MockApplication[] = [];
  let submissions: MockSubmission[] = [];
  let session: { userId: string | null } = { userId: null };

  beforeEach(() => {
    applications = [];
    submissions = [];
    session = { userId: null };
  });

  function applyChallenge(challengeId: string): { success: boolean; error?: string } {
    if (!session.userId) return { success: false, error: '未登录' };
    if (applications.some((a) => a.challengeId === challengeId && a.userId === session.userId)) {
      return { success: false, error: '已报名' };
    }
    applications.push({
      id: `app_${Date.now()}`,
      challengeId,
      userId: session.userId,
      status: 'PENDING',
    });
    return { success: true };
  }

  function submitWork(challengeId: string, title: string, description: string): { success: boolean; error?: string } {
    if (!session.userId) return { success: false, error: '未登录' };
    const application = applications.find(
      (a) => a.challengeId === challengeId && a.userId === session.userId
    );
    if (!application) return { success: false, error: '未报名' };
    if (!title || !description) return { success: false, error: '标题和描述不能为空' };

    const existing = submissions.find(
      (s) => s.challengeId === challengeId && s.userId === session.userId
    );
    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.status = 'PENDING';
      return { success: true };
    }

    submissions.push({
      id: `sub_${Date.now()}`,
      challengeId,
      userId: session.userId,
      title,
      description,
      status: 'PENDING',
    });
    application.status = 'ACCEPTED';
    return { success: true };
  }

  it('完整流程：报名→提交作品', () => {
    session.userId = 'user_1';
    const applyResult = applyChallenge('challenge_1');
    expect(applyResult.success).toBe(true);

    const submitResult = submitWork('challenge_1', '我的方案', '这是详细描述');
    expect(submitResult.success).toBe(true);
    expect(submissions).toHaveLength(1);
    expect(applications[0].status).toBe('ACCEPTED');
  });

  it('未报名不能直接提交', () => {
    session.userId = 'user_2';
    const result = submitWork('challenge_2', '标题', '描述');
    expect(result.success).toBe(false);
    expect(result.error).toBe('未报名');
  });

  it('不能重复报名同一挑战', () => {
    session.userId = 'user_3';
    applyChallenge('challenge_3');
    const result = applyChallenge('challenge_3');
    expect(result.success).toBe(false);
    expect(result.error).toBe('已报名');
  });

  it('可以更新已提交的作品', () => {
    session.userId = 'user_4';
    applyChallenge('challenge_4');
    submitWork('challenge_4', '原始标题', '原始描述');
    const updateResult = submitWork('challenge_4', '更新标题', '更新描述');
    expect(updateResult.success).toBe(true);
    expect(submissions).toHaveLength(1);
    expect(submissions[0].title).toBe('更新标题');
  });

  it('标题和描述不能为空', () => {
    session.userId = 'user_5';
    applyChallenge('challenge_5');
    const result = submitWork('challenge_5', '', '描述');
    expect(result.success).toBe(false);
    expect(result.error).toBe('标题和描述不能为空');
  });
});
