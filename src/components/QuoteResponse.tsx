"use client";

import { useState } from "react";

interface QuoteResponseProps {
  quoteId: string;
  initialStatus: string;
  responseDate?: string | null;
}

export default function QuoteResponse({ quoteId, initialStatus, responseDate }: QuoteResponseProps) {
  const [status, setStatus] = useState(initialStatus || "pending");
  const [submitting, setSubmitting] = useState(false);
  const [respondedAt, setRespondedAt] = useState(responseDate);

  const handleRespond = async (response: "accepted" | "declined") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quote/${quoteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        setStatus(response);
        setRespondedAt(new Date().toISOString());
      }
    } catch {
      // Silent fail — the customer can try again
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (status === "accepted") {
    return (
      <div className="mt-8 rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-green-800">Quote Accepted</h3>
        {respondedAt && (
          <p className="text-sm text-green-600 mt-1">on {formatDate(respondedAt)}</p>
        )}
        <p className="text-sm text-green-700 mt-3">We&apos;ll be in touch to schedule your installation.</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700">Quote Declined</h3>
        {respondedAt && (
          <p className="text-sm text-gray-500 mt-1">on {formatDate(respondedAt)}</p>
        )}
        <p className="text-sm text-gray-600 mt-3">Thank you for considering us. Please reach out if you change your mind.</p>
      </div>
    );
  }

  // Pending or sent — show accept/decline buttons
  return (
    <div className="mt-8 space-y-3">
      <p className="text-center text-sm text-gray-500">Ready to move forward?</p>
      <div className="flex gap-3">
        <button
          onClick={() => handleRespond("accepted")}
          disabled={submitting}
          className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "..." : "Accept Quote"}
        </button>
        <button
          onClick={() => handleRespond("declined")}
          disabled={submitting}
          className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
