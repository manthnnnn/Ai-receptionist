'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { ClinicFAQ } from '@/types';
import { Plus, Trash2, X } from 'lucide-react';

const categoryColors: Record<string, string> = {
  'CONSULTATION FEE': 'accent-border-blue',
  'EMERGENCY': 'accent-border-rose',
  'TIMINGS': 'accent-border-green',
  'PARKING': 'accent-border-amber',
  'INSURANCE': 'accent-border-purple',
  'SERVICES': 'accent-border-cyan',
  'DIRECTIONS': 'accent-border-green',
};

const categoryBadgeColors: Record<string, string> = {
  'CONSULTATION FEE': 'text-primary-600 bg-primary-50',
  'EMERGENCY': 'text-rose-600 bg-rose-50',
  'TIMINGS': 'text-emerald-600 bg-emerald-50',
  'PARKING': 'text-amber-600 bg-amber-50',
  'INSURANCE': 'text-violet-600 bg-violet-50',
  'SERVICES': 'text-cyan-600 bg-cyan-50',
  'DIRECTIONS': 'text-emerald-600 bg-emerald-50',
};

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

  const handleAddFaq = async (e: React.FormEvent) => {
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
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Knowledge Base</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            AI receptionist ground truth — fees, hours, parking, and policies
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2 rounded-apple transition-apple shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* FAQ Cards */}
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className={`bg-white rounded-apple-lg shadow-card card-hover p-5 flex items-start justify-between gap-4 ${
              categoryColors[faq.category] || 'accent-border-blue'
            }`}
          >
            <div className="space-y-2 min-w-0">
              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                categoryBadgeColors[faq.category] || 'text-primary-600 bg-primary-50'
              }`}>
                {faq.category}
              </span>

              <h3 className="text-[13px] font-semibold text-surface-900 leading-snug">{faq.question}</h3>
              <p className="text-xs text-surface-500 leading-relaxed">{faq.answer}</p>
            </div>

            <button
              onClick={() => handleDelete(faq.id)}
              className="text-surface-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-apple flex-shrink-0"
              title="Delete FAQ"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Add FAQ Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-apple-xl shadow-modal overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 text-[15px] tracking-apple">Add FAQ</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-50 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddFaq} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple"
                >
                  <option value="CONSULTATION FEE">Consultation Fee</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="TIMINGS">Timings</option>
                  <option value="PARKING">Parking</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="SERVICES">Services</option>
                  <option value="DIRECTIONS">Directions</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Question</label>
                <input
                  type="text"
                  placeholder="e.g. Do you offer root canal treatment?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300"
                />
              </div>

              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Answer</label>
                <textarea
                  rows={3}
                  placeholder="Provide precise details for the AI..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-apple text-xs font-medium text-surface-500 hover:bg-surface-50 transition-apple"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-5 py-2.5 rounded-apple shadow-sm transition-apple disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Add FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
