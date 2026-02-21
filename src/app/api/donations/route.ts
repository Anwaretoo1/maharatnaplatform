import { NextRequest, NextResponse } from 'next/server';
import { getAllDonations, getDonationById, createDonation } from '@/lib/donations';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const recipientType = searchParams.get('recipientType') as 'platform' | 'craftsman' | null;
    const recipientId = searchParams.get('recipientId');
    
    if (id) {
      // Get specific donation by ID
      const donation = await getDonationById(id);
      
      if (!donation) {
        return NextResponse.json(
          { error: 'التبرع غير موجود' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ donation });
    }
    
    // Get all donations with optional filters
    const filters: {
      recipientType?: 'platform' | 'craftsman';
      recipientId?: string;
    } = {};
    
    if (recipientType) filters.recipientType = recipientType;
    if (recipientId) filters.recipientId = recipientId;
    
    const donations = await getAllDonations(filters);
    return NextResponse.json({ donations });
  } catch (error) {
    console.error('Error in donations GET route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات التبرعات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create new donation (validation is handled in the createDonation function)
    try {
      const newDonation = await createDonation({
        amount: data.amount,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        recipientType: data.recipientType,
        recipientId: data.recipientId,
        message: data.message || '',
      });
      
      return NextResponse.json({ donation: newDonation }, { status: 201 });
    } catch (validationError: unknown) {
      const error = validationError as Error;
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in donations POST route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء التبرع' },
      { status: 500 }
    );
  }
}
