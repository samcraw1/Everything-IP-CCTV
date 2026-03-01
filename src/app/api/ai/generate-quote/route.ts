import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { Settings, PricingItem, DEFAULT_PRICING, DEFAULT_TERMS } from "@/types";

interface GenerateQuoteRequest {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  brain_dump: string;
  audio_transcription?: string;
  photo_analysis?: string;
  settings?: Settings;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuoteRequest = await request.json();

    const pricing: PricingItem[] = body.settings?.pricing || DEFAULT_PRICING;
    const taxRate = body.settings?.tax_rate || 8.25;
    const terms = body.settings?.default_terms || DEFAULT_TERMS;
    const validityDays = body.settings?.validity_days || 30;
    const businessName = body.settings?.business_name || "Everything IP CCTV";

    // Build the combined input from all sources
    let customerInput = `Customer: ${body.customer_name}\n`;
    if (body.customer_phone) customerInput += `Phone: ${body.customer_phone}\n`;
    if (body.customer_address) customerInput += `Address: ${body.customer_address}\n`;
    customerInput += `\nCustomer Request (text notes):\n${body.brain_dump}\n`;

    if (body.audio_transcription) {
      customerInput += `\nVoice Memo Transcription:\n${body.audio_transcription}\n`;
    }

    if (body.photo_analysis) {
      customerInput += `\nSite Photo Analysis:\n${body.photo_analysis}\n`;
    }

    const pricingTable = pricing
      .map((p) => `- ${p.name}: $${p.price.toFixed(2)} ${p.unit}`)
      .join("\n");

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const systemPrompt = `You are a quote generator for ${businessName}, a professional CCTV/security camera installation business.

Your job is to analyze the customer's request and generate a professional, accurate quote.

PRICING TABLE (use these exact prices):
${pricingTable}

TAX RATE: ${taxRate}%

RULES:
1. Analyze ALL available information (text notes, voice transcription, photo analysis) to understand what the customer needs
2. Select appropriate equipment based on the described property and requirements
3. Calculate labor hours realistically (typically 1-2 hours per camera for standard install, more for complex runs)
4. Include all necessary supporting equipment (cables, mounts, connectors, etc.)
5. If the customer mentioned a budget, try to stay within it while recommending the best solution
6. Generate a professional scope of work description
7. Add any relevant recommendations or notes

RESPOND WITH ONLY A VALID JSON OBJECT in this exact format:
{
  "scope_of_work": "Professional description of the installation work to be performed...",
  "line_items": [
    {"description": "Item name", "quantity": 1, "unit_price": 100.00, "total": 100.00}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "notes": "Any additional recommendations, observations, or suggestions for the customer..."
}

Make sure:
- subtotal = sum of all line_items totals
- tax = subtotal * ${taxRate / 100}
- total = subtotal + tax
- All numbers are actual numbers, not strings
- The scope_of_work reads professionally and is customer-facing
- Notes should be helpful recommendations (e.g., suggest adding cameras, mention wifi requirements for remote viewing, etc.)`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: customerInput },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Strip markdown code fences if present
    let cleanedContent = content.trim();
    const fenceMatch = cleanedContent.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      cleanedContent = fenceMatch[1].trim();
    }

    let quoteData;
    try {
      quoteData = JSON.parse(cleanedContent);
    } catch {
      console.error("Failed to parse AI response:", cleanedContent);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    // Add terms and validity
    quoteData.terms = terms;
    quoteData.valid_until = validUntil.toISOString().split("T")[0];

    return NextResponse.json(quoteData);
  } catch (error: unknown) {
    console.error("Quote generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
