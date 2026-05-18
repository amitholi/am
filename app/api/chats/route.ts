import { NextRequest } from "next/server";
import { chatsRepo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ chats: chatsRepo.list() });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });
  chatsRepo.delete(id);
  return Response.json({ ok: true });
}
