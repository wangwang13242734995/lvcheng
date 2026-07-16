import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { DEFAULT_ABILITY_SCORES } from '@/lib/ability-constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [featuredUsers, featuredProjects, challenges] = await Promise.all([
      prisma.user.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
          abilityScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
          projects: {
            where: { status: 'PUBLISHED' },
            take: 1,
          },
        },
      }),

      prisma.project.findMany({
        where: { status: 'PUBLISHED' },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),

      prisma.challenge.findMany({
        where: { status: 'OPEN' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          applications: {
            select: { id: true },
          },
        },
      }),
    ]);

    const companies = Array.from(new Set(challenges.map((c) => c.company)));

    const users = featuredUsers
      .map((user) => {
        const latestScore = user.abilityScores[0];
        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          major: user.major,
          skills: user.skills ? JSON.parse(user.skills) : [],
          projectCount: user.projects.length,
          scores: latestScore
            ? {
                craft: latestScore.craft,
                learn: latestScore.learn,
                drive: latestScore.drive,
                team: latestScore.team,
                grit: latestScore.grit,
                express: latestScore.express,
                totalScore: latestScore.totalScore,
              }
            : DEFAULT_ABILITY_SCORES,
        };
      })
      .sort((a, b) => b.scores.totalScore - a.scores.totalScore);

    const projects = featuredProjects.map((project) => ({
      id: project.id,
      title: project.title,
      type: project.type,
      description: project.description,
      techStack: project.techStack ? JSON.parse(project.techStack) : [],
      outcome: project.outcome,
      outcomeType: project.outcomeType,
      difficulty: project.difficulty,
      userId: project.userId,
      user: project.user,
      createdAt: project.createdAt,
    }));

    const challengeList = challenges.map((c) => ({
      id: c.id,
      company: c.company,
      title: c.title,
      category: c.category,
      reward: c.reward,
      rewardAmount: c.rewardAmount,
      rewardType: c.rewardType,
      deadline: c.deadline,
      spots: c.spots,
      status: c.status,
      applicantCount: c.applications.length,
    }));

    const companyList = companies.map((company) => {
      const companyChallenges = challenges.filter((c) => c.company === company);
      return {
        name: company,
        challengeCount: companyChallenges.length,
        totalReward: companyChallenges.reduce((sum, c) => sum + (c.rewardAmount || 0), 0),
      };
    });

    return NextResponse.json({
      users,
      projects,
      challenges: challengeList,
      companies: companyList,
    });
  } catch (error) {
    logger.error('Failed to fetch featured data', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { users: [], projects: [], challenges: [], companies: [] },
      { status: 500 }
    );
  }
}
