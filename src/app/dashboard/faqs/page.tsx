'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { ClinicFAQ } from '@/types';
import { Plus, Trash2, X, HelpCircle, Sparkles } from 'lucide-react';

export default function FAQsPage() {
  const { activeClinicId } = useClinic();
  const [faqs, setFaqs] = useState<ClinicFAQ[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState('CONSULTATION FEE');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFaqs = () => {
    fetch(`/api/faqs?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFaqs(data.faqs || []);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchFaqs();
  }, [activeClinicId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          category,
          question,
          answer,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setQuestion('');
        setAnswer('');
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Clinic Knowledge Base &amp; FAQs</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            AI Receptionist ground truth knowledge on pricing, parking, insurance, and timings
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="gcore-btn-orange font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-gcore-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Add Knowledge Item</span>
        </button>
      </div>

      {/* FAQ Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="gcore-card rounded-apple-xl p-5 flex flex-col justify-between border border-white/10 bg-[#080808]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gcore-badge">
                  {faq.category}
                </span>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                  title="Delete knowledge item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{faq.question}</h3>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                {faq.answer}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>Auto-Injected to Groq Prompt</span>
              <span className="text-orange-300">Live Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add FAQ Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-[15px] tracking-tight">Add Ground Truth Knowledge</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddFAQ} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                >
                  <option value="CONSULTATION FEE">CONSULTATION FEE</option>
                  <option value="TIMINGS">TIMINGS</option>
                  <option value="PARKING">PARKING</option>
                  <option value="INSURANCE">INSURANCE</option>
                  <option value="SERVICES">SERVICES</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="DIRECTIONS">DIRECTIONS</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Caller Question</label>
                <input
                  type="text"
                  placeholder="e.g. Do you accept Bajaj Allianz insurance?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Ground Truth Answer for AI Receptionist</label>
                <textarea
                  placeholder="Accurate answer the AI should speak to callers..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn"
                >
                  {loading ? 'Saving...' : 'Save Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
