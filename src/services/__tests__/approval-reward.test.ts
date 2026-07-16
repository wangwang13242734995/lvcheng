import { describe, it, expect } from 'vitest';

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

describe('Approval Reward Service', () => {
  describe('getBadgeLevel', () => {
    it('should return DIAMOND for high requirements', () => {
      const challenge = {
        requiredCraft: 90,
        requiredLearn: 85,
        requiredDrive: 88,
        requiredTeam: 80,
        requiredGrit: 85,
        requiredExpress: 82,
      };
      expect(getBadgeLevel(challenge)).toBe('DIAMOND');
    });

    it('should return GOLD for medium-high requirements', () => {
      const challenge = {
        requiredCraft: 80,
        requiredLearn: 75,
        requiredDrive: 70,
        requiredTeam: 60,
        requiredGrit: 65,
        requiredExpress: 70,
      };
      expect(getBadgeLevel(challenge)).toBe('GOLD');
    });

    it('should return SILVER for medium requirements', () => {
      const challenge = {
        requiredCraft: 50,
        requiredLearn: 45,
        requiredDrive: 40,
        requiredTeam: 45,
        requiredGrit: 50,
        requiredExpress: 40,
      };
      expect(getBadgeLevel(challenge)).toBe('SILVER');
    });

    it('should return BRONZE for low requirements', () => {
      const challenge = {
        requiredCraft: 20,
        requiredLearn: 15,
        requiredDrive: 25,
        requiredTeam: 10,
        requiredGrit: 15,
        requiredExpress: 20,
      };
      expect(getBadgeLevel(challenge)).toBe('BRONZE');
    });

    it('should return BRONZE for zero requirements', () => {
      const challenge = {
        requiredCraft: 0,
        requiredLearn: 0,
        requiredDrive: 0,
        requiredTeam: 0,
        requiredGrit: 0,
        requiredExpress: 0,
      };
      expect(getBadgeLevel(challenge)).toBe('BRONZE');
    });
  });

  describe('getBadgeIcon', () => {
    it('should return correct icon for each level', () => {
      expect(getBadgeIcon('BRONZE')).toBe('🥉');
      expect(getBadgeIcon('SILVER')).toBe('🥈');
      expect(getBadgeIcon('GOLD')).toBe('🥇');
      expect(getBadgeIcon('DIAMOND')).toBe('💎');
    });

    it('should return default icon for unknown level', () => {
      expect(getBadgeIcon('UNKNOWN')).toBe('🏅');
    });
  });
});
