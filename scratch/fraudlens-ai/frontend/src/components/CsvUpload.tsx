import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Check,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface CsvUploadProps {
  onBatchScored: () => void;
}

export const CsvUpload: React.FC<CsvUploadProps> = ({ onBatchScored }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const res = await api.uploadCsv(file);
      setResult(res);
      onBatchScored();
    } catch (err: any) {
      setErrorMsg(err.message || 'CSV validation failed.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "transaction_id,account_id,amount,currency,merchant_category,device_id,ip_address,location_country,failed_attempts_last_24h\n" +
      "TXN-SAMPLE-01,ACC-2099,145.50,USD,grocery,DEV-9011,198.51.100.12,US,0\n" +
      "TXN-SAMPLE-02,ACC-2100,2850.00,USD,electronics,DEV-ANOM-77,203.0.113.88,NG,3\n" +
      "TXN-SAMPLE-03,ACC-2101,89.00,USD,fast_food,DEV-9012,198.51.100.14,US,0\n";

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "fraudlens_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPredictions = () => {
    if (!result || !result.preview_records) return;
    const blob = new Blob([JSON.stringify(result.preview_records, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "fraudlens_batch_predictions.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            Batch Transaction Dataset CSV Ingestion
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production schema validation, deduplication, missing value imputation, and pipeline batch scoring.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-850 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center transition">
        <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-200 mb-1">
          Select or Drop Transaction CSV File
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Mandatory fields: <span className="font-mono text-cyan-300">transaction_id, account_id, amount</span>.
          Optional: <span className="font-mono text-slate-300">merchant_category, device_id, ip_address, location_country</span>.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          id="csv-file-input"
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3">
          <label
            htmlFor="csv-file-input"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            {file ? file.name : 'Browse Local Files'}
          </label>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white text-xs flex items-center gap-2 transition active:scale-95"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Validating & Scoring Batch...
                </>
              ) : (
                'Run Batch Inference'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Validation Check Failed</span>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success & Batch Preview */}
      {result && (
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 text-sm font-bold">
              <CheckCircle className="w-4 h-4" />
              Batch Scored Successfully
            </div>
            <button
              onClick={downloadPredictions}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export Predictions JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">TOTAL ROWS</span>
              <span className="font-mono font-bold text-slate-100 text-lg">
                {result.total_rows_received}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">DUPLICATES REMOVED</span>
              <span className="font-mono font-bold text-amber-400 text-lg">
                {result.duplicates_removed}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">PERSISTED TO DB</span>
              <span className="font-mono font-bold text-teal-400 text-lg">
                {result.successfully_scored}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono block">
              Preview Scored Records (First 5):
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-mono text-[10px]">
                    <th className="p-2">TXN ID</th>
                    <th className="p-2">ACCOUNT</th>
                    <th className="p-2 text-right">AMOUNT</th>
                    <th className="p-2 text-center">TRIAGE</th>
                    <th className="p-2 text-center">RISK SCORE</th>
                    <th className="p-2 text-center">UNCERTAINTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {result.preview_records.map((r: any) => (
                    <tr key={r.transaction_id}>
                      <td className="p-2 text-cyan-300">{r.transaction_id}</td>
                      <td className="p-2 text-slate-300">{r.account_id}</td>
                      <td className="p-2 text-right font-bold text-slate-100">${r.amount.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200">
                          {r.triage_category}
                        </span>
                      </td>
                      <td className="p-2 text-center text-teal-400 font-bold">{r.risk_score.toFixed(1)}</td>
                      <td className="p-2 text-center text-slate-400">{r.uncertainty_indicator.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
