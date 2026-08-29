import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';
    const category = searchParams.get('category') || undefined;

    const faqs = localStore.getClinicFAQs(clinicId, category);

    return NextResponse.json({
      success: true,
      count: faqs.length,
      faqs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, category, question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: 'Question and answer are required' }, { status: 400 });
    }

    const newFaq = localStore.addFAQ({
      clinic_id: clinic_id || '00000000-0000-0000-0000-000000000001',
      category: category || 'GENERAL',
      question,
      answer,
    });

    return NextResponse.json({
      success: true,
      faq: newFaq,
      message: 'FAQ added successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'FAQ id is required' }, { status: 400 });
    }

    const deleted = localStore.deleteFAQ(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
