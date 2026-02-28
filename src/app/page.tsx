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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

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
    }
  }, [statusFilter, searchQuery]);

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

  return (
    <div className="min-h-screen pb-24 page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Everything IP CCTV</h1>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-neutral-400">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input mb-3"
          />

          {/* Status filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {statuses.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead list */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-neutral-500 mt-3">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-white mb-2">No leads yet</h2>
            <p className="text-neutral-500 mb-6">Tap the button below to add your first lead</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              quoteTotal={quotes[lead.id]?.total ?? null}
              onClick={() => router.push(`/leads/${lead.id}`)}
              needsFollowUp={needsFollowUp(lead)}
            />
          ))
        )}
      </div>

      {/* FAB - New Lead button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
        <button
          onClick={() => router.push("/leads/new")}
          className="btn btn-primary btn-lg shadow-xl shadow-blue-500/25 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Lead
        </button>
      </div>
    </div>
  );
}
