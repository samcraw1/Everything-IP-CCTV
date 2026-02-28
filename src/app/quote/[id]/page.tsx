import { supabase } from "@/lib/supabase";
import { Quote, Lead, Settings } from "@/types";
import QuotePreview from "@/components/QuotePreview";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch quote
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center text-gray-600">
          <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
          <p>This quote may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  // Fetch lead
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", quote.lead_id)
    .single();

  // Fetch settings
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <QuotePreview
        quote={quote as Quote}
        lead={lead as Lead}
        settings={settings as Settings | null}
        isPublic
      />
    </div>
  );
}
