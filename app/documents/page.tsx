'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DocumentItem } from '@/lib/types';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
  Loader2,
  X,
  FileBox,
} from 'lucide-react';

const CATEGORIES = ['All', 'Diagram', 'Document', 'Image', 'PDF', 'Excel', 'Archive', 'Other'] as const;

function DocumentsContent() {
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update query if URL param changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const fetchDocuments = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setDocuments(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const canDeleteDoc = (doc: DocumentItem) => {
    if (isAdmin) return true;
    if (user && (doc.created_by === user.username || doc.user_id === user.id)) return true;
    return false;
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error: delError } = await supabase.from('documents').delete().eq('id', id);

      if (delError) {
        throw new Error(delError.message);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Derive unique types from existing documents for the filter dropdown
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((d) => {
      if (d.type && d.type.trim()) {
        types.add(d.type.trim());
      }
    });
    return Array.from(types).sort();
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search by title
      const matchesSearch =
        !searchQuery.trim() ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

      // Filter by category
      const matchesCategory =
        selectedCategory === 'All' || doc.category === selectedCategory;

      // Filter by type
      const matchesType =
        selectedType === 'All' || doc.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [documents, searchQuery, selectedCategory, selectedType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedType('All');
  };

  const isFiltered = searchQuery !== '' || selectedCategory !== 'All' || selectedType !== 'All';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Documents
          </h1>
          <p className="text-sm text-zinc-500">
            Browse, search, and manage all documents and diagrams in your workspace.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-subtle sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 hidden lg:inline">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 hidden lg:inline">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="All">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters button */}
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
            <span className="text-xs">Loading documents...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p className="font-semibold">Unable to load documents</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : documents.length === 0 ? (
        /* Empty Database State - STRICTLY NO DUMMY DATA */
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center shadow-subtle">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            No documents yet. Click Upload to add your first document.
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Your repository is completely empty. Upload diagrams, specifications, or documents to begin.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-subtle hover:bg-zinc-800 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Document
          </Link>
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Filter returned 0 results */
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
          <FileBox className="h-8 w-8 text-zinc-300 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-800">
            No documents match your filters
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Try adjusting your search query or category filter.
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Documents Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const isOwnerOrAdmin = canDeleteDoc(doc);
            return (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-all hover:border-zinc-300 hover:shadow-elevated"
              >
                <div>
                  {/* Category & Type badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                      {doc.category || 'Uncategorized'}
                    </span>
                    {doc.type && (
                      <span className="truncate text-[10px] font-medium text-zinc-400">
                        {doc.type}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="line-clamp-1 text-base font-semibold text-zinc-900">
                    {doc.title}
                  </h3>

                  {/* Summary (2 lines) */}
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500 leading-relaxed">
                    {doc.summary || doc.content || 'No summary provided.'}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(doc.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className="truncate max-w-[120px]">
                      By {doc.created_by || 'Unknown'}
                    </span>
                  </div>

                  {/* Buttons: View + Delete */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      <span>View</span>
                    </Link>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        disabled={deletingId === doc.id}
                        title="Delete document"
                        className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-2 text-red-600 transition-colors hover:bg-red-100/70 disabled:opacity-50"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }>
        <DocumentsContent />
      </Suspense>
    </AppShell>
  );
}
