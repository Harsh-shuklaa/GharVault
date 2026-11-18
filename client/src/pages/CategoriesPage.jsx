import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    icon: 'folder',
    color: '#10B981',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    try {
      await api.createCategory(newCat);
      setIsModalOpen(false);
      setNewCat({ name: '', icon: 'folder', color: '#10B981', description: '' });
      loadCategories();
    } catch (err) {
      alert(err.message || 'Error creating category');
    }
  };

  const iconOptions = ['badge', 'account_balance', 'real_estate_agent', 'health_and_safety', 'gavel', 'receipt_long', 'folder', 'security', 'work'];

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Document Categories Directory</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Standardized classifications matching Indian statutory, civil, financial, and succession mandates.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-semibold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all self-start sm:self-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Create Custom Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat._id}
            onClick={() => navigate(`/vault?category=${encodeURIComponent(cat.name)}`)}
            className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-6 shadow-xs hover:border-[#10B981] dark:hover:border-[#3ECF8E] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-xs"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <span className="material-symbols-outlined text-2xl">{cat.icon || 'folder'}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-mono text-xs font-bold">
                  {cat.documentCount || 0} Records
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                {cat.description || 'Pre-configured family asset category'}
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-xs font-semibold text-[#10B981] dark:text-[#3ECF8E]">
              <span>View Encrypted Files</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Custom Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div
            className="w-full max-w-md bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#262626] overflow-hidden transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 dark:bg-[#141414] px-6 py-5 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">create_new_folder</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Custom Category</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. Overseas Assets / Tax Records"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] text-xs font-medium text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCat({ ...newCat, icon })}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        newCat.icon === icon
                          ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] scale-105 shadow-xs'
                          : 'border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  placeholder="e.g. Special assets, trusts, foreign remittances..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] text-xs font-medium text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#262626] text-slate-600 dark:text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold shadow-md shadow-[#3ECF8E]/20 cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
