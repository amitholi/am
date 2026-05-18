import { chatsRepo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const chat = chatsRepo.get(id);
  if (!chat) return new Response("not found", { status: 404 });
  const rows = chatsRepo.messages(id);
  const messages = rows.map((r) => ({
    id: r.id,
    role: r.role,
    parts: JSON.parse(r.parts),
  }));
  return Response.json({ chat, messages });
}
