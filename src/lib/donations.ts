import { prisma } from './prisma';

// Define types for donation
interface Donation {
  id: string;
  amount: number;
  donorName: string;
  donorEmail: string;
  recipientType: 'platform' | 'craftsman';
  recipientId?: string; // Only required if donating to a craftsman
  message?: string;
  createdAt: Date;
}

export async function getAllDonations(filters?: {
  recipientType?: 'platform' | 'craftsman';
  recipientId?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.recipientType) where.recipientType = filters.recipientType;
    if (filters?.recipientId) where.recipientId = filters.recipientId;

    const donations = await prisma.donation.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return donations.map(d => ({
      ...d,
      recipientType: d.recipientType as 'platform' | 'craftsman'
    }));
  } catch (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
}

export async function getDonationById(id: string) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id }
    });

    if (!donation) return null;

    return {
      ...donation,
      recipientType: donation.recipientType as 'platform' | 'craftsman'
    };
  } catch (error) {
    console.error('Error fetching donation:', error);
    return null;
  }
}


export async function createDonation(donationData: Omit<Donation, 'id' | 'createdAt'>) {
  // Validate required fields
  if (!donationData.amount || !donationData.donorName || !donationData.donorEmail || !donationData.recipientType) {
    throw new Error('المبلغ واسم المتبرع والبريد الإلكتروني ونوع المستلم مطلوبة');
  }
  
  // Validate amount
  if (donationData.amount <= 0) {
    throw new Error('يجب أن يكون مبلغ التبرع أكبر من صفر');
  }
  
  // Validate recipient type and ID
  if (donationData.recipientType === 'craftsman' && !donationData.recipientId) {
    throw new Error('معرف الحرفي مطلوب عند التبرع لحرفي');
  }
  
  try {
    const donation = await prisma.donation.create({
      data: {
        amount: donationData.amount,
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        recipientType: donationData.recipientType,
        recipientId: donationData.recipientId || null,
        message: donationData.message || null,
      }
    });
    return {
      ...donation,
      recipientType: donation.recipientType as 'platform' | 'craftsman'
    };
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}
