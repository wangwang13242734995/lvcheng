export type UserRole = 'STUDENT' | 'ENTERPRISE' | 'ADMIN';

export type ProjectType = 'COURSE' | 'COMPETITION' | 'INTERNSHIP' | 'PERSONAL' | 'CHALLENGE';

export type OutcomeType = 'QUANTIFIED' | 'AWARD' | 'LAUNCHED' | 'OPEN_SOURCE';

export type ProjectStatus = 'DRAFT' | 'PUBLISHED';

export type GrowthRecordType = 'MILESTONE' | 'PROBLEM_SOLVED' | 'NEW_SKILL' | 'COMPETITION' | 'FEEDBACK';

export interface AbilityScores {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore: number;
}

export interface ProjectFormData {
  title: string;
  type: ProjectType;
  role: string;
  teamSize: number;
  startDate: string;
  endDate: string;
  techStack: string[];
  description: string;
  difficulty: string;
  outcome: string;
  outcomeType: OutcomeType | '';
  outcomeData: string;
  difficultyEncountered: string;
  solution: string;
  links: { type: string; url: string }[];
  status: ProjectStatus;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  school: string;
  major: string;
  graduationYear: number;
}
