"use client";

import { Quote, Lead, Settings } from "@/types";

interface QuotePreviewProps {
  quote: Quote;
  lead: Lead;
  settings: Settings | null;
  isPublic?: boolean;
}

export default function QuotePreview({ quote, lead, settings, isPublic = false }: QuotePreviewProps) {
  const businessName = settings?.business_name || "Everything IP CCTV";
  const businessPhone = settings?.business_phone || "";
  const businessEmail = settings?.business_email || "";
  const businessAddress = settings?.business_address || "";

  const validDate = new Date(quote.valid_until).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isPublic) {
    return (
      <div className="quote-page max-w-3xl mx-auto">
        <div className="border-b border-gray-200 pb-6 mb-6">
          {settings?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={businessName} className="h-16 mb-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
          <div className="mt-2 text-sm space-y-0.5 text-gray-600">
            {businessPhone && <p>{businessPhone}</p>}
            {businessEmail && <p>{businessEmail}</p>}
            {businessAddress && <p>{businessAddress}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quote</h2>
          <p className="text-sm text-gray-500">
            {new Date(quote.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="rounded-xl p-4 mb-6 bg-gray-50">
          <h3 className="text-sm font-medium mb-2 text-gray-500">Prepared for</h3>
          <p className="font-semibold text-gray-900">{lead.customer_name}</p>
          {lead.customer_address && <p className="text-sm mt-1 text-gray-600">{lead.customer_address}</p>}
          {lead.customer_phone && <p className="text-sm text-gray-600">{lead.customer_phone}</p>}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2 text-gray-500">Scope of Work</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{quote.scope_of_work}</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-500">Item</th>
                <th className="text-center py-3 font-medium text-gray-500">Qty</th>
                <th className="text-right py-3 font-medium text-gray-500">Unit Price</th>
                <th className="text-right py-3 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.line_items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">{item.description}</td>
                  <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl p-4 mb-6 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="text-gray-900">${quote.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Tax</span><span className="text-gray-900">${quote.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 text-gray-900"><span>Total</span><span>${quote.total.toFixed(2)}</span></div>
          </div>
        </div>

        {quote.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 text-gray-500">Notes & Recommendations</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{quote.notes}</p>
          </div>
        )}

        <div className="rounded-xl p-4 mb-6 bg-gray-50">
          <h3 className="text-sm font-medium mb-2 text-gray-500">Terms & Conditions</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-600">{quote.terms}</p>
        </div>

        <div className="text-center">
          <p className="text-sm mb-4 text-gray-500">This quote is valid until {validDate}</p>
          {businessPhone && (
            <a href={`tel:${businessPhone}`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
              Call to Book
            </a>
          )}
        </div>
      </div>
    );
  }

  // Internal dark theme
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-4 mb-4">
        {settings?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo_url} alt={businessName} className="h-12 mb-3" />
        )}
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{businessName}</h1>
        <div className="mt-1.5 text-xs space-y-0.5 text-[var(--text-tertiary)] mono">
          {businessPhone && <p>{businessPhone}</p>}
          {businessEmail && <p>{businessEmail}</p>}
          {businessAddress && <p>{businessAddress}</p>}
        </div>
      </div>

      {/* Quote title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[var(--text-primary)] mono tracking-wider uppercase">Quote</h2>
        <p className="text-xs text-[var(--text-tertiary)] mono">
          {new Date(quote.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Customer info */}
      <div className="rounded-xl p-4 mb-5 bg-[var(--surface-2)] border border-[var(--border)]">
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--text-tertiary)] mono">Prepared for</h3>
        <p className="font-bold text-[var(--text-primary)]">{lead.customer_name}</p>
        {lead.customer_address && <p className="text-sm mt-1 text-[var(--text-secondary)]">{lead.customer_address}</p>}
        {lead.customer_phone && <p className="text-sm text-[var(--text-secondary)] mono">{lead.customer_phone}</p>}
      </div>

      {/* Scope of work */}
      <div className="mb-5">
        <h3 className="label mb-2">Scope of Work</h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">{quote.scope_of_work}</p>
      </div>

      {/* Line items table */}
      <div className="mb-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mono">Item</th>
              <th className="text-center py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mono">Qty</th>
              <th className="text-right py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mono">Price</th>
              <th className="text-right py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mono">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.line_items.map((item, i) => (
              <tr key={i} className="border-b border-[var(--border)]/50">
                <td className="py-2.5 text-[var(--text-secondary)]">{item.description}</td>
                <td className="py-2.5 text-center text-[var(--text-secondary)] mono">{item.quantity}</td>
                <td className="py-2.5 text-right text-[var(--text-secondary)] mono">${item.unit_price.toFixed(2)}</td>
                <td className="py-2.5 text-right font-semibold text-[var(--text-primary)] mono">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="rounded-xl p-4 mb-5 bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Subtotal</span>
            <span className="text-[var(--text-primary)] mono">${quote.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Tax</span>
            <span className="text-[var(--text-primary)] mono">${quote.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--text-primary)]">Total</span>
            <span className="text-[var(--accent)] mono">${quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="mb-5">
          <h3 className="label mb-2">Notes</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">{quote.notes}</p>
        </div>
      )}

      {/* Terms */}
      <div className="rounded-xl p-4 mb-5 bg-[var(--surface-2)] border border-[var(--border)]">
        <h3 className="label mb-2">Terms & Conditions</h3>
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-[var(--text-tertiary)]">{quote.terms}</p>
      </div>

      {/* Validity */}
      <div className="text-center">
        <p className="text-xs text-[var(--text-tertiary)] mono">Valid until {validDate}</p>
      </div>
    </div>
  );
}
