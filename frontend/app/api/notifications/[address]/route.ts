import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const data = await getNotifications(address);

  return NextResponse.json(data);
}
