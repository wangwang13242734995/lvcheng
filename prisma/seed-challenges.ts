import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始插入挑战数据...');

  await prisma.challengeApplication.deleteMany();
  await prisma.challenge.deleteMany();

  const challenges = [
    {
      company: '字节跳动',
      title: '将短视频推荐的完播率提升 15%',
      description: '我们的短视频推荐算法在完播率指标上遇到了瓶颈。我们需要一个能从用户行为数据中找到新特征、提出改进方案并验证效果的方案。你需要理解推荐系统的基本原理，能从数据中找到规律，并用清晰的逻辑呈现你的方案。',
      category: 'TECH',
      requiredCraft: 60,
      requiredLearn: 50,
      requiredDrive: 40,
      requiredTeam: 30,
      requiredGrit: 50,
      requiredExpress: 40,
      reward: '企业认证证书 + 面试直通卡',
      rewardAmount: 5000,
      rewardType: 'ALL',
      deadline: new Date('2026-08-31'),
      spots: 20,
    },
    {
      company: '小红书',
      title: '设计一个让 DAU 从 100 万到 1000 万的增长策略',
      description: '我们正在寻找对增长有深刻理解的人。不是要你写一份PPT，而是要你分析：哪些用户行为是增长的关键杠杆？如何设计裂变机制？如何平衡增长与社区氛围？用数据和逻辑说服我们。',
      category: 'GROWTH',
      requiredCraft: 30,
      requiredLearn: 60,
      requiredDrive: 50,
      requiredTeam: 40,
      requiredGrit: 40,
      requiredExpress: 70,
      reward: '企业实习直通 + 增长团队内推资格',
      rewardAmount: 0,
      rewardType: 'CERTIFICATE',
      deadline: new Date('2026-09-15'),
      spots: 10,
    },
    {
      company: '独立开发者社区',
      title: '48小时做一个能用的产品',
      description: '这是一个限时挑战赛。从周五晚8点开始，到周日晚上8点结束。你需要在这48小时内完成一个可用的产品原型——可以是工具、小程序、网站，任何形式。重点不是完美，是完成。我们会评估产品的完成度、创意性和实用性。',
      category: 'PRODUCT',
      requiredCraft: 40,
      requiredLearn: 40,
      requiredDrive: 70,
      requiredTeam: 20,
      requiredGrit: 60,
      requiredExpress: 50,
      reward: '社区年度会员 + 产品曝光机会',
      rewardAmount: 2000,
      rewardType: 'ALL',
      deadline: new Date('2026-07-20'),
      spots: 50,
    },
    {
      company: '腾讯',
      title: '为视障用户设计一个无障碍购物体验',
      description: '中国有超过1700万视障用户。我们希望有人能从零设计一个让视障用户也能顺畅使用的电商购物流程——从浏览商品到下单支付。你需要理解无障碍设计的原则，能站在用户角度思考，并给出可落地的方案。',
      category: 'PRODUCT',
      requiredCraft: 50,
      requiredLearn: 50,
      requiredDrive: 40,
      requiredTeam: 50,
      requiredGrit: 40,
      requiredExpress: 60,
      reward: '企业认证 + 设计作品集展示机会',
      rewardAmount: 3000,
      rewardType: 'ALL',
      deadline: new Date('2026-08-15'),
      spots: 15,
    },
    {
      company: '阿里巴巴',
      title: '优化双十一大促的服务器抗压方案',
      description: '双十一零点是我们系统压力最大的时刻。我们需要有人能分析高并发场景下的瓶颈，提出优化方案（缓存策略、限流机制、降级方案等）。你需要展示你对分布式系统的理解，以及面对复杂问题时的分析能力。',
      category: 'TECH',
      requiredCraft: 70,
      requiredLearn: 40,
      requiredDrive: 50,
      requiredTeam: 30,
      requiredGrit: 70,
      requiredExpress: 30,
      reward: '企业认证 + 技术团队直推',
      rewardAmount: 8000,
      rewardType: 'ALL',
      deadline: new Date('2026-09-01'),
      spots: 8,
    },
  ];

  for (const c of challenges) {
    await prisma.challenge.create({ data: c });
  }

  console.log(`✅ 已插入 ${challenges.length} 个挑战`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());