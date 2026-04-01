import { NextResponse } from "next/server";
import { listN8nWorkflows } from "@/lib/n8n";
import { parseApiError } from "@/app/api/tenants/utils";

export async function GET() {
  try {
    const result = await listN8nWorkflows();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
