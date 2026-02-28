"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, PricingItem } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const updatePricingItem = (index: number, field: keyof PricingItem, value: string | number) => {
    if (!settings) return;
    const pricing = [...settings.pricing];
    const item = { ...pricing[index] };

    if (field === "name" || field === "unit") {
      item[field] = value as string;
    } else {
      item.price = typeof value === "string" ? parseFloat(value) || 0 : value;
    }

    pricing[index] = item;
    setSettings({ ...settings, pricing });
  };

  const addPricingItem = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      pricing: [...settings.pricing, { name: "", price: 0, unit: "each" }],
    });
  };

  const removePricingItem = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      pricing: settings.pricing.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Failed to load settings</p>
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
          <h1 className="text-xl font-bold text-white flex-1">Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn text-sm ${saved ? "btn-success" : "btn-primary"}`}
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Business info */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Business Information</h2>

          <div>
            <label className="label">Business Name</label>
            <input
              type="text"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={settings.business_phone}
              onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={settings.business_email}
              onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={settings.business_address}
              onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
              className="input"
            />
          </div>
        </div>

        {/* Quote defaults */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Quote Defaults</h2>

          <div>
            <label className="label">Tax Rate (%)</label>
            <input
              type="number"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
              className="input"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="label">Quote Validity (days)</label>
            <input
              type="number"
              value={settings.validity_days}
              onChange={(e) => setSettings({ ...settings, validity_days: parseInt(e.target.value) || 30 })}
              className="input"
              min="1"
            />
          </div>

          <div>
            <label className="label">Default Terms</label>
            <textarea
              value={settings.default_terms}
              onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
              rows={8}
              className="textarea text-sm"
            />
          </div>
        </div>

        {/* Pricing table */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Default Pricing</h2>
            <button onClick={addPricingItem} className="text-sm text-blue-400 hover:text-blue-300">
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {settings.pricing.map((item, i) => (
              <div key={i} className="bg-neutral-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={item.name}
                    onChange={(e) => updatePricingItem(i, "name", e.target.value)}
                    placeholder="Item name"
                    className="input flex-1 text-sm"
                  />
                  <button onClick={() => removePricingItem(i)} className="p-2 text-red-400 hover:text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.55 6a.75.75 0 01-1.493-.137l.55-6a.75.75 0 01.793-.66zm2.84 0a.75.75 0 01.793.66l.55 6a.75.75 0 01-1.493.137l-.55-6a.75.75 0 01.7-.797z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500">Price ($)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePricingItem(i, "price", e.target.value)}
                      className="input text-sm"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500">Unit</label>
                    <input
                      value={item.unit}
                      onChange={(e) => updatePricingItem(i, "unit", e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button at bottom */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn btn-lg w-full ${saved ? "btn-success" : "btn-primary"}`}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
