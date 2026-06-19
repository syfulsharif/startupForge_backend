import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/startupforge');
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    
    // Seed Database if empty
    await seedDatabase();
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Dynamic import to prevent circular dependencies
    const User = (await import('../models/User.js')).default;
    const Startup = (await import('../models/Startup.js')).default;
    const Opportunity = (await import('../models/Opportunity.js')).default;

    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log('[Seed] Database is empty. Commencing automatic seed sequence...');

      // Seed Users
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123A', salt);

      const sarah = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah@ecosphere.com',
        password: hashedPassword,
        role: 'founder',
        isPremium: true,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        bio: 'Tech founder building AI sorting robotics for local community recycling projects.',
        experience: '5+ years in green operations management.'
      });

      const marcus = await User.create({
        name: 'Marcus Chen',
        email: 'marcus@dev.io',
        password: hashedPassword,
        role: 'collaborator',
        isPremium: false,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bio: 'Frontend and React builder passionate about green-tech solutions.',
        skills: ['React', 'JavaScript', 'Tailwind CSS', 'Figma'],
        experience: 'Coding bootcamp graduate and freelance designer.'
      });

      const admin = await User.create({
        name: 'Platform Moderator',
        email: 'admin@startupforge.com',
        password: hashedPassword,
        role: 'admin',
        isPremium: false,
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: 'StartupForge main platform moderator admin account.',
        experience: 'Systems architect and community supervisor.'
      });

      console.log('[Seed] Users seeded successfully.');

      // Seed Startup
      const ecosphere = await Startup.create({
        startup_name: 'EcoSphere AI',
        logo: '🌱',
        industry: 'Cleantech',
        description: 'Creating automated sorting systems powered by computer vision to increase local recycling efficiency.',
        funding_stage: 'Seed',
        founder_email: sarah.email,
        founderName: sarah.name,
        founderId: sarah._id,
        location: 'Remote',
        website: 'https://ecosphere.io',
        pitch: 'Scaling community recycling automation across 12 smart cities.',
        status: 'approved'
      });

      console.log('[Seed] Startup seeded successfully.');

      // Seed Opportunity
      await Opportunity.create({
        startup_id: ecosphere._id,
        startupName: ecosphere.startup_name,
        role_title: 'Lead Frontend Developer',
        required_skills: ['React', 'JavaScript', 'Tailwind CSS', 'Figma'],
        work_type: 'Remote',
        commitment_level: 'Full-time',
        deadline: '2026-12-31',
        description: 'EcoSphere is seeking a Lead React developer to build our smart sensor visual dashboards and customer admin panels. You will own the full layout styling.',
        salaryRange: '$65k - $80k + 1.5% Equity'
      });

      console.log('[Seed] Opportunity seeded successfully.');
      console.log('[Seed] Database seeding completed successfully!');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to run database seed:', error.message);
  }
};

export default connectDB;
