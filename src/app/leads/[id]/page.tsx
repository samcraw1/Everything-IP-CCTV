"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lead, Quote, Settings, LineItem } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusSelector from "@/components/StatusSelector";
import QuotePreview from "@/components/QuotePreview";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [editingQuote, setEditingQuote] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Quote | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, quotesRes, settingsRes] = await Promise.all([
        fetch(`/api/leads?status=all`),
        fetch(`/api/quotes?lead_id=${leadId}`),
        fetch("/api/settings"),
      ]);

      const leadsData = await leadsRes.json();
      const quotesData = await quotesRes.json();
      const settingsData = await settingsRes.json();

      if (Array.isArray(leadsData)) {
        const found = leadsData.find((l: Lead) => l.id === leadId);
        setLead(found || null);
      }

      if (Array.isArray(quotesData) && quotesData.length > 0) {
        setQuote(quotesData[0]);
        setEditedQuote(quotesData[0]);
      }

      if (settingsData && !settingsData.error) {
        setSettings(settingsData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    setShowStatusSelector(false);

    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleGenerateQuote = async () => {
    if (!lead) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: lead.customer_name,
          customer_phone: lead.customer_phone,
          customer_address: lead.customer_address,
          brain_dump: lead.brain_dump,
          audio_transcription: lead.audio_transcription || undefined,
          photo_analysis: lead.photo_analysis || undefined,
          settings: settings || undefined,
        }),
      });

      const quoteData = await res.json();

      if (res.ok) {
        // Save the quote
        const saveRes = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            ...quoteData,
          }),
        });

        if (saveRes.ok) {
          const savedQuote = await saveRes.json();
          setQuote(savedQuote);
          setEditedQuote(savedQuote);
          setLead({ ...lead, status: "quoted" });
        }
      } else {
        alert("Failed to generate quote: " + (quoteData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Quote generation failed:", err);
      alert("Failed to generate quote. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEditedQuote = async () => {
    if (!editedQuote) return;
    setSavingQuote(true);

    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedQuote),
      });

      if (res.ok) {
        const updated = await res.json();
        setQuote(updated);
        setEditedQuote(updated);
        setEditingQuote(false);
      }
    } catch (err) {
      console.error("Quote save failed:", err);
    } finally {
      setSavingQuote(false);
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    if (!editedQuote) return;
    const items = [...editedQuote.line_items];
    const item = { ...items[index] };

    if (field === "description") {
      item.description = value as string;
    } else {
      const num = typeof value === "string" ? parseFloat(value) || 0 : value;
      if (field === "quantity") item.quantity = num;
      if (field === "unit_price") item.unit_price = num;
      item.total = item.quantity * item.unit_price;
    }

    items[index] = item;
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxRate = settings?.tax_rate || 8.25;
    const tax = subtotal * (taxRate / 100);

    setEditedQuote({
      ...editedQuote,
      line_items: items,
      subtotal,
      tax,
      total: subtotal + tax,
    });
  };

  const addLineItem = () => {
    if (!editedQuote) return;
    const items = [...editedQuote.line_items, { description: "", quantity: 1, unit_price: 0, total: 0 }];
    setEditedQuote({ ...editedQuote, line_items: items });
  };

  const removeLineItem = (index: number) => {
    if (!editedQuote) return;
    const items = editedQuote.line_items.filter((_, i) => i !== index);
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxRate = settings?.tax_rate || 8.25;
    const tax = subtotal * (taxRate / 100);
    setEditedQuote({ ...editedQuote, line_items: items, subtotal, tax, total: subtotal + tax });
  };

  const handleShare = () => {
    if (!lead || !quote) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const quoteUrl = `${siteUrl}/quote/${quote.id}`;
    const message = `Hi ${lead.customer_name}, here's your quote for the camera installation: ${quoteUrl}`;

    if (navigator.share) {
      navigator.share({ title: "Camera Installation Quote", text: message, url: quoteUrl });
    } else {
      // Fallback to SMS
      const smsUrl = `sms:${lead.customer_phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, "_blank");
    }
  };

  const handleExportPDF = async () => {
    if (!quote || !lead) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const previewEl = document.getElementById("quote-pdf-content");
    if (!previewEl) return;

    // Temporarily make it visible for rendering
    previewEl.style.position = "fixed";
    previewEl.style.left = "-9999px";
    previewEl.style.top = "0";
    previewEl.style.width = "800px";
    previewEl.style.display = "block";
    previewEl.style.background = "#ffffff";
    previewEl.style.padding = "40px";

    try {
      const canvas = await html2canvas(previewEl, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`quote-${lead.customer_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      previewEl.style.display = "none";
      previewEl.style.position = "";
      previewEl.style.left = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Lead not found</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (showPreview && quote) {
    return (
      <div className="min-h-screen pb-8 page-enter">
        <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setShowPreview(false)} className="p-2 -ml-2 rounded-lg hover:bg-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-neutral-400">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white flex-1">Quote Preview</h1>
            <button onClick={handleShare} className="btn btn-primary text-sm">Share</button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <QuotePreview quote={quote} lead={lead} settings={settings} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-lg hover:bg-neutral-800">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-neutral-400">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{lead.customer_name}</h1>
          </div>
          <button onClick={() => setShowStatusSelector(true)}>
            <StatusBadge status={lead.status} size="md" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Customer info card */}
        <div className="card">
          <h2 className="text-sm font-medium text-neutral-500 mb-3">Customer Details</h2>
          {lead.customer_phone && (
            <a href={`tel:${lead.customer_phone}`} className="flex items-center gap-3 py-2 text-blue-400 hover:text-blue-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
              {lead.customer_phone}
            </a>
          )}
          {lead.customer_address && (
            <p className="flex items-center gap-3 py-2 text-neutral-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-500">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {lead.customer_address}
            </p>
          )}
          <p className="text-sm text-neutral-500 mt-2">
            Created {new Date(lead.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Brain dump */}
        {lead.brain_dump && (
          <div className="card">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">Notes</h2>
            <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{lead.brain_dump}</p>
          </div>
        )}

        {/* Audio transcription */}
        {lead.audio_transcription && (
          <div className="card">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">Voice Memo Transcription</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">{lead.audio_transcription}</p>
          </div>
        )}

        {/* Photo analysis */}
        {lead.photo_analysis && (
          <div className="card">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">Site Photo Analysis</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">{lead.photo_analysis}</p>
          </div>
        )}

        {/* Quote section */}
        {!quote ? (
          <button
            onClick={handleGenerateQuote}
            disabled={generating}
            className="btn btn-primary btn-lg w-full"
          >
            {generating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Quote with AI...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
                  <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 01.877-.597 11.319 11.319 0 004.22 0 .75.75 0 11.28 1.473 12.819 12.819 0 01-4.78 0 .75.75 0 01-.597-.876zM9.754 22.344a.75.75 0 01.824-.668 13.682 13.682 0 002.844 0 .75.75 0 11.156 1.492 15.156 15.156 0 01-3.156 0 .75.75 0 01-.668-.824z" clipRule="evenodd" />
                </svg>
                Generate Quote with AI
              </div>
            )}
          </button>
        ) : (
          <>
            {/* Quote actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowPreview(true)} className="btn btn-primary flex-1">
                Preview Quote
              </button>
              <button onClick={handleShare} className="btn btn-success flex-1">
                Send to Customer
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={handleExportPDF} className="btn btn-secondary flex-1">
                Export PDF
              </button>
              <button
                onClick={() => {
                  setEditingQuote(!editingQuote);
                  setEditedQuote(quote);
                }}
                className="btn btn-secondary flex-1"
              >
                {editingQuote ? "Cancel Edit" : "Edit Quote"}
              </button>
              <button onClick={handleGenerateQuote} disabled={generating} className="btn btn-secondary flex-1">
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>

            {/* Editable quote or read-only display */}
            {editingQuote && editedQuote ? (
              <div className="card space-y-4">
                <h2 className="text-base font-semibold text-white">Edit Quote</h2>

                <div>
                  <label className="label">Scope of Work</label>
                  <textarea
                    value={editedQuote.scope_of_work}
                    onChange={(e) => setEditedQuote({ ...editedQuote, scope_of_work: e.target.value })}
                    rows={4}
                    className="textarea text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Line Items</label>
                    <button onClick={addLineItem} className="text-sm text-blue-400 hover:text-blue-300">
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editedQuote.line_items.map((item, i) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={item.description}
                            onChange={(e) => updateLineItem(i, "description", e.target.value)}
                            placeholder="Item description"
                            className="input flex-1 text-sm"
                          />
                          <button onClick={() => removeLineItem(i)} className="p-2 text-red-400 hover:text-red-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.55 6a.75.75 0 01-1.493-.137l.55-6a.75.75 0 01.793-.66zm2.84 0a.75.75 0 01.793.66l.55 6a.75.75 0 01-1.493.137l-.55-6a.75.75 0 01.7-.797z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-neutral-500">Qty</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                              className="input text-sm"
                              min="0"
                              step="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-neutral-500">Unit Price</label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(i, "unit_price", e.target.value)}
                              className="input text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-neutral-500">Total</label>
                            <div className="input text-sm bg-neutral-900 text-neutral-400">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="text-white">${editedQuote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Tax</span>
                    <span className="text-white">${editedQuote.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-1 border-t border-neutral-700">
                    <span className="text-white">Total</span>
                    <span className="text-white">${editedQuote.total.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={editedQuote.notes || ""}
                    onChange={(e) => setEditedQuote({ ...editedQuote, notes: e.target.value })}
                    rows={3}
                    className="textarea text-sm"
                  />
                </div>

                <div>
                  <label className="label">Terms</label>
                  <textarea
                    value={editedQuote.terms}
                    onChange={(e) => setEditedQuote({ ...editedQuote, terms: e.target.value })}
                    rows={4}
                    className="textarea text-sm"
                  />
                </div>

                <button
                  onClick={handleSaveEditedQuote}
                  disabled={savingQuote}
                  className="btn btn-primary w-full"
                >
                  {savingQuote ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="card">
                <QuotePreview quote={quote} lead={lead} settings={settings} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden element for PDF export */}
      {quote && lead && (
        <div id="quote-pdf-content" style={{ display: "none" }}>
          <QuotePreview quote={quote} lead={lead} settings={settings} isPublic />
        </div>
      )}

      {/* Status selector modal */}
      {showStatusSelector && (
        <StatusSelector
          currentStatus={lead.status}
          onSelect={handleStatusChange}
          onClose={() => setShowStatusSelector(false)}
        />
      )}
    </div>
  );
}
