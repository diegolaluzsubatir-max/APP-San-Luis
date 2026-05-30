import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("foto") as File | null;
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.type === "image/png" ? "png" : "jpg";
  const dir = path.join(process.cwd(), "public", "jugadores");
  await mkdir(dir, { recursive: true });

  const filename = `${id}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ url: `/jugadores/${filename}` });
}
