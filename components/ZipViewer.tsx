'use client';

import React, { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  Download,
  Loader2,
  Search,
  Folder,
  File,
  ExternalLink,
  ChevronRight,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface ZipViewerProps {
  fileUrl: string;
  title: string;
}

interface ZipEntry {
  name: string;
  dir: boolean;
  size: number;
  date: Date;
  zipObject: JSZip.JSZipObject;
}

export default function ZipViewer({ fileUrl, title }: ZipViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadZip() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch archive: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        const entryList: ZipEntry[] = [];
        zip.forEach((relativePath, file) => {
          entryList.push({
            name: relativePath,
            dir: file.dir,
            // @ts-expect-error JSZip internal size property
            size: file._data ? file._data.uncompressedSize || 0 : 0,
            date: file.date,
            zipObject: file,
          });
        });

        // Sort: directories first, then alphabetical
        entryList.sort((a, b) => {
          if (a.dir && !b.dir) return -1;
          if (!a.dir && b.dir) return 1;
          return a.name.localeCompare(b.name);
        });

        if (!isCancelled) {
          setEntries(entryList);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to inspect ZIP archive';
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadZip();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl]);

  const handleDownloadSingle = async (entry: ZipEntry) => {
    if (entry.dir) return;

    try {
      setDownloadingFile(entry.name);
      const blob = await entry.zipObject.async('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name.split('/').pop() || 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading single file from archive', err);
      alert('Could not download file from archive.');
    } finally {
      setDownloadingFile(null);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const lower = searchQuery.toLowerCase().trim();
    return entries.filter((e) => e.name.toLowerCase().includes(lower));
  }, [entries, searchQuery]);

  const getFileIcon = (fileName: string, isDir: boolean) => {
    if (isDir) {
      return <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />;
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-600 flex-shrink-0" />;
    }
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py'].includes(ext || '')) {
      return <FileCode className="h-4 w-4 text-purple-500 flex-shrink-0" />;
    }
    if (['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-zinc-600 flex-shrink-0" />;
    }
    return <File className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900 mb-2" />
        <span className="text-xs text-zinc-500 font-medium">Extracting ZIP archive index...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">ZIP Archive</p>
              <p className="text-[11px] text-zinc-500">Direct download available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const fileCount = entries.filter((e) => !e.dir).length;
  const dirCount = entries.filter((e) => e.dir).length;

  return (
    <div className="space-y-3">
      {/* Search & Stats Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Archive className="h-4 w-4 text-zinc-700" />
          <span>
            <strong>{fileCount}</strong> file{fileCount !== 1 ? 's' : ''}
            {dirCount > 0 && `, ${dirCount} folder${dirCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search inside archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-8 pr-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="max-h-[500px] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No files found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 text-xs font-mono">
            {filteredEntries.map((entry) => {
              const isDownloading = downloadingFile === entry.name;
              return (
                <li
                  key={entry.name}
                  className="flex items-center justify-between px-3.5 py-2 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    {getFileIcon(entry.name, entry.dir)}
                    <span
                      className={`truncate ${
                        entry.dir ? 'font-semibold text-zinc-800' : 'text-zinc-700'
                      }`}
                      title={entry.name}
                    >
                      {entry.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!entry.dir && (
                      <span className="text-[11px] text-zinc-400">
                        {formatBytes(entry.size)}
                      </span>
                    )}

                    {!entry.dir && (
                      <button
                        onClick={() => handleDownloadSingle(entry)}
                        disabled={isDownloading}
                        title="Download this file"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer Info & Full Download */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pt-1">
        <span>Complete Archive Browser</span>
        <a
          href={fileUrl}
          download
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download Complete Archive (.zip)</span>
        </a>
      </div>
    </div>
  );
}
