import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos.length) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    // Convert photos to base64 for Vision API
    const imageContents = await Promise.all(
      photos.slice(0, 5).map(async (photo) => {
        const bytes = await photo.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = photo.type || "image/jpeg";
        return {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: "low" as const,
          },
        };
      })
    );

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a CCTV installation expert analyzing site photos. Describe what you see that's relevant to a camera installation job:
- Property type and size (residential, commercial, stories)
- Existing wiring or infrastructure visible
- Potential camera mounting locations
- Areas of concern (dark spots, entry points, blind spots)
- Any challenges you notice (high ceilings, difficult wire runs, etc.)
- Recommendations for camera types and placement
Be specific and practical. Keep it under 200 words.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these site photos for a CCTV installation quote:",
            },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 500,
    });

    const analysis = completion.choices[0].message.content;

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("Photo analysis error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
