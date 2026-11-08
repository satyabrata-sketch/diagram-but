'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Table,
  Search,
  ExternalLink,
} from 'lucide-react';

interface ExcelViewerProps {
  fileUrl: string;
  title: string;
}

export default function ExcelViewer({ fileUrl, title }: ExcelViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<Array<Array<string | number | boolean | null>>>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function loadExcel() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download spreadsheet: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });

        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('Spreadsheet has no readable sheets.');
        }

        if (!isCancelled) {
          setWorkbook(wb);
          setSheetNames(wb.SheetNames);
          const firstSheet = wb.SheetNames[0];
          setActiveSheet(firstSheet);
          loadSheetData(wb, firstSheet);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Unable to preview spreadsheet';
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadExcel();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl]);

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) {
      setSheetData([]);
      return;
    }

    // Convert sheet to 2D array
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as Array<Array<string | number | boolean | null>>;

    setSheetData(rawData || []);
  };

  const handleSelectSheet = (sheetName: string) => {
    setActiveSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
    }
  };

  // Filter rows based on search text
  const filteredRows = React.useMemo(() => {
    if (!filterText.trim()) return sheetData;
    const lower = filterText.toLowerCase().trim();

    return sheetData.filter((row, idx) => {
      // Always include header row (index 0)
      if (idx === 0) return true;
      return row.some((cell) =>
        String(cell ?? '')
          .toLowerCase()
          .includes(lower)
      );
    });
  }, [sheetData, filterText]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
        <span className="text-xs text-zinc-500 font-medium">Parsing Excel sheets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">Excel Spreadsheet</p>
              <p className="text-[11px] text-zinc-500">
                Direct view or download available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open</span>
            </a>
            <a
              href={fileUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const headerRow = filteredRows[0] || [];
  const bodyRows = filteredRows.slice(1);

  return (
    <div className="space-y-3">
      {/* Top Toolbar: Sheet tabs and search */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Sheet Tabs */}
        {sheetNames.length > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            {sheetNames.map((sheet) => (
              <button
                key={sheet}
                onClick={() => handleSelectSheet(sheet)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSheet === sheet
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {sheet}
              </button>
            ))}
          </div>
        )}

        {/* Search inside spreadsheet */}
        <div className="relative flex-1 max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search within sheet..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-8 pr-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Spreadsheet Table Preview */}
      <div className="max-h-[500px] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            Sheet is empty.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs font-mono">
            {/* Header */}
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-100/90 backdrop-blur-xs font-semibold text-zinc-700">
              <tr>
                <th className="w-10 border-r border-zinc-200 bg-zinc-200/60 px-2 py-1.5 text-center text-[10px] text-zinc-500 select-none">
                  #
                </th>
                {headerRow.map((col, idx) => (
                  <th
                    key={idx}
                    className="border-r border-zinc-200 px-3 py-1.5 text-zinc-800 whitespace-nowrap"
                  >
                    {String(col ?? '') || `Col ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Body */}
            <tbody className="divide-y divide-zinc-100">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="border-r border-zinc-200 bg-zinc-50 px-2 py-1.5 text-center text-[10px] text-zinc-400 select-none">
                    {rIdx + 2}
                  </td>
                  {headerRow.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="border-r border-zinc-100 px-3 py-1.5 text-zinc-700 whitespace-nowrap"
                    >
                      {String(row[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info & Direct Download */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pt-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>
            Sheet: <strong>{activeSheet}</strong> &bull; {sheetData.length} row(s)
          </span>
        </div>
        <a
          href={fileUrl}
          download
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download Spreadsheet</span>
        </a>
      </div>
    </div>
  );
}
