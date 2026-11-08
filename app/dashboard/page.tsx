'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DocumentItem } from '@/lib/types';
import {
  FileText,
  Files,
  UserCheck,
  Tag,
  Plus,
  ArrowRight,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const canDeleteDoc = (doc: DocumentItem) => {
    if (isAdmin) return true;
    if (user && (doc.created_by === user.username || doc.user_id === user.id)) return true;
    return false;
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
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

  // Stats calculation from REAL data
  const totalCount = documents.length;
  const myCount = user
    ? documents.filter((d) => d.created_by === user.username || d.user_id === user.id).length
    : 0;
  const uniqueCategories = new Set(
    documents.map((d) => d.category).filter(Boolean)
  ).size;

  const recentDocuments = documents.slice(0, 6);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Overview
            </h1>
            <p className="text-sm text-zinc-500">
              Welcome back, {user?.full_name || user?.username}. Here is your workspace summary.
            </p>
          </div>
          <Link
            href="/upload"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Documents
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <Files className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-zinc-900">
                {totalCount}
              </span>
              <p className="mt-1 text-xs text-zinc-500">Stored in repository</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                My Documents
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-zinc-900">
                {myCount}
              </span>
              <p className="mt-1 text-xs text-zinc-500">Created by you</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Categories
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-zinc-900">
                {uniqueCategories}
              </span>
              <p className="mt-1 text-xs text-zinc-500">Active classification types</p>
            </div>
          </div>
        </div>

        {/* Recent Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-500" />
              <h2 className="text-base font-semibold text-zinc-900">
                Recent Documents
              </h2>
            </div>
            {totalCount > 6 && (
              <Link
                href="/documents"
                className="flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white">
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                <span className="text-xs">Fetching repository documents...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center text-sm text-red-700">
              <p className="font-semibold">Failed to load documents</p>
              <p className="mt-1 text-xs text-red-600">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : documents.length === 0 ? (
            /* Clean Empty State - strictly no dummy data */
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center shadow-subtle">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">
                No documents yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Click Upload to add your first document or diagram.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-subtle hover:bg-zinc-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload Document
              </Link>
            </div>
          ) : (
            /* Real documents grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentDocuments.map((doc) => {
                const isOwnerOrAdmin = canDeleteDoc(doc);
                return (
                  <div
                    key={doc.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card transition-all hover:border-zinc-300 hover:shadow-elevated"
                  >
                    <div>
                      {/* Top Badges */}
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

                    {/* Footer Info & Actions */}
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

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                          <span>View</span>
                        </Link>

                        {isOwnerOrAdmin && (
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
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
      </div>
    </AppShell>
  );
}
