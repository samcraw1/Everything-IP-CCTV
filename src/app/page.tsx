"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lead, Quote, LeadStatus, STATUS_CONFIG } from "@/types";
import LeadCard from "@/components/LeadCard";

export default function HomePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setFiltering(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const [leadsRes, quotesRes] = await Promise.all([
        fetch(`/api/leads?${params}`),
        fetch("/api/quotes"),
      ]);

      const leadsData = await leadsRes.json();
      const quotesData = await quotesRes.json();

      if (Array.isArray(leadsData)) setLeads(leadsData);
      if (Array.isArray(quotesData)) {
        const quotesMap: Record<string, Quote> = {};
        for (const q of quotesData) {
          if (!quotesMap[q.lead_id] || new Date(q.created_at) > new Date(quotesMap[q.lead_id].created_at)) {
            quotesMap[q.lead_id] = q;
          }
        }
        setQuotes(quotesMap);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const needsFollowUp = (lead: Lead) => {
    if (lead.status !== "quoted") return false;
    const quotedDate = new Date(lead.updated_at);
    const now = new Date();
    const daysDiff = (now.getTime() - quotedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 3;
  };

  const statuses: Array<{ key: string; label: string }> = [
    { key: "all", label: "All" },
    ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
      key,
      label: config.label,
    })),
  ];

  const leadCount = leads.length;

  return (
    <div className="min-h-screen pb-28 page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 header-texture border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
                Everything IP
              </h1>
              <p className="text-[11px] mono text-[var(--accent)] tracking-widest uppercase mt-0.5">
                CCTV Lead Manager
              </p>
            </div>
            <button
              onClick={() => router.push("/settings")}
              className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--border-hover)] transition-colors"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--text-secondary)]">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {statuses.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all mono tracking-wide ${
                  statusFilter === key
                    ? "bg-[var(--accent)] text-[#080b12]"
                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtering indicator */}
      {filtering && !loading && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="h-0.5 w-full bg-[var(--surface-2)] rounded overflow-hidden">
            <div className="h-full w-full shimmer-bar" />
          </div>
        </div>
      )}

      {/* Lead count */}
      {!loading && leads.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-1">
          <p className="text-[11px] mono text-[var(--text-tertiary)] tracking-wider uppercase">
            {leadCount} lead{leadCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Lead list */}
      <div className="max-w-2xl mx-auto px-4 py-2 space-y-2.5">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-[var(--surface-3)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-[var(--text-tertiary)] mt-4 text-sm mono">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[var(--text-tertiary)]">
                <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">No leads yet</h2>
            <p className="text-sm text-[var(--text-secondary)]">Tap below to add your first lead</p>
          </div>
        ) : (
          leads.map((lead, i) => (
            <div key={lead.id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <LeadCard
                lead={lead}
                quoteTotal={quotes[lead.id]?.total ?? null}
                onClick={() => router.push(`/leads/${lead.id}`)}
                needsFollowUp={needsFollowUp(lead)}
              />
            </div>
          ))
        )}
      </div>

      {/* FAB - New Lead button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
        <button
          onClick={() => router.push("/leads/new")}
          className="btn btn-primary btn-lg shadow-[0_0_30px_-5px_var(--accent)] flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Lead
        </button>
      </div>
    </div>
  );
}
