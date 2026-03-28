import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Energy' },
      update: {},
      create: { name: 'Energy', description: 'Solar, wind, and renewable energy initiatives', color: '#F59E0B' },
    }),
    prisma.category.upsert({
      where: { name: 'Waste Reduction' },
      update: {},
      create: { name: 'Waste Reduction', description: 'Recycling, composting, and zero-waste projects', color: '#10B981' },
    }),
    prisma.category.upsert({
      where: { name: 'Transportation' },
      update: {},
      create: { name: 'Transportation', description: 'EV, cycling, and green transport solutions', color: '#3B82F6' },
    }),
    prisma.category.upsert({
      where: { name: 'Water Conservation' },
      update: {},
      create: { name: 'Water Conservation', description: 'Water saving and purification projects', color: '#06B6D4' },
    }),
    prisma.category.upsert({
      where: { name: 'Urban Greening' },
      update: {},
      create: { name: 'Urban Greening', description: 'Parks, green roofs, and urban forests', color: '#84CC16' },
    }),
    prisma.category.upsert({
      where: { name: 'Education' },
      update: {},
      create: { name: 'Education', description: 'Sustainability awareness and education campaigns', color: '#8B5CF6' },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@EcoSpark2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecospark.com' },
    update: {},
    create: {
      email: 'admin@ecospark.com',
      password: adminPassword,
      name: 'EcoSpark Admin',
      role: 'ADMIN',
      isActive: true,
      bio: 'Platform administrator dedicated to promoting sustainability.',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Create sample members
  const memberPassword = await bcrypt.hash('Member@123', 12);
  const member1 = await prisma.user.upsert({
    where: { email: 'member@ecospark.com' },
    update: {},
    create: {
      email: 'member@ecospark.com',
      password: memberPassword,
      name: 'Green Enthusiast',
      role: 'MEMBER',
      isActive: true,
      bio: 'Passionate about creating a greener planet.',
    },
  });
  
  const member2 = await prisma.user.upsert({
    where: { email: 'innovator@ecospark.com' },
    update: {},
    create: {
      email: 'innovator@ecospark.com',
      password: memberPassword,
      name: 'Eco Innovator',
      role: 'MEMBER',
      isActive: true,
      bio: 'Designing the cities of tomorrow.',
    },
  });

  console.log(`✅ Member users created`);

  // Create sample ideas
  const sampleIdeas = [
    {
      title: 'Community Solar Garden Initiative',
      problemStatement: 'Many households cannot afford individual solar panel installations or are renters without roof access.',
      solution: 'Create shared solar gardens where community members can buy shares and receive electricity credits.',
      description: 'This initiative proposes establishing community-owned solar gardens in unused municipal land. Residents can purchase shares proportional to their energy needs, dramatically reducing upfront costs. The collective approach makes solar energy accessible to renters and low-income households who cannot install panels on their property.',
      categoryId: categories[0].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 142,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200']
    },
    {
      title: 'Plastic-Free Farmers Market',
      problemStatement: 'Local markets generate massive amounts of single-use plastic waste weekly.',
      solution: 'Transition all vendor packaging to compostable materials and introduce reusable container programs.',
      description: 'Working with local market vendors to eliminate all single-use plastics by providing subsidized compostable alternatives. A deposit-return system for reusable containers will be introduced, and educational signage will help customers understand the environmental impact.',
      categoryId: categories[1].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 85,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1200']
    },
    {
      title: 'E-Bike Sharing Network',
      problemStatement: 'Urban commuters default to cars due to lack of affordable green transport options.',
      solution: 'Deploy a city-wide e-bike sharing network with solar-powered charging stations.',
      description: 'A comprehensive e-bike sharing program with 200+ stations across the city, powered entirely by renewable energy. The app-based system offers affordable day passes and monthly subscriptions, with dedicated bike lanes lobbied for simultaneously.',
      categoryId: categories[2].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 29.99,
      voteCount: 228,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1521406616086-4444760088cb?q=80&w=1200']
    },
    {
      title: 'Rainwater Harvesting for Public Parks',
      problemStatement: 'Public parks consume millions of gallons of treated municipal water annually during dry seasons.',
      solution: 'Retrofit park structures with large-scale rainwater catchment systems tied into existing irrigation.',
      description: 'By installing modular catchment tanks beneath park pavilions and integrating them with smart-sensor drip irrigation, we can reduce municipal water usage by 60%. Paid blueprint includes CAD files for tank placement, piping schemas, and sensor integration code.',
      categoryId: categories[3].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 49.99,
      voteCount: 156,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1563207153-f421f57fedf9?q=80&w=1200']
    },
    {
      title: 'Neighborhood Composting Hubs',
      problemStatement: 'Food waste makes up 30% of landfills, creating methane emissions because individuals cannot compost easily.',
      solution: 'Install odor-neutralizing, smart compost tumblers in every neighborhood block.',
      description: 'These hubs are locked and accessed via a community app. Members drop off organic waste and earn points. The resulting compost is sold to local urban farms, funding the maintenance of the bins.',
      categoryId: categories[1].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 94,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1596708688849-052bebc11d7c?q=80&w=1200']
    },
    {
      title: 'Vertical Farming in Abandoned Warehouses',
      problemStatement: 'Food deserts in urban areas lack fresh produce, and traditional shipping creates massive carbon footprints.',
      solution: 'Convert abandoned downtown warehouses into high-yield vertical aquaponic farms.',
      description: 'Detailed economic and structural model for turning a standard 10,000 sq ft industrial space into a farm producing 50 tons of greens annually. Includes LED lighting schedules, HVAC requirements, and capital expenditure breakdown.',
      categoryId: categories[4].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 99.00,
      voteCount: 312,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1530836369250-ef71a3f5e481?q=80&w=1200']
    },
    {
      title: 'Gamified Recycling Education App',
      problemStatement: 'Children and teens lack engaging educational materials about proper recycling and waste sorting.',
      solution: 'A mobile game where students build virtual green cities by scanning real-world recyclable items.',
      description: 'The app uses image recognition. When a child scans a plastic bottle before recycling it, they earn "Eco-Coins" to upgrade their virtual city. Schools can compete in leaderboards. Proposal seeks funding for server costs and 3D asset generation.',
      categoryId: categories[5].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 204,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1200']
    },
    {
      title: 'Micro-Hydro Power for Residential Streams',
      problemStatement: 'Properties with running water fail to utilize the continuous kinetic energy for off-grid power.',
      solution: 'A low-impact, fish-friendly turbine that generates steady 24/7 power without damming the stream.',
      description: 'Most hydro requires dams. This blueprint details a run-of-river vortex turbine that generates 1kW continuously. Paid blueprint includes STL files for 3D printing the turbine blades, generator specs, and regulatory permit guides.',
      categoryId: categories[0].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 15.00,
      voteCount: 88,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1478144590407-775bc1db1a96?q=80&w=1200']
    },
    {
      title: 'Biodegradable 3D Printing Filament',
      problemStatement: 'The rapid growth of 3D printing is creating a new wave of localized plastic waste.',
      solution: 'Establish local community filament extruders that melt down household algae and starch bioplastics.',
      description: 'Instead of buying PLA shipped across the ocean, local maker spaces can combine bio-resins created from food waste to extrude their own filament. The project outlines the exact chemical composition and heating requirements.',
      categoryId: categories[1].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 67,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200']
    },
    {
      title: 'Smart Streetlights with Air Quality Sensors',
      problemStatement: 'Cities lack granular, neighborhood-level data on air pollution to make traffic routing decisions.',
      solution: 'Retrofit existing LED streetlights with low-cost PM2.5 and NO2 sensors.',
      description: 'The network forms a real-time mesh. If air quality in a specific corridor drops to dangerous levels, traffic lights automatically adjust to divert heavy vehicles away from the area until smog disperses.',
      categoryId: categories[2].id,
      status: 'UNDER_REVIEW' as const,
      isPaid: false,
      voteCount: 15,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200']
    },
    {
      title: 'Urban Bee Corridor',
      problemStatement: 'Pollinator populations are collapsing due to habitat fragmentation in urban environments.',
      solution: 'Connect public parks and private balconies into a continuous mile-long blooming corridor.',
      description: 'Distributing specific native seed packets to 5,000 residents in a targeted geographic line through the city. By coordinating bloom times, we create a super-highway for solitary bees and monarchs to traverse the concrete jungle.',
      categoryId: categories[4].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 189,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200']
    },
    {
      title: 'Eco-Friendly Insulation from Fungi',
      problemStatement: 'Traditional fiberglass insulation is toxic to produce and terrible to dispose of.',
      solution: 'Grow custom-fit insulation panels using mycelium (mushroom roots) and agricultural waste.',
      description: 'A detailed manual on how construction firms can grow their own insulation on-site in molding frames. It is fire-retardant, carbon-negative, and completely compostable at the end of the building\'s life.',
      categoryId: categories[1].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 35.00,
      voteCount: 275,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1611078864771-41221f7ed38c?q=80&w=1200']
    },
    {
      title: 'Greywater Recycling for Apartment Buildings',
      problemStatement: 'Thousands of gallons of perfectly good shower water go straight into the sewer every day.',
      solution: 'A retrofittable filtration system that redirects shower and sink water to flush toilets.',
      description: 'This is a mechanical engineering blueprint detailing the pumps, UV filters, and bypass valves required to safely implement greywater recycling in an existing multi-story residential building without major demolition.',
      categoryId: categories[3].id,
      status: 'DRAFT' as const,
      isPaid: true,
      price: 19.99,
      voteCount: 0,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1200']
    },
    {
      title: 'Repair Cafe Franchise Model',
      problemStatement: 'Consumer electronics are discarded because the cost of repair exceeds the cost of replacement.',
      solution: 'A standardized blueprint for opening a volunteer-run "Repair Cafe" in any town library.',
      description: 'Includes liability waivers, essential tool lists, volunteer recruiting scripts, and marketing materials to start a monthly event where experts fix community electronics for free to keep them out of landfills.',
      categoryId: categories[5].id,
      status: 'APPROVED' as const,
      isPaid: false,
      voteCount: 134,
      authorId: member2.id,
      images: ['https://images.unsplash.com/photo-1581092335397-9583eb92d232?q=80&w=1200']
    },
    {
      title: 'Kelp Forest Reforestation',
      problemStatement: 'Coastal kelp forests are being decimated by overpopulated sea urchins, releasing stored carbon.',
      solution: 'Deploy autonomous underwater drones that identify and cull invasive sea urchins.',
      description: 'A high-tech approach to marine conservation. We have designed a small ROV with computer vision that safely manages urchin populations, allowing the fast-growing giant kelp to naturally recover and sequester carbon.',
      categoryId: categories[3].id,
      status: 'APPROVED' as const,
      isPaid: true,
      price: 150.00,
      voteCount: 450,
      authorId: member1.id,
      images: ['https://images.unsplash.com/photo-1644331578332-9cb42db87dcb?q=80&w=1200']
    }
  ];

  // Delete existing ideas
  await prisma.idea.deleteMany();

  for (const idea of sampleIdeas) {
    const { images, ...ideaData } = idea as any;
    await prisma.idea.create({
      data: {
        ...ideaData,
        images: images || [],
        attachments: [],
      },
    });
  }
  // Create sample newsletter subscriptions
  const newsletterEmails = [
    'eco-warrior@example.com',
    'green-living@test.io',
    'sustainability-now@provider.com',
    'earth-helper@mail.org',
    member1.email,
    member2.email
  ];

  for (const email of newsletterEmails) {
    await prisma.newsletterSubscription.upsert({
      where: { email },
      update: {},
      create: { 
        email,
        userId: email === member1.email ? member1.id : (email === member2.email ? member2.id : undefined)
      }
    });
  }
  console.log(`✅ Created ${newsletterEmails.length} newsletter subscriptions`);

  // Create sample contact messages
  const contactMessages = [
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      subject: 'Partnership Inquiry',
      message: 'I am interested in partnering with EcoSpark Hub for our next green urban development project. Who should I speak with?',
      status: 'NEW'
    },
    {
      name: 'Sarah Lee',
      email: 'sarah.lee@test.com',
      subject: 'Idea Submission Question',
      message: 'Can I submit multiple ideas for the same category? I have several solar-related projects.',
      status: 'READ'
    },
    {
      name: 'Michael Brown',
      email: 'mike.b@contractor.net',
      subject: 'Technical Feedback',
      message: 'The interactive map feature on the initiatives page is fantastic! Great work on the UI.',
      status: 'REPLIED'
    }
  ];

  for (const msg of contactMessages) {
    await prisma.contactMessage.create({
      data: msg
    });
  }
  console.log(`✅ Created ${contactMessages.length} contact messages`);

  console.log(`✅ Created ${sampleIdeas.length} sample ideas`);

  console.log('\n🎉 Seeding complete!');
  console.log('\nAdmin credentials:');
  console.log('  Email: admin@ecospark.com');
  console.log('  Password: Admin@EcoSpark2024');
  console.log('\nMember credentials:');
  console.log('  Email: member@ecospark.com');
  console.log('  Password: Member@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
