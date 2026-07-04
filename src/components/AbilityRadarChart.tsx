'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface AbilityRadarChartProps {
  scores: {
    craft: number;
    learn: number;
    drive: number;
    team: number;
    grit: number;
    express: number;
  };
}

export default function AbilityRadarChart({ scores }: AbilityRadarChartProps) {
  const data = [
    { subject: '专业力', value: scores.craft, fullMark: 100 },
    { subject: '学习力', value: scores.learn, fullMark: 100 },
    { subject: '自驱力', value: scores.drive, fullMark: 100 },
    { subject: '协作力', value: scores.team, fullMark: 100 },
    { subject: '抗压力', value: scores.grit, fullMark: 100 },
    { subject: '表达力', value: scores.express, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" className="text-sm" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar
          name="能力值"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
