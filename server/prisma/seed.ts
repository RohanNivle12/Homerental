import { PrismaClient, Role, AccountStatus, PropertyType, FurnishingStatus, PropertyStatus, ModerationStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HomeFinder database...');

  // Clean existing records if any
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.propertyReport.deleteMany();
  await prisma.visitRequest.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.ownerVerification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const ownerPasswordHash = await bcrypt.hash('Owner@123456', salt);
  const tenantPasswordHash = await bcrypt.hash('Tenant@123456', salt);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@homefinder.com',
      phone: '+919876543210',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });

  // 2. Create Owners
  const owner1 = await prisma.user.create({
    data: {
      fullName: 'Rajesh Sharma',
      email: 'rajesh.sharma@homefinder.com',
      phone: '+919811122233',
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      ownerVerification: {
        create: {
          documentType: 'GOVT_ID',
          documentUrl: 'https://placehold.co/600x400?text=Govt+ID+Proof',
          status: VerificationStatus.APPROVED,
          adminNotes: 'Government ID verified successfully by Admin',
        },
      },
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      fullName: 'Priya Patel',
      email: 'priya.patel@homefinder.com',
      phone: '+919822233344',
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      ownerVerification: {
        create: {
          documentType: 'PROPERTY_DEED',
          documentUrl: 'https://placehold.co/600x400?text=Property+Deed',
          status: VerificationStatus.APPROVED,
          adminNotes: 'Ownership deed verified',
        },
      },
    },
  });

  const owner3 = await prisma.user.create({
    data: {
      fullName: 'Amit Verma',
      email: 'amit.verma@homefinder.com',
      phone: '+919833344455',
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      ownerVerification: {
        create: {
          documentType: 'UTILITY_BILL',
          documentUrl: 'https://placehold.co/600x400?text=Electricity+Bill',
          status: VerificationStatus.PENDING,
        },
      },
    },
  });

  // 3. Create Tenants
  const tenant1 = await prisma.user.create({
    data: {
      fullName: 'Rahul Mehta',
      email: 'rahul.mehta@homefinder.com',
      phone: '+919844455566',
      passwordHash: tenantPasswordHash,
      role: Role.TENANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });

  const tenant2 = await prisma.user.create({
    data: {
      fullName: 'Sneha Reddy',
      email: 'sneha.reddy@homefinder.com',
      phone: '+919855566677',
      passwordHash: tenantPasswordHash,
      role: Role.TENANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  // 4. Create Standard Amenities
  const amenitiesList = [
    { name: 'Gated Security', iconKey: 'ShieldCheck', category: 'SECURITY' },
    { name: 'Lift / Elevator', iconKey: 'ArrowUpDown', category: 'CONVENIENCE' },
    { name: 'Covered Car Parking', iconKey: 'Car', category: 'PARKING' },
    { name: 'Power Backup', iconKey: 'Zap', category: 'UTILITIES' },
    { name: 'Swimming Pool', iconKey: 'Waves', category: 'LIFESTYLE' },
    { name: 'Fitness Gym', iconKey: 'Dumbbell', category: 'FITNESS' },
    { name: 'Children Play Area', iconKey: 'Smile', category: 'FAMILY' },
    { name: 'Club House', iconKey: 'Home', category: 'LIFESTYLE' },
    { name: 'Gas Pipeline', iconKey: 'Flame', category: 'UTILITIES' },
    { name: 'Air Conditioning', iconKey: 'Wind', category: 'APPLIANCES' },
    { name: 'High Speed Wifi', iconKey: 'Wifi', category: 'CONNECTIVITY' },
    { name: 'Water Purifier (RO)', iconKey: 'Droplets', category: 'APPLIANCES' },
  ];

  const createdAmenities: Record<string, string> = {};
  for (const item of amenitiesList) {
    const a = await prisma.amenity.create({ data: item });
    createdAmenities[item.name] = a.id;
  }

  // 5. Create Realistic Rental Properties
  const propertiesData = [
    {
      ownerId: owner1.id,
      title: 'Spacious 2 BHK with Balcony in Indiranagar',
      description: 'Bright and airy 2 BHK apartment in prime 100ft road Indiranagar. Comes with modular kitchen, teakwood wardrobes, dedicated covered car park, 24/7 security and high speed elevator. Walking distance to Metro station, cafes, and supermarkets.',
      propertyType: PropertyType.APARTMENT,
      address: 'Plot 42, 12th Main Road, HAL 2nd Stage',
      locality: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560038',
      latitude: 12.9784,
      longitude: 77.6408,
      monthlyRent: 38000,
      securityDeposit: 150000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1250,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000',
      ],
      amenityNames: ['Lift / Elevator', 'Gated Security', 'Covered Car Parking', 'Power Backup', 'Gas Pipeline'],
    },
    {
      ownerId: owner1.id,
      title: 'Luxury 3 BHK Penthouse with Private Terrace',
      description: 'Ultra-modern 3 BHK apartment in the heart of Koramangala 4th Block. Huge private open terrace, Italian marble flooring, fully fitted modular kitchen with dishwasher, premium master bedroom with walk-in closet.',
      propertyType: PropertyType.PENTHOUSE,
      address: 'Casa Bella Heights, 80 Feet Road, 4th Block',
      locality: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      monthlyRent: 58000,
      securityDeposit: 220000,
      bedrooms: 3,
      bathrooms: 3,
      area: 1950,
      furnishing: FurnishingStatus.FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1000',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000',
      ],
      amenityNames: ['Swimming Pool', 'Fitness Gym', 'Lift / Elevator', 'Covered Car Parking', 'Power Backup', 'High Speed Wifi'],
    },
    {
      ownerId: owner1.id,
      title: 'Cozy 1 BHK Studio for Tech Professionals',
      description: 'Modern studio apartment located in HSR Layout Sector 2. Perfect for software engineers and young professionals. Fully furnished with smart TV, study desk, ergonomic chair, queen bed, and fast optical broadband.',
      propertyType: PropertyType.STUDIO,
      address: '24th Main, Sector 2, HSR Layout',
      locality: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560102',
      latitude: 12.9121,
      longitude: 77.6446,
      monthlyRent: 23000,
      securityDeposit: 80000,
      bedrooms: 1,
      bathrooms: 1,
      area: 600,
      furnishing: FurnishingStatus.FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000',
      ],
      amenityNames: ['Air Conditioning', 'High Speed Wifi', 'Water Purifier (RO)', 'Power Backup'],
    },
    {
      ownerId: owner2.id,
      title: 'Sea-Breeze 2 BHK Apartment in Bandra West',
      description: 'Prime Bandra West residential location near Carter Road promenade. Freshly renovated interiors, modular European kitchen, high ceilings, large windows with natural breeze. 24-hr security and reserved parking.',
      propertyType: PropertyType.APARTMENT,
      address: 'Sunset Vista, Perry Cross Road',
      locality: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      monthlyRent: 72000,
      securityDeposit: 300000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1100,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000',
      ],
      amenityNames: ['Lift / Elevator', 'Gated Security', 'Covered Car Parking', 'Air Conditioning', 'Gas Pipeline'],
    },
    {
      ownerId: owner2.id,
      title: 'Scenic Lake View 3 BHK in Hiranandani Powai',
      description: 'Elegant neoclassical tower in Hiranandani Gardens Powai with panoramic Powai Lake views. Marble floors, central AC, clubhouse access with Olympic size pool and state of the art gymnasium.',
      propertyType: PropertyType.APARTMENT,
      address: 'Lake Castle, Hiranandani Gardens, Powai',
      locality: 'Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076',
      latitude: 19.1176,
      longitude: 72.9060,
      monthlyRent: 88000,
      securityDeposit: 350000,
      bedrooms: 3,
      bathrooms: 3,
      area: 1650,
      furnishing: FurnishingStatus.FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000',
      ],
      amenityNames: ['Swimming Pool', 'Fitness Gym', 'Club House', 'Children Play Area', 'Gated Security'],
    },
    {
      ownerId: owner3.id,
      title: 'Independent 4 BHK Gated Villa in Whitefield',
      description: 'Exclusive gated villa community near ITPL Whitefield. Private garden lawn, private covered 2-car garage, solar water heating, servant quarters, premium gated security and clubhouse.',
      propertyType: PropertyType.VILLA,
      address: 'Palm Meadows, Varthur Road, Whitefield',
      locality: 'Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560066',
      latitude: 12.9698,
      longitude: 77.7499,
      monthlyRent: 85000,
      securityDeposit: 350000,
      bedrooms: 4,
      bathrooms: 4,
      area: 3200,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000',
      ],
      amenityNames: ['Swimming Pool', 'Fitness Gym', 'Covered Car Parking', 'Children Play Area', 'Power Backup'],
    },
    {
      ownerId: owner3.id,
      title: 'Premium 3 BHK Builder Floor in Greater Kailash 2',
      description: 'First floor luxury builder floor with stilt parking and private elevator access in GK-2. Close to M-Block market. Wide balcony overlooking park, Italian modular kitchen, VRV air conditioning.',
      propertyType: PropertyType.INDEPENDENT_HOUSE,
      address: 'E-Block, Greater Kailash Part 2',
      locality: 'Greater Kailash',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110048',
      latitude: 28.5355,
      longitude: 77.2410,
      monthlyRent: 65000,
      securityDeposit: 190000,
      bedrooms: 3,
      bathrooms: 3,
      area: 1800,
      furnishing: FurnishingStatus.FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      images: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1000',
      ],
      amenityNames: ['Lift / Elevator', 'Covered Car Parking', 'Power Backup', 'Air Conditioning', 'Gated Security'],
    },
    {
      ownerId: owner3.id,
      title: 'Modern 2 BHK Condo in Cyber City DLF Phase 5',
      description: 'Brand new 2 bedroom apartment located minutes away from Cyber City and Golf Course Road. Uninterrupted power backup, concierge reception, swimming pool, badminton court.',
      propertyType: PropertyType.APARTMENT,
      address: 'DLF The Crest, Sector 54, Golf Course Road',
      locality: 'DLF Phase 5',
      city: 'Gurgaon',
      state: 'Haryana',
      postalCode: '122002',
      latitude: 28.4595,
      longitude: 77.0266,
      monthlyRent: 48000,
      securityDeposit: 120000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1350,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      status: PropertyStatus.AVAILABLE,
      moderationStatus: ModerationStatus.PENDING, // Pending moderation test case for admin review!
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000',
      ],
      amenityNames: ['Lift / Elevator', 'Fitness Gym', 'Swimming Pool', 'Power Backup', 'Gated Security'],
    },
  ];

  const createdProperties = [];
  for (const item of propertiesData) {
    const { images, amenityNames, ...propFields } = item;
    const prop = await prisma.property.create({
      data: {
        ...propFields,
        images: {
          create: images.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            order: idx,
          })),
        },
        amenities: {
          create: amenityNames.map((name) => ({
            amenityId: createdAmenities[name],
          })),
        },
      },
    });
    createdProperties.push(prop);
  }

  // 6. Create Initial Inquiries and Visit Requests
  const firstProp = createdProperties[0];
  const secondProp = createdProperties[1];

  // Inquiry from Rahul to Rajesh
  await prisma.inquiry.create({
    data: {
      propertyId: firstProp.id,
      tenantId: tenant1.id,
      message: 'Hi Rajesh, I am interested in your 2 BHK Indiranagar property. Is it available for immediate possession?',
      ownerReply: 'Hello Rahul! Yes, it is available from next week. You are welcome to schedule a visit.',
      status: 'RESPONDED',
    },
  });

  // Visit Request from Rahul to Rajesh (Accepted)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  await prisma.visitRequest.create({
    data: {
      propertyId: firstProp.id,
      tenantId: tenant1.id,
      visitDate: tomorrow,
      timeSlot: '11:00 AM - 12:00 PM',
      notes: 'Coming with family to inspect the property.',
      ownerNotes: 'Accepted. Please call upon arrival at the gate.',
      status: 'ACCEPTED',
    },
  });

  // Visit Request from Sneha to Rajesh (Pending)
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);
  await prisma.visitRequest.create({
    data: {
      propertyId: secondProp.id,
      tenantId: tenant2.id,
      visitDate: dayAfter,
      timeSlot: '04:00 PM - 05:00 PM',
      notes: 'Looking for a 1-year lease starting next month.',
      status: 'PENDING',
    },
  });

  // Tenant Favorite
  await prisma.favorite.create({
    data: {
      userId: tenant1.id,
      propertyId: firstProp.id,
    },
  });

  // Notification for Rahul
  await prisma.notification.create({
    data: {
      userId: tenant1.id,
      type: 'VISIT',
      title: 'Visit Request Confirmed!',
      message: `Landlord Rajesh Sharma accepted your visit request for "${firstProp.title}".`,
      linkUrl: '/dashboard/tenant/visits',
    },
  });

  console.log('Seed completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Admin:   admin@homefinder.com     / Admin@123456');
  console.log('  Owner:   rajesh.sharma@homefinder.com / Owner@123456');
  console.log('  Owner:   priya.patel@homefinder.com   / Owner@123456');
  console.log('  Tenant:  rahul.mehta@homefinder.com   / Tenant@123456');
  console.log('  Tenant:  sneha.reddy@homefinder.com   / Tenant@123456');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
