import { PrismaClient, Role, BloodGroup, OrganizationType, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LifeLine database seeding...');

  const defaultPassword = await bcrypt.hash('LifeLineSecure@2026', 10);

  // 1. Seed System Administrator
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lifeline.org.bd' },
    update: {},
    create: {
      email: 'admin@lifeline.org.bd',
      phoneNumber: '+8801700000001',
      passwordHash: defaultPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log(`✅ Seeded Admin: ${admin.email}`);

  // 2. Seed Initial Hospitals / Blood Banks
  const hospitalsData = [
    {
      name: 'Dhaka Medical College Hospital',
      type: OrganizationType.HOSPITAL,
      registrationNo: 'DGHS-HOSP-001',
      contactEmail: 'emergency@dmch.gov.bd',
      contactPhone: '+8801711000001',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Ramna',
      streetAddress: 'Secretariat Road, Ramna, Dhaka-1000',
      latitude: 23.7258,
      longitude: 90.3976,
      isVerified: true,
    },
    {
      name: 'Chittagong Medical College Hospital',
      type: OrganizationType.HOSPITAL,
      registrationNo: 'DGHS-HOSP-002',
      contactEmail: 'emergency@cmch.gov.bd',
      contactPhone: '+8801711000002',
      division: 'Chattogram',
      district: 'Chattogram',
      upazila: 'Panchlaish',
      streetAddress: '57 K.B. Fazlul Kader Road, Chattogram',
      latitude: 22.3598,
      longitude: 91.8215,
      isVerified: true,
    },
    {
      name: 'Sylhet MAG Osmani Medical College Hospital',
      type: OrganizationType.HOSPITAL,
      registrationNo: 'DGHS-HOSP-003',
      contactEmail: 'emergency@somch.gov.bd',
      contactPhone: '+8801711000003',
      division: 'Sylhet',
      district: 'Sylhet',
      upazila: 'Kotwali',
      streetAddress: 'Medical Road, Kajolshah, Sylhet',
      latitude: 24.8989,
      longitude: 91.8519,
      isVerified: true,
    },
  ];

  for (const hosp of hospitalsData) {
    const org = await prisma.organization.upsert({
      where: { registrationNo: hosp.registrationNo },
      update: {},
      create: hosp,
    });
    console.log(`✅ Seeded Organization: ${org.name}`);
  }

  // 3. Seed Sample Verified Donors
  const donorsData = [
    {
      email: 'donor.op@lifeline.org.bd',
      phone: '+8801712345678',
      firstName: 'Rahim',
      lastName: 'Ahmed',
      bloodGroup: BloodGroup.O_POSITIVE,
      gender: Gender.MALE,
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Mirpur',
      totalDonations: 4,
      lastDonationDaysAgo: 120, // Eligible (>90 days)
    },
    {
      email: 'donor.on@lifeline.org.bd',
      phone: '+8801812345678',
      firstName: 'Fatima',
      lastName: 'Khatun',
      bloodGroup: BloodGroup.O_NEGATIVE,
      gender: Gender.FEMALE,
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      totalDonations: 2,
      lastDonationDaysAgo: 45, // Ineligible (<90 days, temporarily recovering)
    },
    {
      email: 'donor.bp@lifeline.org.bd',
      phone: '+8801912345678',
      firstName: 'Tanvir',
      lastName: 'Hasan',
      bloodGroup: BloodGroup.B_POSITIVE,
      gender: Gender.MALE,
      division: 'Chattogram',
      district: 'Chattogram',
      upazila: 'Panchlaish',
      totalDonations: 7,
      lastDonationDaysAgo: 105, // Eligible (>90 days)
    },
    {
      email: 'donor.abn@lifeline.org.bd',
      phone: '+8801612345678',
      firstName: 'Sadia',
      lastName: 'Jahan',
      bloodGroup: BloodGroup.AB_NEGATIVE,
      gender: Gender.FEMALE,
      division: 'Sylhet',
      district: 'Sylhet',
      upazila: 'Kotwali',
      totalDonations: 1,
      lastDonationDaysAgo: 150, // Eligible (>90 days)
    },
  ];

  for (const donor of donorsData) {
    const user = await prisma.user.upsert({
      where: { email: donor.email },
      update: {},
      create: {
        email: donor.email,
        phoneNumber: donor.phone,
        passwordHash: defaultPassword,
        firstName: donor.firstName,
        lastName: donor.lastName,
        role: Role.DONOR,
        isEmailVerified: true,
        isPhoneVerified: true,
        donorProfile: {
          create: {
            bloodGroup: donor.bloodGroup,
            gender: donor.gender,
            division: donor.division,
            district: donor.district,
            upazila: donor.upazila,
            isAvailable: true,
            totalDonations: donor.totalDonations,
            lastDonationDate: new Date(Date.now() - donor.lastDonationDaysAgo * 24 * 60 * 60 * 1000),
            hidePhoneNumber: true,
            hidePreciseLocation: true,
          },
        },
      },
      include: { donorProfile: true },
    });
    console.log(`✅ Seeded Donor: ${user.firstName} ${user.lastName} (${donor.bloodGroup})`);
  }

  // 4. Seed Volunteer
  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@lifeline.org.bd' },
    update: {},
    create: {
      email: 'volunteer@lifeline.org.bd',
      phoneNumber: '+8801512345678',
      passwordHash: defaultPassword,
      firstName: 'Kazi',
      lastName: 'Nasir',
      role: Role.VOLUNTEER,
      isEmailVerified: true,
      isPhoneVerified: true,
      volunteerProfile: {
        create: {
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Ramna',
          isVerified: true,
          badgeTitle: 'Senior Field Coordinator',
          tasksCompleted: 12,
        },
      },
    },
  });
  console.log(`✅ Seeded Volunteer: ${volunteer.firstName} ${volunteer.lastName}`);

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
