import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  checkDepositNotification,
  NotificationCheckError,
} from "@/app/lib/gemini/notification-check";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "missing image" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid image type" }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "image too large" }, { status: 400 });
  }

  // The image lives only in this request's memory: it is base64-encoded for
  // the Gemini call and never written to disk, Supabase, or a log. Once this
  // handler returns, nothing referencing it survives.
  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    const result = await checkDepositNotification(base64, image.type);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotificationCheckError) {
      console.error("[notification-check] Gemini call failed", {
        message: error.message,
        cause:
          error.cause instanceof Error ? error.cause.message : error.cause,
      });
      return NextResponse.json(
        { error: "notification check unavailable" },
        { status: 502 }
      );
    }
    throw error;
  }
}
