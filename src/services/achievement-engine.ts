// 成就系统 - 检测能力分数突破里程碑

export interface Achievement {
  id: string;
  type: 'SCORE_MILESTONE' | 'PROJECT_MILESTONE' | 'STREAK' | 'FIRST';
  title: string;
  description: string;
  icon: string;
  threshold: number;
  achieved: boolean;
}

const SCORE_THRESHOLDS = [50, 70, 90];

const ABILITY_LABELS: Record<string, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

export function checkScoreAchievements(scores: Record<string, number>): Achievement[] {
  const achievements: Achievement[] = [];

  for (const [key, label] of Object.entries(ABILITY_LABELS)) {
    const score = scores[key] || 0;
    for (const threshold of SCORE_THRESHOLDS) {
      const achieved = score >= threshold;
      achievements.push({
        id: `${key}_${threshold}`,
        type: 'SCORE_MILESTONE',
        title: `${label}突破${threshold}分`,
        description: score >= threshold
          ? `你的${label}已达到${score}分，超越了大部分用户！`
          : `${label}还差${threshold - score}分突破${threshold}分`,
        icon: threshold === 50 ? '🌱' : threshold === 70 ? '⭐' : '🏆',
        threshold,
        achieved,
      });
    }
  }

  return achievements;
}

export function checkProjectMilestones(projectCount: number): Achievement[] {
  const milestones = [1, 5, 10, 20, 50];
  return milestones.map((count) => ({
    id: `project_${count}`,
    type: 'PROJECT_MILESTONE' as const,
    title: count === 1 ? '第一个项目' : `第${count}个项目`,
    description: count === 1
      ? '你迈出了第一步！'
      : `你已经记录了${count}个项目，持续积累中`,
    icon: count === 1 ? '🚀' : count <= 5 ? '📝' : count <= 10 ? '📚' : count <= 20 ? '💎' : '👑',
    threshold: count,
    achieved: projectCount >= count,
  }));
}

// 检测新触发的成就（刚刚达到的）
export function getNewlyTriggeredAchievements(
  oldScores: Record<string, number>,
  newScores: Record<string, number>,
  oldProjectCount: number,
  newProjectCount: number
): Achievement[] {
  const triggered: Achievement[] = [];

  // 检查分数突破
  const oldAchievements = checkScoreAchievements(oldScores);
  const newAchievements = checkScoreAchievements(newScores);

  for (let i = 0; i < newAchievements.length; i++) {
    if (newAchievements[i].achieved && !oldAchievements[i].achieved) {
      triggered.push(newAchievements[i]);
    }
  }

  // 检查项目里程碑
  const oldMilestones = checkProjectMilestones(oldProjectCount);
  const newMilestones = checkProjectMilestones(newProjectCount);

  for (let i = 0; i < newMilestones.length; i++) {
    if (newMilestones[i].achieved && !oldMilestones[i].achieved) {
      triggered.push(newMilestones[i]);
    }
  }

  return triggered;
}

// 获取用户成就统计
export function getAchievementStats(scores: Record<string, number>, projectCount: number) {
  const scoreAchievements = checkScoreAchievements(scores).filter(a => a.achieved);
  const projectMilestones = checkProjectMilestones(projectCount).filter(a => a.achieved);
  const total = SCORE_THRESHOLDS.length * 6 + 5; // 6 abilities * 3 thresholds + 5 project milestones

  return {
    unlocked: scoreAchievements.length + projectMilestones.length,
    total,
    percentage: Math.round(((scoreAchievements.length + projectMilestones.length) / total) * 100),
    scoreAchievements,
    projectMilestones,
  };
}
