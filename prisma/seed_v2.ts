import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecospark.com' },
    update: {},
    create: {
      email: 'admin@ecospark.com',
      password,
      name: 'EcoSpark Administrator',
      role: 'ADMIN',
      bio: 'System architect and sustainability auditor.',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'shahariar@example.com' },
    update: {},
    create: {
      email: 'shahariar@example.com',
      password,
      name: 'Shahariar Hafiz',
      role: 'MEMBER',
      bio: 'Sustainability enthusiast and urban gardener.',
    },
  });

  // Categories
  const renewable = await prisma.category.upsert({
    where: { name: 'Renewable Energy' },
    update: {},
    create: { name: 'Renewable Energy', description: 'Solar, wind, and tidal energy solutions.', color: '#10b981' },
  });

  const agriculture = await prisma.category.upsert({
    where: { name: 'Sustainable Agriculture' },
    update: {},
    create: { name: 'Sustainable Agriculture', description: 'Regenerative farming and urban gardens.', color: '#059669' },
  });

  // Ideas
  const ideas = [
    {
      title: 'Vertical Urban Farming',
      problemStatement: 'Limited urban space for traditional farming leading to high food miles.',
      solution: 'Automated vertical hydroponic systems for city skyscrapers.',
      description: 'A detailed blueprint for modular, low-energy vertical farms that can be integrated into residential buildings. Using recycled greywater and LED lighting arrays.',
      status: 'APPROVED',
      isPaid: true,
      price: 29.99,
      authorId: member.id,
      categoryId: agriculture.id,
    },
    {
      title: 'Solar Powered Irrigation',
      problemStatement: 'Dependence on fossil fuels for pumping groundwater in rural farms.',
      solution: 'Mobile solar arrays with high-efficiency direct-drive pumps.',
      description: 'Comprehensive technical specifications for building affordable, mobile solar pumping stations for smallholder farmers. Includes maintenance schedules and component sourcing.',
      status: 'APPROVED',
      isPaid: false,
      authorId: member.id,
      categoryId: renewable.id,
    }
  ];

  for (const ideaData of ideas) {
    const existing = await prisma.idea.findFirst({ where: { title: ideaData.title } });
    if (!existing) {
       await prisma.idea.create({ data: ideaData as any });
    }
  }

  console.log('✅ Seed Data V2 Created Successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
