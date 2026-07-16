import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type NotificationType =
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'SUBMISSION_REVIEWED'
  | 'CHALLENGE_CLOSED'
  | 'BADGE_EARNED'
  | 'CERTIFICATE_ISSUED'
  | 'NEW_APPLICATION'
  | 'NEW_SUBMISSION'
  | 'SYSTEM';

export type TargetType = 'CHALLENGE' | 'SUBMISSION' | 'BADGE' | 'CERTIFICATE';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  targetId?: string;
  targetType?: TargetType;
}

export async function createNotification(options: CreateNotificationOptions) {
  try {
    const { userId, type, title, content, targetId, targetType } = options;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        targetId: targetId || null,
        targetType: targetType || null,
        isRead: false,
      },
    });

    logger.info('Notification created', { userId, type, targetId });
    return true;
  } catch (error) {
    logger.error('Failed to create notification', {
      error: error instanceof Error ? error.message : String(error),
      ...options,
    });
    return false;
  }
}

export async function createApplicationApprovedNotification(
  userId: string,
  challengeTitle: string,
  challengeId: string
) {
  return createNotification({
    userId,
    type: 'APPLICATION_APPROVED',
    title: '报名审核通过',
    content: `你报名的「${challengeTitle}」挑战已通过审核，请及时提交作品。`,
    targetId: challengeId,
    targetType: 'CHALLENGE',
  });
}

export async function createApplicationRejectedNotification(
  userId: string,
  challengeTitle: string,
  reason?: string
) {
  const content = reason
    ? `你报名的「${challengeTitle}」挑战未通过审核，原因：${reason}`
    : `你报名的「${challengeTitle}」挑战未通过审核。`;

  return createNotification({
    userId,
    type: 'APPLICATION_REJECTED',
    title: '报名审核未通过',
    content,
  });
}

export async function createSubmissionReviewedNotification(
  userId: string,
  challengeTitle: string,
  challengeId: string,
  status: string,
  comment?: string
) {
  const isAccepted = status === 'ACCEPTED' || status === 'APPROVED';
  const title = isAccepted ? '提交已通过评审' : '提交未通过评审';
  const content = comment
    ? `你的「${challengeTitle}」提交已评审，结果：${isAccepted ? '通过' : '未通过'}。评审意见：${comment}`
    : `你的「${challengeTitle}」提交已评审，结果：${isAccepted ? '通过' : '未通过'}。`;

  return createNotification({
    userId,
    type: 'SUBMISSION_REVIEWED',
    title,
    content,
    targetId: challengeId,
    targetType: 'CHALLENGE',
  });
}

export async function createBadgeEarnedNotification(
  userId: string,
  badgeName: string,
  badgeId: string,
  level: string
) {
  const levelText = {
    BRONZE: '铜质',
    SILVER: '银质',
    GOLD: '金质',
    DIAMOND: '钻石',
  }[level] || level;

  return createNotification({
    userId,
    type: 'BADGE_EARNED',
    title: `获得${levelText}徽章`,
    content: `恭喜！你获得了「${badgeName}」徽章。`,
    targetId: badgeId,
    targetType: 'BADGE',
  });
}

export async function createCertificateIssuedNotification(
  userId: string,
  certificateTitle: string,
  certificateId: string
) {
  return createNotification({
    userId,
    type: 'CERTIFICATE_ISSUED',
    title: '获得证书',
    content: `恭喜！你获得了「${certificateTitle}」证书。`,
    targetId: certificateId,
    targetType: 'CERTIFICATE',
  });
}

export async function createChallengeClosedNotification(
  userId: string,
  challengeTitle: string,
  challengeId: string
) {
  return createNotification({
    userId,
    type: 'CHALLENGE_CLOSED',
    title: '挑战已结束',
    content: `「${challengeTitle}」挑战已结束，感谢你的参与！`,
    targetId: challengeId,
    targetType: 'CHALLENGE',
  });
}

export async function createSystemNotification(
  userId: string,
  title: string,
  content: string
) {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    content,
  });
}

export async function createNewApplicationNotification(
  enterpriseUserId: string,
  applicantName: string,
  challengeTitle: string,
  challengeId: string
) {
  return createNotification({
    userId: enterpriseUserId,
    type: 'NEW_APPLICATION',
    title: '收到新报名',
    content: `${applicantName} 报名了你的「${challengeTitle}」挑战。`,
    targetId: challengeId,
    targetType: 'CHALLENGE',
  });
}

export async function createNewSubmissionNotification(
  enterpriseUserId: string,
  submitterName: string,
  challengeTitle: string,
  challengeId: string
) {
  return createNotification({
    userId: enterpriseUserId,
    type: 'NEW_SUBMISSION',
    title: '收到新作品提交',
    content: `${submitterName} 提交了「${challengeTitle}」挑战的作品，请及时评审。`,
    targetId: challengeId,
    targetType: 'CHALLENGE',
  });
}
