import { prisma } from '@/lib/prisma';
import { calculateAbilityScores } from './ability-engine';
import { logger } from '@/lib/logger';
import {
  createBadgeEarnedNotification,
  createCertificateIssuedNotification,
} from './notification-service';

interface ApprovalContext {
  submissionId: string;
  challengeId: string;
  userId: string;
  reviewerId: string;
}

export async function handleSubmissionApproval(context: ApprovalContext) {
  const { submissionId, challengeId, userId, reviewerId } = context;

  try {
    const [challenge, submission, existingCert] = await Promise.all([
      prisma.challenge.findUnique({
        where: { id: challengeId },
        select: {
          id: true,
          title: true,
          company: true,
          category: true,
          requiredCraft: true,
          requiredLearn: true,
          requiredDrive: true,
          requiredTeam: true,
          requiredGrit: true,
          requiredExpress: true,
        },
      }),
      prisma.challengeSubmission.findUnique({
        where: { id: submissionId },
        select: {
          title: true,
          description: true,
          status: true,
        },
      }),
      prisma.certificate.findFirst({
        where: { userId, challengeId },
      }),
    ]);

    if (!challenge || !submission || submission.status === 'ACCEPTED') {
      return { success: true, skipped: true, reason: 'Challenge not found or already accepted' };
    }

    const existingBadge = await prisma.badge.findFirst({
      where: { userId, challengeId },
    });

    const transactions: any[] = [];

    if (!existingBadge) {
      const badgeLevel = getBadgeLevel(challenge);
      const badgeIcon = getBadgeIcon(badgeLevel);

      transactions.push(
        prisma.badge.create({
          data: {
            userId,
            name: `${challenge.category}挑战达人`,
            description: `完成${challenge.company}发布的「${challenge.title}」挑战`,
            level: badgeLevel,
            icon: badgeIcon,
            challengeId,
            company: challenge.company,
          },
        })
      );
    }

    if (!existingCert) {
      const latestAbility = await prisma.abilityScore.findFirst({
        where: { userId },
        orderBy: { calculatedAt: 'desc' },
      });

      transactions.push(
        prisma.certificate.create({
          data: {
            userId,
            title: `${challenge.title} - 完成证书`,
            description: `恭喜完成由${challenge.company}发布的挑战「${challenge.title}」，展示了出色的能力表现。`,
            issuer: challenge.company,
            craftScore: latestAbility?.craft || 0,
            learnScore: latestAbility?.learn || 0,
            driveScore: latestAbility?.drive || 0,
            teamScore: latestAbility?.team || 0,
            gritScore: latestAbility?.grit || 0,
            expressScore: latestAbility?.express || 0,
            challengeId,
          },
        })
      );
    }

    if (transactions.length > 0) {
      await prisma.$transaction(transactions);
    }

    // 发送徽章和证书通知
    if (!existingBadge) {
      const badgeLevel = getBadgeLevel(challenge);
      await createBadgeEarnedNotification(userId, `${challenge.category}挑战达人`, challengeId, badgeLevel);
    }

    if (!existingCert) {
      await createCertificateIssuedNotification(userId, `${challenge.title} - 完成证书`, challengeId);
    }

    const newScores = await calculateAbilityScores(userId);

    const abilityGrowth = JSON.stringify({
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      changes: {
        craft: newScores.craft,
        learn: newScores.learn,
        drive: newScores.drive,
        team: newScores.team,
        grit: newScores.grit,
        express: newScores.express,
      },
      approvedBy: reviewerId,
      approvedAt: new Date().toISOString(),
    });

    await prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: { abilityGrowth },
    });

    logger.info('Submission approval rewards processed', {
      submissionId,
      challengeId,
      userId,
      rewards: {
        badge: !existingBadge,
        certificate: !existingCert,
        abilityUpdated: true,
      },
    });

    return {
      success: true,
      skipped: false,
      rewards: {
        badge: !existingBadge,
        certificate: !existingCert,
        abilityScores: newScores,
      },
    };
  } catch (error) {
    logger.error('Failed to process approval rewards', {
      submissionId,
      challengeId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: error instanceof Error ? error.message : '奖励发放失败' };
  }
}

function getBadgeLevel(challenge: any): string {
  const requirements = [
    challenge.requiredCraft,
    challenge.requiredLearn,
    challenge.requiredDrive,
    challenge.requiredTeam,
    challenge.requiredGrit,
    challenge.requiredExpress,
  ].filter((r: number) => r > 0);

  if (requirements.length === 0) return 'BRONZE';

  const avgRequirement = requirements.reduce((a: number, b: number) => a + b, 0) / requirements.length;

  if (avgRequirement >= 80) return 'DIAMOND';
  if (avgRequirement >= 60) return 'GOLD';
  if (avgRequirement >= 40) return 'SILVER';
  return 'BRONZE';
}

function getBadgeIcon(level: string): string {
  const icons: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    DIAMOND: '💎',
  };
  return icons[level] || '🏅';
}
