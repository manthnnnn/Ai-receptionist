import { NextRequest, NextResponse } from 'next/server';
import { clinicTools } from '@/lib/ai/tools';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_name, arguments: args } = body;

    if (!tool_name || !(tool_name in clinicTools)) {
      return NextResponse.json(
        { success: false, error: `Invalid or unsupported tool: ${tool_name}` },
        { status: 400 }
      );
    }

    const toolFn = (clinicTools as any)[tool_name];
    const result = await toolFn(args);

    return NextResponse.json({
      success: true,
      tool_name,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
