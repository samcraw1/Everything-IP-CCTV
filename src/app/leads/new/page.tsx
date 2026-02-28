"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import PhotoCapture from "@/components/PhotoCapture";

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [brainDump, setBrainDump] = useState("");

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioTranscription, setAudioTranscription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState("");

  const handleAudioRecording = async (blob: Blob) => {
    setAudioBlob(blob);
    setTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      if (data.transcription) {
        setAudioTranscription(data.transcription);
      }
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setTranscribing(false);
    }
  };

  const handleAnalyzePhotos = async () => {
    if (photos.length === 0) return;
    setAnalyzingPhotos(true);

    try {
      const formData = new FormData();
      photos.forEach((p) => formData.append("photos", p));
      const res = await fetch("/api/ai/analyze-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.analysis) {
        setPhotoAnalysis(data.analysis);
      }
    } catch (err) {
      console.error("Photo analysis failed:", err);
    } finally {
      setAnalyzingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a customer name");
      return;
    }

    setSaving(true);

    try {
      // Upload audio to Supabase Storage if we have it
      let audioUrl: string | null = null;
      if (audioBlob) {
        // For now, we skip storage upload and just keep the transcription
        // Audio upload would go through Supabase Storage API
        audioUrl = null;
      }

      // Upload photos to Supabase Storage
      let photoUrls: string[] | null = null;
      if (photos.length > 0) {
        // For now, skip storage upload
        // Photo upload would go through Supabase Storage API
        photoUrls = null;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_address: address.trim(),
          brain_dump: brainDump.trim(),
          audio_url: audioUrl,
          audio_transcription: audioTranscription || null,
          photo_urls: photoUrls,
          photo_analysis: photoAnalysis || null,
        }),
      });

      const lead = await res.json();

      if (res.ok) {
        router.push(`/leads/${lead.id}`);
      } else {
        alert("Failed to save lead: " + (lead.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save lead. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-8 page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-neutral-400">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">New Lead</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Customer info */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Customer Info</h2>

          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="input"
            />
          </div>

          <div>
            <label className="label">Address / Location</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Mansfield, TX"
              className="input"
            />
          </div>
        </div>

        {/* Brain dump */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">What do they need?</h2>
          <p className="text-sm text-neutral-500">
            Type or voice-to-text everything — messy is fine, AI will sort it out
          </p>
          <textarea
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            placeholder="e.g., wants 4 cameras outside his house, two story, worried about backyard, budget around 2K, has existing wiring from old system..."
            rows={5}
            className="textarea"
          />
        </div>

        {/* Audio recording */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Voice Memo</h2>
          <p className="text-sm text-neutral-500">Record a quick voice note about this lead</p>
          <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={transcribing} />
          {audioBlob && !transcribing && !audioTranscription && (
            <p className="text-sm text-green-400">Audio recorded. Transcribing...</p>
          )}
          {transcribing && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              Transcribing audio...
            </div>
          )}
          {audioTranscription && (
            <div>
              <label className="label">Transcription</label>
              <textarea
                value={audioTranscription}
                onChange={(e) => setAudioTranscription(e.target.value)}
                rows={3}
                className="textarea text-sm"
              />
            </div>
          )}
        </div>

        {/* Photo capture */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Site Photos</h2>
          <p className="text-sm text-neutral-500">Take photos of the property, wiring, mount locations</p>
          <PhotoCapture photos={photos} onPhotosChange={setPhotos} disabled={analyzingPhotos} />
          {photos.length > 0 && !photoAnalysis && (
            <button
              onClick={handleAnalyzePhotos}
              disabled={analyzingPhotos}
              className="btn btn-secondary flex items-center gap-2"
            >
              {analyzingPhotos ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-400 rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
                    <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 01.877-.597 11.319 11.319 0 004.22 0 .75.75 0 11.28 1.473 12.819 12.819 0 01-4.78 0 .75.75 0 01-.597-.876zM9.754 22.344a.75.75 0 01.824-.668 13.682 13.682 0 002.844 0 .75.75 0 11.156 1.492 15.156 15.156 0 01-3.156 0 .75.75 0 01-.668-.824z" clipRule="evenodd" />
                  </svg>
                  Analyze with AI
                </>
              )}
            </button>
          )}
          {photoAnalysis && (
            <div>
              <label className="label">AI Analysis</label>
              <textarea
                value={photoAnalysis}
                onChange={(e) => setPhotoAnalysis(e.target.value)}
                rows={4}
                className="textarea text-sm"
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="btn btn-primary btn-lg w-full disabled:opacity-50"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            "Save Lead"
          )}
        </button>
      </div>
    </div>
  );
}
