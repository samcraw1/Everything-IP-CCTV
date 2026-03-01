"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lead, Quote, Settings, LineItem, Schematic, Camera } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusSelector from "@/components/StatusSelector";
import QuotePreview from "@/components/QuotePreview";
import SchematicCard from "@/components/SchematicCard";
import CameraCard from "@/components/CameraCard";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [schematics, setSchematics] = useState<Schematic[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [editingQuote, setEditingQuote] = useState(false);
  const [isManualCreate, setIsManualCreate] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Quote | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Camera form
  const [showCameraForm, setShowCameraForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [cameraName, setCameraName] = useState("");
  const [cameraIp, setCameraIp] = useState("");
  const [cameraWebUrl, setCameraWebUrl] = useState("");
  const [cameraBrand, setCameraBrand] = useState("");
  const [cameraLocation, setCameraLocation] = useState("");
  const [savingCamera, setSavingCamera] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, quotesRes, settingsRes, schematicsRes, camerasRes] = await Promise.all([
        fetch(`/api/leads?status=all`),
        fetch(`/api/quotes?lead_id=${leadId}`),
        fetch("/api/settings"),
        fetch(`/api/schematics?lead_id=${leadId}`),
        fetch(`/api/cameras?lead_id=${leadId}`),
      ]);

      const leadsData = await leadsRes.json();
      const quotesData = await quotesRes.json();
      const settingsData = await settingsRes.json();
      const schematicsData = await schematicsRes.json();
      const camerasData = await camerasRes.json();

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

      if (Array.isArray(schematicsData)) {
        setSchematics(schematicsData);
      }

      if (Array.isArray(camerasData)) {
        setCameras(camerasData);
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
        if (quoteData.upgrade) {
          showToast("AI quotes require Pro plan. Use Manual Quote instead.", "warning");
        } else {
          showToast("Failed to generate quote: " + (quoteData.error || "Unknown error"), "error");
        }
      }
    } catch (err) {
      console.error("Quote generation failed:", err);
      showToast("Failed to generate quote. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleStartManualQuote = () => {
    const taxRate = settings?.tax_rate || 8.25;
    const validDays = settings?.validity_days || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const blankQuote: Quote = {
      id: "",
      org_id: "",
      lead_id: leadId,
      scope_of_work: "",
      line_items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
      terms: settings?.default_terms || "",
      valid_until: validUntil.toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
    };

    setEditedQuote(blankQuote);
    setIsManualCreate(true);
    setEditingQuote(true);

    recalculateTotals(blankQuote.line_items, taxRate, blankQuote);
  };

  const handleSaveEditedQuote = async () => {
    if (!editedQuote) return;

    if (isManualCreate && !editedQuote.scope_of_work.trim()) {
      showToast("Please enter a scope of work", "warning");
      return;
    }

    setSavingQuote(true);

    try {
      if (isManualCreate) {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            scope_of_work: editedQuote.scope_of_work,
            line_items: editedQuote.line_items,
            subtotal: editedQuote.subtotal,
            tax: editedQuote.tax,
            total: editedQuote.total,
            terms: editedQuote.terms,
            valid_until: editedQuote.valid_until,
            notes: editedQuote.notes,
          }),
        });

        if (res.ok) {
          const savedQuote = await res.json();
          setQuote(savedQuote);
          setEditedQuote(savedQuote);
          setEditingQuote(false);
          setIsManualCreate(false);
          if (lead) setLead({ ...lead, status: "quoted" });
          showToast("Quote created", "success");
        } else {
          showToast("Failed to save quote", "error");
        }
      } else {
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
          showToast("Quote saved", "success");
        }
      }
    } catch (err) {
      console.error("Quote save failed:", err);
      showToast("Failed to save quote", "error");
    } finally {
      setSavingQuote(false);
    }
  };

  const recalculateTotals = (items: LineItem[], taxRate: number, base: Quote) => {
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const tax = subtotal * (taxRate / 100);
    setEditedQuote({
      ...base,
      line_items: items,
      subtotal,
      tax,
      total: subtotal + tax,
    });
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
    const taxRate = settings?.tax_rate || 8.25;
    recalculateTotals(items, taxRate, { ...editedQuote, line_items: items });
  };

  const addLineItem = () => {
    if (!editedQuote) return;
    const items = [...editedQuote.line_items, { description: "", quantity: 1, unit_price: 0, total: 0 }];
    const taxRate = settings?.tax_rate || 8.25;
    recalculateTotals(items, taxRate, editedQuote);
  };

  const addFromCatalog = (name: string, price: number) => {
    if (!editedQuote) return;
    const newItem: LineItem = { description: name, quantity: 1, unit_price: price, total: price };
    const items = [...editedQuote.line_items, newItem];
    const taxRate = settings?.tax_rate || 8.25;
    recalculateTotals(items, taxRate, editedQuote);
    setShowCatalog(false);
  };

  const removeLineItem = (index: number) => {
    if (!editedQuote) return;
    const items = editedQuote.line_items.filter((_, i) => i !== index);
    const taxRate = settings?.tax_rate || 8.25;
    recalculateTotals(items, taxRate, editedQuote);
  };

  const handleShare = async () => {
    if (!lead || !quote) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const quoteUrl = `${siteUrl}/quote/${quote.id}`;
    const message = `Hi ${lead.customer_name}, here's your quote for the camera installation: ${quoteUrl}`;

    try {
      await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quote.id, quote_status: "sent" }),
      });
      setQuote({ ...quote, quote_status: "sent" });
    } catch {
      // Non-blocking
    }

    if (navigator.share) {
      navigator.share({ title: "Camera Installation Quote", text: message, url: quoteUrl });
    } else if (lead.customer_phone) {
      const smsUrl = `sms:${lead.customer_phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, "_blank");
    } else {
      navigator.clipboard.writeText(quoteUrl).then(() => {
        showToast("Quote link copied to clipboard", "success");
      }).catch(() => {
        showToast("Could not copy link", "error");
      });
    }
  };

  const handleDeleteLead = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads?id=${leadId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Lead deleted", "success");
        router.push("/");
      } else {
        showToast("Failed to delete lead", "error");
      }
    } catch {
      showToast("Failed to delete lead", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Camera handlers
  const resetCameraForm = () => {
    setCameraName("");
    setCameraIp("");
    setCameraWebUrl("");
    setCameraBrand("");
    setCameraLocation("");
    setEditingCamera(null);
    setShowCameraForm(false);
  };

  const handleSaveCamera = async () => {
    if (!cameraName.trim() || !cameraIp.trim()) {
      showToast("Name and IP address are required", "warning");
      return;
    }

    setSavingCamera(true);
    try {
      if (editingCamera) {
        const res = await fetch("/api/cameras", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCamera.id,
            name: cameraName,
            ip_address: cameraIp,
            web_url: cameraWebUrl || null,
            brand: cameraBrand || null,
            location_note: cameraLocation || null,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setCameras((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          showToast("Camera updated", "success");
          resetCameraForm();
        } else {
          showToast("Failed to update camera", "error");
        }
      } else {
        const res = await fetch("/api/cameras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            name: cameraName,
            ip_address: cameraIp,
            web_url: cameraWebUrl || null,
            brand: cameraBrand || null,
            location_note: cameraLocation || null,
          }),
        });
        if (res.ok) {
          const newCam = await res.json();
          setCameras((prev) => [newCam, ...prev]);
          showToast("Camera added", "success");
          resetCameraForm();
        } else {
          showToast("Failed to add camera", "error");
        }
      }
    } catch {
      showToast("Failed to save camera", "error");
    } finally {
      setSavingCamera(false);
    }
  };

  const handleEditCamera = (cam: Camera) => {
    setCameraName(cam.name);
    setCameraIp(cam.ip_address);
    setCameraWebUrl(cam.web_url || "");
    setCameraBrand(cam.brand || "");
    setCameraLocation(cam.location_note || "");
    setEditingCamera(cam);
    setShowCameraForm(true);
  };

  const handleDeleteCamera = async (camId: string) => {
    try {
      const res = await fetch(`/api/cameras?id=${camId}`, { method: "DELETE" });
      if (res.ok) {
        setCameras((prev) => prev.filter((c) => c.id !== camId));
        showToast("Camera deleted", "success");
      } else {
        showToast("Failed to delete camera", "error");
      }
    } catch {
      showToast("Failed to delete camera", "error");
    }
  };

  const handleExportPDF = async () => {
    if (!quote || !lead) return;

    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const bizName = settings?.business_name || "CCTV Installation";
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(bizName, margin, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100);
    const bizDetails = [settings?.business_phone, settings?.business_email, settings?.business_address].filter(Boolean);
    bizDetails.forEach((line) => { pdf.text(line!, margin, y); y += 4.5; });
    y += 4;

    pdf.setDrawColor(200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    pdf.setTextColor(0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("QUOTE", margin, y);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100);
    const dateStr = new Date(quote.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    pdf.text(dateStr, pageWidth - margin, y, { align: "right" });
    y += 10;

    pdf.setTextColor(0);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
    y += 6;
    pdf.setFontSize(8); pdf.setTextColor(120);
    pdf.text("PREPARED FOR", margin + 4, y);
    y += 5;
    pdf.setFontSize(11); pdf.setTextColor(0); pdf.setFont("helvetica", "bold");
    pdf.text(lead.customer_name, margin + 4, y);
    y += 5;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(80);
    [lead.customer_address, lead.customer_phone].filter(Boolean).forEach((line) => { pdf.text(line!, margin + 4, y); y += 4; });
    y += 8;

    checkPageBreak(20);
    pdf.setFontSize(8); pdf.setTextColor(120); pdf.setFont("helvetica", "bold");
    pdf.text("SCOPE OF WORK", margin, y);
    y += 5;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(40);
    pdf.splitTextToSize(quote.scope_of_work, contentWidth).forEach((line: string) => { checkPageBreak(5); pdf.text(line, margin, y); y += 4.5; });
    y += 6;

    checkPageBreak(20);
    pdf.setFontSize(8); pdf.setTextColor(120); pdf.setFont("helvetica", "bold");
    const colItem = margin;
    const colQty = margin + contentWidth * 0.55;
    const colPrice = margin + contentWidth * 0.7;
    const colTotal = margin + contentWidth - 1;
    pdf.text("ITEM", colItem, y); pdf.text("QTY", colQty, y); pdf.text("PRICE", colPrice, y); pdf.text("TOTAL", colTotal, y, { align: "right" });
    y += 2; pdf.setDrawColor(200); pdf.line(margin, y, pageWidth - margin, y); y += 5;

    pdf.setFont("helvetica", "normal"); pdf.setTextColor(40); pdf.setFontSize(9);
    quote.line_items.forEach((item) => {
      checkPageBreak(8);
      const descLines = pdf.splitTextToSize(item.description, contentWidth * 0.5);
      pdf.text(descLines[0] || "", colItem, y);
      pdf.text(String(item.quantity), colQty, y);
      pdf.text(`$${item.unit_price.toFixed(2)}`, colPrice, y);
      pdf.text(`$${item.total.toFixed(2)}`, colTotal, y, { align: "right" });
      y += 3; pdf.setDrawColor(230); pdf.line(margin, y, pageWidth - margin, y); y += 5;
    });
    y += 2;

    checkPageBreak(25);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin + contentWidth * 0.5, y, contentWidth * 0.5, 24, 2, 2, "F");
    const totalsX = margin + contentWidth * 0.52;
    const totalsValX = pageWidth - margin - 2;
    y += 6;
    pdf.setFontSize(9); pdf.setTextColor(80);
    pdf.text("Subtotal", totalsX, y); pdf.text(`$${quote.subtotal.toFixed(2)}`, totalsValX, y, { align: "right" }); y += 5;
    pdf.text("Tax", totalsX, y); pdf.text(`$${quote.tax.toFixed(2)}`, totalsValX, y, { align: "right" }); y += 2;
    pdf.setDrawColor(200); pdf.line(totalsX, y, totalsValX, y); y += 5;
    pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0);
    pdf.text("Total", totalsX, y); pdf.text(`$${quote.total.toFixed(2)}`, totalsValX, y, { align: "right" }); y += 10;

    if (quote.notes) {
      checkPageBreak(15);
      pdf.setFontSize(8); pdf.setTextColor(120); pdf.setFont("helvetica", "bold");
      pdf.text("NOTES & RECOMMENDATIONS", margin, y); y += 5;
      pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(40);
      pdf.splitTextToSize(quote.notes, contentWidth).forEach((line: string) => { checkPageBreak(5); pdf.text(line, margin, y); y += 4.5; });
      y += 6;
    }

    checkPageBreak(15);
    pdf.setFontSize(8); pdf.setTextColor(120); pdf.setFont("helvetica", "bold");
    pdf.text("TERMS & CONDITIONS", margin, y); y += 5;
    pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100);
    pdf.splitTextToSize(quote.terms, contentWidth).forEach((line: string) => { checkPageBreak(4); pdf.text(line, margin, y); y += 3.8; });
    y += 6;

    checkPageBreak(8);
    pdf.setFontSize(9); pdf.setTextColor(120);
    const validDate = new Date(quote.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    pdf.text(`This quote is valid until ${validDate}`, pageWidth / 2, y, { align: "center" });

    pdf.save(`quote-${lead.customer_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--surface-3)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Lead not found</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  if (showPreview && quote) {
    return (
      <div className="min-h-screen pb-8 page-enter">
        <div className="sticky top-0 z-40 header-texture border-b border-[var(--border)]">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setShowPreview(false)} className="p-2 -ml-2 rounded-lg hover:bg-[var(--surface-2)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--text-secondary)]">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-[var(--text-primary)] flex-1 mono tracking-wide uppercase">Quote Preview</h1>
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
      <div className="sticky top-0 z-40 header-texture border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-lg hover:bg-[var(--surface-2)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--text-secondary)]">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{lead.customer_name}</h1>
          </div>
          <button onClick={() => setShowStatusSelector(true)}>
            <StatusBadge status={lead.status} size="md" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Customer info */}
        <div className="card">
          <h2 className="label mb-3">Customer Details</h2>
          {lead.customer_phone && (
            <a href={`tel:${lead.customer_phone}`} className="flex items-center gap-3 py-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
              <span className="mono text-sm">{lead.customer_phone}</span>
            </a>
          )}
          {lead.customer_address && (
            <p className="flex items-center gap-3 py-2 text-[var(--text-secondary)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[var(--text-tertiary)]"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              <span className="text-sm">{lead.customer_address}</span>
            </p>
          )}
          <p className="text-xs text-[var(--text-tertiary)] mono mt-2">
            {new Date(lead.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {lead.brain_dump && (<div className="card"><h2 className="label mb-2">Notes</h2><p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{lead.brain_dump}</p></div>)}
        {lead.audio_transcription && (<div className="card"><h2 className="label mb-2">Voice Memo</h2><p className="text-[var(--text-secondary)] text-sm leading-relaxed">{lead.audio_transcription}</p></div>)}

        {lead.photo_urls && lead.photo_urls.length > 0 && (
          <div className="card">
            <h2 className="label mb-3">Site Photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {lead.photo_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Site photo ${i + 1}`} className="w-full h-36 object-cover rounded-lg bg-[var(--surface-2)] group-hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {lead.photo_analysis && (<div className="card"><h2 className="label mb-2">AI Photo Analysis</h2><p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{lead.photo_analysis}</p></div>)}

        {/* Schematics */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="label mb-0">Schematics</h2>
            <span className="text-[10px] mono text-[var(--text-tertiary)]">{schematics.length} drawing{schematics.length !== 1 ? "s" : ""}</span>
          </div>
          {schematics.length > 0 && (
            <div className="space-y-2 mb-3">
              {schematics.map((s) => (
                <SchematicCard key={s.id} schematic={s} onEdit={() => router.push(`/leads/${leadId}/schematic`)} onDelete={async () => {
                  if (!confirm("Delete this schematic?")) return;
                  try { await fetch(`/api/schematics?id=${s.id}`, { method: "DELETE" }); setSchematics((prev) => prev.filter((x) => x.id !== s.id)); showToast("Schematic deleted", "success"); } catch { showToast("Failed to delete", "error"); }
                }} />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => router.push(`/leads/${leadId}/schematic`)} className="btn btn-secondary flex-1 text-sm">
              <div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>New Schematic</div>
            </button>
            {lead.photo_urls && lead.photo_urls.length > 0 && (
              <button onClick={() => router.push(`/leads/${leadId}/schematic?photo=0`)} className="btn btn-secondary flex-1 text-sm">
                <div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>Draw on Photo</div>
              </button>
            )}
          </div>
        </div>

        {/* Cameras */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="label mb-0">Cameras</h2>
            <span className="text-[10px] mono text-[var(--text-tertiary)]">{cameras.length} camera{cameras.length !== 1 ? "s" : ""}</span>
          </div>
          {cameras.length > 0 && (
            <div className="space-y-2 mb-3">
              {cameras.map((cam) => (
                <CameraCard key={cam.id} camera={cam} onEdit={() => handleEditCamera(cam)} onDelete={() => {
                  setConfirmAction({ title: "Delete Camera", message: `Delete ${cam.name}? This cannot be undone.`, confirmLabel: "Delete", onConfirm: () => { setConfirmAction(null); handleDeleteCamera(cam.id); } });
                }} />
              ))}
            </div>
          )}
          {showCameraForm ? (
            <div className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--text-primary)] mono uppercase tracking-wide">{editingCamera ? "Edit Camera" : "Add Camera"}</h3>
                <button onClick={resetCameraForm} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mono">CANCEL</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Name *</label><input value={cameraName} onChange={(e) => setCameraName(e.target.value)} className="input text-sm" placeholder="Front Door" /></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">IP Address *</label><input value={cameraIp} onChange={(e) => setCameraIp(e.target.value)} className="input text-sm mono" placeholder="192.168.1.100" /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Web URL</label><input value={cameraWebUrl} onChange={(e) => setCameraWebUrl(e.target.value)} className="input text-sm" placeholder="http://..." /></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Brand</label><input value={cameraBrand} onChange={(e) => setCameraBrand(e.target.value)} className="input text-sm" placeholder="Hikvision" /></div>
              </div>
              <div><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Location Note</label><input value={cameraLocation} onChange={(e) => setCameraLocation(e.target.value)} className="input text-sm" placeholder="Above the front entrance" /></div>
              <button onClick={handleSaveCamera} disabled={savingCamera} className="btn btn-primary w-full text-sm disabled:opacity-50">{savingCamera ? "Saving..." : editingCamera ? "Update Camera" : "Add Camera"}</button>
            </div>
          ) : (
            <button onClick={() => setShowCameraForm(true)} className="btn btn-secondary w-full text-sm">
              <div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>Add Camera</div>
            </button>
          )}
        </div>

        {/* Quote section */}
        {!quote && !editingQuote ? (
          <div className="flex gap-2">
            <button onClick={handleGenerateQuote} disabled={generating} className="btn btn-primary flex-1 shadow-[0_0_25px_-5px_var(--accent)]">
              {generating ? (<div className="flex items-center gap-2 justify-center"><div className="w-4 h-4 border-2 border-[#080b12]/30 border-t-[#080b12] rounded-full animate-spin" /><span>Generating...</span></div>) : (<div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" /><path fillRule="evenodd" d="M9.013 19.9a.75.75 0 01.877-.597 11.319 11.319 0 004.22 0 .75.75 0 11.28 1.473 12.819 12.819 0 01-4.78 0 .75.75 0 01-.597-.876zM9.754 22.344a.75.75 0 01.824-.668 13.682 13.682 0 002.844 0 .75.75 0 11.156 1.492 15.156 15.156 0 01-3.156 0 .75.75 0 01-.668-.824z" clipRule="evenodd" /></svg>AI Quote</div>)}
            </button>
            <button onClick={handleStartManualQuote} className="btn btn-secondary flex-1">
              <div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg>Manual Quote</div>
            </button>
          </div>
        ) : quote && !editingQuote ? (
          <>
            {quote.quote_status && quote.quote_status !== "pending" && (
              <div className={`card flex items-center gap-2 text-sm ${quote.quote_status === "accepted" ? "text-[var(--success)]" : quote.quote_status === "declined" ? "text-[var(--danger)]" : "text-[var(--warning)]"}`}>
                <span className={`w-2 h-2 rounded-full ${quote.quote_status === "accepted" ? "bg-[var(--success)]" : quote.quote_status === "declined" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`} />
                <span className="mono uppercase tracking-wide text-xs font-bold">{quote.quote_status === "sent" ? "Quote Sent" : quote.quote_status === "accepted" ? "Customer Accepted" : quote.quote_status === "declined" ? "Customer Declined" : quote.quote_status}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowPreview(true)} className="btn btn-primary flex-1">Preview</button>
              <button onClick={handleShare} className="btn btn-success flex-1">Send</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportPDF} className="btn btn-secondary flex-1">Export PDF</button>
              <button onClick={() => { setEditingQuote(true); setIsManualCreate(false); setEditedQuote(quote); }} className="btn btn-secondary flex-1">Edit</button>
              <button onClick={() => { setConfirmAction({ title: "Regenerate Quote", message: "This will create a new AI-generated quote and replace the existing one. Continue?", confirmLabel: "Regenerate", onConfirm: () => { setConfirmAction(null); handleGenerateQuote(); } }); }} disabled={generating} className="btn btn-secondary flex-1">{generating ? "..." : "Redo"}</button>
            </div>
            <div className="card"><QuotePreview quote={quote} lead={lead} settings={settings} /></div>
          </>
        ) : null}

        {/* Editable quote */}
        {editingQuote && editedQuote && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="label">{isManualCreate ? "Create Quote" : "Edit Quote"}</h2>
              <button onClick={() => { setEditingQuote(false); setIsManualCreate(false); if (quote) setEditedQuote(quote); }} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mono">CANCEL</button>
            </div>
            <div><label className="label">Scope of Work</label><textarea value={editedQuote.scope_of_work} onChange={(e) => setEditedQuote({ ...editedQuote, scope_of_work: e.target.value })} rows={4} className="textarea text-sm" placeholder="Describe the work to be performed..." /></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Line Items</label>
                <div className="flex gap-2">
                  {settings && settings.pricing.length > 0 && (<button onClick={() => setShowCatalog(!showCatalog)} className="text-xs font-bold text-[var(--success)] hover:text-[var(--success)]/80 mono">+ CATALOG</button>)}
                  <button onClick={addLineItem} className="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] mono">+ ADD</button>
                </div>
              </div>
              {showCatalog && settings && (
                <div className="mb-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-2 max-h-48 overflow-y-auto">
                  {settings.pricing.map((item, i) => (<button key={i} onClick={() => addFromCatalog(item.name, item.price)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--surface-3)] transition-colors text-sm"><span className="text-[var(--text-secondary)]">{item.name}</span><span className="text-[var(--text-tertiary)] mono text-xs">${item.price.toFixed(2)}/{item.unit}</span></button>))}
                </div>
              )}
              <div className="space-y-2">
                {editedQuote.line_items.map((item, i) => (
                  <div key={i} className="bg-[var(--surface-2)] rounded-xl p-3 space-y-2 border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <input value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder="Item description" className="input flex-1 text-sm" />
                      <button onClick={() => removeLineItem(i)} className="p-2 text-[var(--danger)] hover:text-[var(--danger)]/80"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.55 6a.75.75 0 01-1.493-.137l.55-6a.75.75 0 01.793-.66zm2.84 0a.75.75 0 01.793.66l.55 6a.75.75 0 01-1.493.137l-.55-6a.75.75 0 01.7-.797z" clipRule="evenodd" /></svg></button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Qty</label><input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", e.target.value)} className="input text-sm mono" min="0" step="1" /></div>
                      <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Price</label><input type="number" value={item.unit_price} onChange={(e) => updateLineItem(i, "unit_price", e.target.value)} className="input text-sm mono" min="0" step="0.01" /></div>
                      <div className="flex-1"><label className="text-[10px] text-[var(--text-tertiary)] mono uppercase">Total</label><div className="input text-sm mono bg-[var(--surface-3)] text-[var(--text-tertiary)]">${item.total.toFixed(2)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--surface-2)] rounded-xl p-4 space-y-2 border border-[var(--border)]">
              <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Subtotal</span><span className="text-[var(--text-primary)] mono">${editedQuote.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Tax ({settings?.tax_rate || 8.25}%)</span><span className="text-[var(--text-primary)] mono">${editedQuote.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]"><span className="text-[var(--text-primary)]">Total</span><span className="text-[var(--accent)] mono">${editedQuote.total.toFixed(2)}</span></div>
            </div>
            <div><label className="label">Notes</label><textarea value={editedQuote.notes || ""} onChange={(e) => setEditedQuote({ ...editedQuote, notes: e.target.value })} rows={3} className="textarea text-sm" placeholder="Optional notes or recommendations..." /></div>
            <div><label className="label">Terms</label><textarea value={editedQuote.terms} onChange={(e) => setEditedQuote({ ...editedQuote, terms: e.target.value })} rows={4} className="textarea text-sm" /></div>
            <button onClick={handleSaveEditedQuote} disabled={savingQuote} className="btn btn-primary w-full">{savingQuote ? "Saving..." : isManualCreate ? "Create Quote" : "Save Changes"}</button>
          </div>
        )}

        <button onClick={() => setConfirmAction({ title: "Delete Lead", message: `Are you sure you want to delete ${lead.customer_name}? This cannot be undone.`, confirmLabel: "Delete", onConfirm: () => { setConfirmAction(null); handleDeleteLead(); } })} disabled={deleting} className="btn btn-secondary w-full text-[var(--danger)] hover:bg-[var(--danger-dim)] border-[var(--danger)]/20">{deleting ? "Deleting..." : "Delete Lead"}</button>
      </div>

      {showStatusSelector && (<StatusSelector currentStatus={lead.status} onSelect={(status) => { if (status === "closed") { setShowStatusSelector(false); setConfirmAction({ title: "Close Lead", message: "Mark this lead as Closed/Lost? You can change it back later.", confirmLabel: "Close", onConfirm: () => { setConfirmAction(null); handleStatusChange(status); } }); } else { handleStatusChange(status); } }} onClose={() => setShowStatusSelector(false)} />)}
      {confirmAction && (<ConfirmDialog title={confirmAction.title} message={confirmAction.message} confirmLabel={confirmAction.confirmLabel} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />)}
    </div>
  );
}
