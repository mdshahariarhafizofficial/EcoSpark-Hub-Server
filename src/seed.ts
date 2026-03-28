import { PrismaClient, IdeaStatus, Role, VoteType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning database...');
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.category.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding database...');

  // 1. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@ecospark.com',
      password: adminPassword,
      role: Role.ADMIN,
      bio: 'Platform administrator keeping the ecosystem healthy.',
    },
  });

  const users = [];
  for (let i = 1; i <= 9; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Eco Pioneer ${i}`,
        email: `user${i}@ecospark.com`,
        password: userPassword,
        role: Role.MEMBER,
        bio: `Sustainable living enthusiast and innovator #${i}.`,
      },
    });
    users.push(user);
  }
  console.log('✅ Users created');

  // 2. Create Categories
  const categoryNames = [
    'Energy', 'Waste Management', 'Transportation', 'Recycling', 
    'Water Conservation', 'Climate Action', 'Agriculture', 'Pollution Control'
  ];
  
  const categories = await Promise.all(
    categoryNames.map(name => prisma.category.create({ data: { name } }))
  );
  console.log('✅ Categories created');

  // 3. Create Ideas
  const images = [
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2000&auto=format&fit=crop',
  ];

  const ideasData = [
    {
      title: 'Decentralized Solar Minigrids for Rural Areas',
      problemStatement: 'Many remote villages lack reliable electricity, forcing reliance on diesel generators.',
      solution: 'Community-owned solar minigrids that distribute renewable power safely and affordably.',
      description: 'The project will establish a 50kW solar array with battery storage in target communities. Local technicians will be trained to maintain the grid. Initial capital covers the hardware, and a small monthly tariff will cover maintenance and eventually scale the array.',
      categoryId: categories[0].id, // Energy
      authorId: users[0].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 25.00,
      images: [images[0]],
    },
    {
      title: 'Ocean Plastic Upcycling Facilities',
      problemStatement: 'Coastal towns are accumulating massive amounts of unrecyclable macro-plastics.',
      solution: 'Micro-facilities that melt and mold ocean plastic into durable construction bricks.',
      description: 'By placing these small upcycling machines near beaches, local communities can turn waste into valuable building materials. The blueprints outline the machinery requirements, safety protocols for fumes, and architectural plans for the bricks.',
      categoryId: categories[3].id, // Recycling
      authorId: users[1].id,
      status: IdeaStatus.APPROVED,
      isPaid: false,
      images: [images[1]],
    },
    {
      title: 'Urban Rooftop Hydroponics Network',
      problemStatement: 'Cities rely entirely on external supply chains for fresh produce, raising carbon footprints.',
      solution: 'A standardized, modular hydroponic system designed for flat urban roofs.',
      description: 'This initiative provides the schematics and plant-cycle data for creating high-yield rooftop farms. We focus on leafy greens and herbs which can be sold to local restaurants, drastically cutting "food miles".',
      categoryId: categories[6].id, // Agriculture
      authorId: users[2].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 15.00,
      images: [images[2]],
    },
    {
      title: 'AI-Optimized Traffic Flow Routing',
      problemStatement: 'Traffic congestion in city centers accounts for 30% of local vehicular emissions.',
      solution: 'An open-source algorithm that integrates with traffic lights to prioritize flow based on density.',
      description: 'This is a software-first approach. By crowdsourcing GPS data, we can dynamically adjust traffic light timings across a grid, significantly reducing idle time and thereby lowering localized CO2 pockets.',
      categoryId: categories[2].id, // Transportation
      authorId: users[3].id,
      status: IdeaStatus.UNDER_REVIEW,
      isPaid: false,
      images: [images[3]],
    },
    {
      title: 'Mycelium Alternatives to Styrofoam Packaging',
      problemStatement: 'E-commerce packaging is overflowing landfills with non-biodegradable EPS foam.',
      solution: 'Growing custom packaging from agricultural waste and mushroom roots (mycelium).',
      description: 'We have developed a strain of fast-growing mycelium that can be molded to fit any product shape. It decomposes in a standard backyard compost pile in 30 days. Seeking funding to scale production.',
      categoryId: categories[1].id, // Waste Mgt
      authorId: users[4].id,
      status: IdeaStatus.REJECTED,
      feedback: 'Great concept, but please provide a more detailed breakdown of the cultivation process and costs.',
      isPaid: false,
      images: [images[4]],
    },
    {
      title: 'Rainwater Harvesting for Multi-Family Buildings',
      problemStatement: 'Significant storm runoff overwhelms city sewers while drinking water is used for irrigation.',
      solution: 'A retrofittable dual-pipe system for capturing and utilizing rainwater for non-potable needs.',
      description: 'This blueprint details how to install 5,000-gallon cisterns in apartment basements, filtering the water specifically for toilet flushing and common-area landscaping, saving thousands of gallons daily.',
      categoryId: categories[4].id, // Water
      authorId: users[5].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 50.00,
      images: [images[0]],
    },
    {
      title: 'Community-Owned Wind Turbines',
      problemStatement: 'Large wind farms are corporate-owned, and locals rarely see direct financial benefits.',
      solution: 'A cooperative model where neighborhoods pool resources to buy a medium-scale turbine.',
      description: 'This framework provides the legal structure, zoning navigation tips, and technical specs for communities to cooperatively fund a 1MW turbine, directly offsetting their local grid costs.',
      categoryId: categories[0].id, // Energy
      authorId: users[6].id,
      status: IdeaStatus.UNDER_REVIEW,
      isPaid: false,
      images: [images[1]],
    },
    {
      title: 'Biodegradable Fishing Nets',
      problemStatement: '"Ghost nets" make up a huge percentage of ocean plastic and continue killing marine life.',
      solution: 'Nets woven from strong, but naturally degrading biopolymers that break down after 2 years.',
      description: 'Testing a new polylactic acid (PLA) blend that maintains tensile strength in saltwater but breaks down rapidly when exposed to a specific environmentally safe enzyme solution if lost at sea.',
      categoryId: categories[7].id, // Pollution Control
      authorId: users[7].id,
      status: IdeaStatus.REJECTED,
      feedback: 'The PLA blend seems theoretical. Please upload the lab test results.',
      isPaid: false,
      images: [images[2]],
    },
    {
      title: 'Carbon-Sequestering Concrete Additive',
      problemStatement: 'Cement production is responsible for 8% of global CO2 emissions.',
      solution: 'Injecting captured industrial CO2 into concrete mixes, permanently storing it while strengthening the batch.',
      description: 'This document shares the precise chemical mix ratio and pressure requirements to adapt standard concrete mixing trucks to inject liquified CO2, improving compressive strength by 10%.',
      categoryId: categories[5].id, // Climate Action
      authorId: users[8].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 100.00,
      images: [images[3]],
    },
    {
      title: 'Solar-Powered Drone Reforestation',
      problemStatement: 'Planting trees manually is too slow to effectively repopulate wildfire-devastated areas.',
      solution: 'Autonomous drones that shoot seed pods containing nutrients directly into the soil.',
      description: 'Still mapping out the software flight paths. The drones will use LiDAR to identify optimal soil drops and coordinate in swarms to plant up to 10,000 seeds per day entirely on solar battery power.',
      categoryId: categories[5].id, // Climate Action
      authorId: users[0].id,
      status: IdeaStatus.DRAFT,
      isPaid: false,
      images: [images[4]],
    },
    {
      title: 'Portable Solar Water Distiller',
      problemStatement: 'Lack of clean drinking water in disaster-stricken or coastal communities with high salinity.',
      solution: 'A foldable, low-cost solar still that purifies up to 5 liters of water daily.',
      description: 'Uses a multi-stage evaporation and condensation process powered entirely by solar thermal energy. Lightweight enough for emergency response kits.',
      categoryId: categories[4].id, // Water Conservation
      authorId: users[1].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 12.50,
      images: [images[0]],
    },
    {
      title: 'Bicycle-Powered Community Composters',
      problemStatement: 'Industrial composting machinery is expensive and requires significant energy input.',
      solution: 'A human-powered, pedal-driven aerobic composter for neighborhood use.',
      description: 'By connecting a stationary bike to a rotating compost drum, we provide exercise while speeding up decomposition. Neighbors earn "compost credits" for pedaling.',
      categoryId: categories[1].id, // Waste Management
      authorId: users[2].id,
      status: IdeaStatus.APPROVED,
      isPaid: false,
      images: [images[1]],
    },
    {
      title: 'Mycelium-Based Sound Insulation',
      problemStatement: 'Traditional insulation materials like fiberglass are toxic and non-biodegradable.',
      solution: 'Acoustic panels grown from mushroom roots and wood shavings.',
      description: 'These panels offer superior sound absorption to traditional foam and are fire-retardant by nature. Fully compostable at the end of their lifecycle.',
      categoryId: categories[3].id, // Recycling
      authorId: users[3].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 35.00,
      images: [images[2]],
    },
    {
      title: 'Vertical Axis Urban Wind Turbines',
      problemStatement: 'Traditional wind turbines are hazardous to birds and suffer from turbulent urban airflows.',
      solution: 'Silent, compact vertical turbines designed specifically for roof edges.',
      description: 'These turbines start spinning at very low wind speeds and are bird-safe. Designed to integrate aesthetic architectural features of modern buildings.',
      categoryId: categories[0].id, // Energy
      authorId: users[4].id,
      status: IdeaStatus.UNDER_REVIEW,
      isPaid: false,
      images: [images[3]],
    },
    {
      title: 'IoT Soil Health Sensors for Smallholder Farmers',
      problemStatement: 'Farmers often over-fertilize due to lack of real-time data on soil nutrient levels.',
      solution: 'A low-cost, solar-powered sensor network that maps soil health in real-time.',
      description: 'The sensors measure NPK levels and moisture, sending data via LoRaWAN to a simple smartphone app, allowing for precision fertilization.',
      categoryId: categories[6].id, // Agriculture
      authorId: users[5].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 45.00,
      images: [images[4]],
    },
    {
      title: 'Geothermal Cooling for Greenhouse Farming',
      problemStatement: 'Greenhouses in arid climates consume massive amounts of electricity for air conditioning.',
      solution: 'An "Earth Tube" heat exchange system that uses stable ground temperatures for cooling.',
      description: 'By burying air intake pipes 10 feet underground, we can naturally drop air temperatures by 15-20°C before they ever enter the greenhouse.',
      categoryId: categories[5].id, // Climate Action
      authorId: users[6].id,
      status: IdeaStatus.APPROVED,
      isPaid: false,
      images: [images[0]],
    },
    {
      title: 'Eco-Friendly Bio-Laundry Detergent pods',
      problemStatement: 'Standard laundry pods contain microplastics and harsh chemicals that enter the water cycle.',
      solution: 'A seaweed-based pod containing soapnut-derived enzymes for effective cleaning.',
      description: 'The pods dissolve perfectly in cold water and leave zero chemical residue. The packaging is made from recycled seaweed fibers.',
      categoryId: categories[7].id, // Pollution Control
      authorId: users[7].id,
      status: IdeaStatus.DRAFT,
      isPaid: false,
      images: [images[1]],
    },
    {
      title: 'Compressed Air Energy Storage for Home Use',
      problemStatement: 'Chemical batteries (Lithium-ion) have a high environmental cost and limited cycles.',
      solution: 'Using excess solar power to store air under high pressure for later electricity generation.',
      description: 'A modular, high-pressure air tank system that converts potential energy back into electricity using a small turbine during peak hours.',
      categoryId: categories[0].id, // Energy
      authorId: users[8].id,
      status: IdeaStatus.APPROVED,
      isPaid: true,
      price: 150.00,
      images: [images[2]],
    },
    {
      title: 'Smart E-Waste Sorting Bins',
      problemStatement: 'People often throw hazardous electronics into regular trash due to inconvenient recycling points.',
      solution: 'Automated bins that use computer vision to sort and reward users for e-waste disposal.',
      description: 'These bins can be placed in malls. They identify the item, provide a recycling voucher, and ensure hazardous components like batteries are safely isolated.',
      categoryId: categories[3].id, // Recycling
      authorId: users[0].id,
      status: IdeaStatus.APPROVED,
      isPaid: false,
      images: [images[3]],
    }

  ];

  const createdIdeas = [];
  for (const data of ideasData) {
    const idea = await prisma.idea.create({ data });
    createdIdeas.push(idea);
  }
  console.log('✅ Ideas created');

  // 4. Create Votes
  const approvedIdeas = createdIdeas.filter(i => i.status === 'APPROVED');
  for (const idea of approvedIdeas) {
    let currentVoteCount = 0;
    for (let i = 0; i < 6; i++) {
        // user i votes UP
        await prisma.vote.create({
            data: { ideaId: idea.id, userId: users[i].id, type: VoteType.UP }
        });
        currentVoteCount++;
    }
    // user 6,7 votes DOWN
    for(let i=6; i<8; i++){
        await prisma.vote.create({
            data: { ideaId: idea.id, userId: users[i].id, type: VoteType.DOWN }
        });
        currentVoteCount--;
    }
    await prisma.idea.update({ where: { id: idea.id }, data: { voteCount: currentVoteCount } });
  }
  console.log('✅ Votes created');

  // 5. Create Comments
  const firstIdea = approvedIdeas[0];
  const parentComment = await prisma.comment.create({
    data: {
      content: 'This is an incredibly well-thought-out initiative. What is the expected maintenance lifecycle?',
      ideaId: firstIdea.id,
      authorId: users[5].id,
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Great question! Im aiming for a 5-year hardware check cycle with daily automated diagnostics.',
      ideaId: firstIdea.id,
      authorId: firstIdea.authorId,
      parentId: parentComment.id,
    }
  });

  const secondIdea = approvedIdeas[1];
  await prisma.comment.create({
    data: {
      content: 'I love this approach to ocean plastics. We should implement this in our local harbor!',
      ideaId: secondIdea.id,
      authorId: users[8].id,
    }
  });
  console.log('✅ Comments created');

  // 6. Purchases
  const paidIdeas = approvedIdeas.filter(i => i.isPaid);
  for (const idea of paidIdeas) {
      await prisma.purchase.create({
          data: {
              ideaId: idea.id,
              userId: users[3].id,
              amount: idea.price || 10,
              stripeSessionId: `simulated_session_${idea.id}_${users[3].id}`,
          }
      });
      await prisma.purchase.create({
          data: {
              ideaId: idea.id,
              userId: users[4].id,
              amount: idea.price || 10,
              stripeSessionId: `simulated_session_${idea.id}_${users[4].id}`,
          }
      });
  }
  console.log('✅ Purchases created');

  // 7. Newsletter
  for (let i = 0; i < 8; i++) {
    await prisma.newsletterSubscription.create({
      data: { email: `newsletter${i}@ecospark.com`, userId: i % 2 === 0 ? users[i].id : undefined }
    });
  }
  console.log('✅ Newsletters sub created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
