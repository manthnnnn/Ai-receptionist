import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id');
    const serviceId = searchParams.get('id');

    if (serviceId) {
      const service = localStore.getServiceById(serviceId);
      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, service });
    }

    const services = localStore.getServices(clinicId || undefined);
    return NextResponse.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clinic_id || !body.name) {
      return NextResponse.json(
        { success: false, error: 'clinic_id and name are required' },
        { status: 400 }
      );
    }

    const service = localStore.createService({
      clinic_id: body.clinic_id,
      name: body.name,
      description: body.description,
      duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : 30,
      price: body.price !== undefined ? Number(body.price) : 500,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
    }

    const updated = localStore.updateService(id, {
      name: body.name,
      description: body.description,
      duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : undefined,
      price: body.price !== undefined ? Number(body.price) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
    }

    const deleted = localStore.deleteService(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
