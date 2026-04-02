"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, Zap, CreditCard, ChevronRight, ChevronLeft,
  Check, Upload, Plus, X,
} from "lucide-react";
import StripeConnectButton from "@/components/StripeConnectButton";

const STEPS = [
  { id: 1, label: "Storefront",   icon: Store },
  { id: 2, label: "Technical",    icon: Zap },
  { id: 3, label: "Monetization", icon: CreditCard },
];

const CATEGORIES = [
  "Developer", "Creative", "Enterprise", "Research",
  "Security", "Personal", "Sales", "Marketing",
];

const PRICING_MODELS = [
  { id: "one_time",     label: "One-Time Purchase",    desc: "Buyer gets lifetime access." },
  { id: "subscription", label: "Monthly Subscription", desc: "Recurring monthly charge." },
  { id: "pay_per_run",  label: "Pay-Per-Run",          desc: "Buyers spend credits per execution." },
];

const input =
  "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:outline-none transition-colors rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25";

export default function ListAgentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pricingModel, setPricingModel] = useState("subscription");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", tagline: "", category: "", description: "",
    required_inputs: "", demo_url: "",
    endpoint_url: "", auth_token: "", custom_headers: "", webhook_url: "", avg_run_time: "Under 5 seconds",
    price_usd: "", credits_per_run: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline,
          category: form.category,
          tags,
          description: form.description,
          required_inputs: form.required_inputs,
          demo_url: form.demo_url,
          endpoint_url: form.endpoint_url,
          auth_token: form.auth_token,
          custom_headers: form.custom_headers ? JSON.parse(form.custom_headers) : null,
          webhook_url: form.webhook_url,
          avg_run_time: form.avg_run_time,
          pricing_model: pricingModel,
          price_usd: form.price_usd ? parseFloat(form.price_usd) : null,
          credits_per_run: form.credits_per_run ? parseInt(form.credits_per_run) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return <SuccessScreen onDashboard={() => router.push("/dashboard")} />;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">List Your Agent</h1>
        <p className="text-white/40 text-sm">Deploy your agent on the Agentic marketplace in 3 steps.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${done ? "bg-purple-600 border-purple-600" : active ? "bg-white/10 border-purple-500" : "bg-white/5 border-white/10"}`}>
                  {done ? <Check size={15} /> : <Icon size={15} className={active ? "text-purple-400" : "text-white/30"} />}
                </div>
                <span className={`text-[11px] whitespace-nowrap ${active ? "text-white" : "text-white/30"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-4 transition-colors ${done ? "bg-purple-600" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Storefront */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Field label="Agent Name" hint="Keep it short and memorable">
            <input className={input} placeholder="e.g. ScrapeBot" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Tagline" hint="One sentence — what does it do?">
            <input className={input} placeholder="e.g. LinkedIn profiles to CSV in seconds" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => set("category", c)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.category === c ? "border-purple-500 text-white bg-purple-500/10" : "border-white/10 text-white/50 hover:border-purple-500/50 hover:text-white"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tags" hint="Press Enter to add">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs px-2.5 py-1 rounded-full text-white/70">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}><X size={11} /></button>
                </span>
              ))}
            </div>
            <input
              className={input}
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
          </Field>
          <Field label="Description" hint="What problem does it solve? Who is it for?">
            <textarea className={`${input} resize-none h-28`} placeholder="Describe your agent in detail..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Required Inputs" hint="What does the buyer need to provide?">
            <textarea className={`${input} resize-none h-20`} placeholder="e.g. Target company URL, OpenAI API key" value={form.required_inputs} onChange={(e) => set("required_inputs", e.target.value)} />
          </Field>
          <Field label="Demo Assets" hint="Loom/YouTube link required for approval">
            <input className={input} placeholder="https://loom.com/share/..." value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} />
            <button className="mt-2 flex items-center gap-2 text-xs text-white/40 hover:text-white border border-dashed border-white/10 hover:border-white/30 rounded-lg px-4 py-3 transition-colors w-full justify-center">
              <Upload size={14} /> Upload screenshots
            </button>
          </Field>
        </div>
      )}

      {/* Step 2 — Technical */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-sm text-white/50 leading-relaxed">
            When a buyer hits <span className="text-white/80 font-medium">Execute</span>, Agentic POSTs to your endpoint with the buyer's inputs as JSON.
          </div>
          <Field label="Endpoint URL" hint="Where Agentic sends the execution payload">
            <input className={input} placeholder="https://your-server.com/api/run" value={form.endpoint_url} onChange={(e) => set("endpoint_url", e.target.value)} />
          </Field>
          <Field label="Auth Token / API Key" hint="Used in Authorization header — never shown to buyers">
            <input className={`${input} font-mono`} type="password" placeholder="sk-..." value={form.auth_token} onChange={(e) => set("auth_token", e.target.value)} />
          </Field>
          <Field label="Custom Headers" hint="Optional">
            <textarea className={`${input} resize-none h-20 font-mono text-xs`} placeholder={'{\n  "X-Custom-Header": "value"\n}'} value={form.custom_headers} onChange={(e) => set("custom_headers", e.target.value)} />
          </Field>
          <Field label="Webhook URL" hint="Optional — Agentic POSTs here when async job completes">
            <input className={input} placeholder="https://your-server.com/webhooks/agentic" value={form.webhook_url} onChange={(e) => set("webhook_url", e.target.value)} />
          </Field>
          <Field label="Average Run Time">
            <select className={input} value={form.avg_run_time} onChange={(e) => set("avg_run_time", e.target.value)}>
              <option>Under 5 seconds</option>
              <option>5–30 seconds</option>
              <option>30 seconds – 5 minutes</option>
              <option>5+ minutes (async)</option>
            </select>
          </Field>
        </div>
      )}

      {/* Step 3 — Monetization */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-[#111118] border border-white/5 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-0.5">Connect Your Bank Account</p>
              <p className="text-xs text-white/40">Required before listing. Stripe handles KYC and payouts.</p>
            </div>
            <StripeConnectButton />
          </div>
          <Field label="Pricing Model">
            <div className="flex flex-col gap-2">
              {PRICING_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPricingModel(m.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${pricingModel === m.id ? "border-purple-500/50 bg-purple-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${pricingModel === m.id ? "border-purple-500" : "border-white/20"}`}>
                    {pricingModel === m.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Field>
          {pricingModel !== "pay_per_run" && (
            <Field label={pricingModel === "subscription" ? "Monthly Price (USD)" : "One-Time Price (USD)"}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                <input className={`${input} pl-8`} type="number" placeholder="29" min="1" value={form.price_usd} onChange={(e) => set("price_usd", e.target.value)} />
              </div>
            </Field>
          )}
          {pricingModel === "pay_per_run" && (
            <Field label="Credits Per Run" hint="1 credit = $0.01">
              <div className="relative">
                <input className={`${input} pr-20`} type="number" placeholder="10" min="1" value={form.credits_per_run} onChange={(e) => set("credits_per_run", e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">credits</span>
              </div>
            </Field>
          )}
          <Field label="Revenue Share">
            <div className="bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3 text-sm text-white/50">
              Agentic takes a <span className="text-white/80 font-medium">15% platform fee</span>. You keep 85%.
            </div>
          </Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white disabled:opacity-0 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            {loading ? "Submitting..." : "Submit for Review"} <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-medium text-white">{label}</label>
        {hint && <span className="text-xs text-white/30">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SuccessScreen({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <div className="w-14 h-14 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-5">
        <Check size={24} className="text-purple-400" />
      </div>
      <h2 className="text-xl font-bold mb-2">Submitted for Review</h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        Your agent is under review. We'll notify you within 24–48 hours.
      </p>
      <button
        onClick={onDashboard}
        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        Back to Dashboard →
      </button>
    </div>
  );
}
