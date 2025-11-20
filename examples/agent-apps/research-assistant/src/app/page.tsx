/**
 * Research Assistant - Main Page
 */

'use client';

import { useState } from 'react';
import { ResearchForm } from '@/components/ResearchForm';
import { ResearchResults } from '@/components/ResearchResults';
import { ExecutionMonitor } from '@/components/ExecutionMonitor';
import type { ResearchQuery, ResearchResult } from '@/agents/research-agent';

export default function HomePage() {
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const handleResearch = async (query: ResearchQuery) => {
    setIsResearching(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Research failed');
      }

      setResults(data.data);
      setMetrics(data.metrics);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsResearching(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!results) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data: results }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Research Assistant</h1>
          <p className="mt-2 text-gray-600">AI-powered research with citations and export</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ResearchForm onSubmit={handleResearch} isLoading={isResearching} />

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {results && (
              <ResearchResults results={results} onExport={handleExport} />
            )}
          </div>

          <div>
            {isResearching && <ExecutionMonitor />}
            {metrics && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Metrics</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Tokens Used:</dt>
                    <dd className="font-medium">{metrics.tokensUsed.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Cost:</dt>
                    <dd className="font-medium">${metrics.costUsd.toFixed(4)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Duration:</dt>
                    <dd className="font-medium">{(metrics.durationMs / 1000).toFixed(2)}s</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Steps:</dt>
                    <dd className="font-medium">{metrics.steps}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
