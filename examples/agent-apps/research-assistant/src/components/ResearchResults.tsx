/**
 * Research Results Component
 */

'use client';

import type { ResearchResult } from '@/agents/research-agent';

interface ResearchResultsProps {
  results: ResearchResult;
  onExport: (format: string) => void;
}

export function ResearchResults({ results, onExport }: ResearchResultsProps) {
  return (
    <div className="mt-6 bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{results.topic}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('pdf')}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            PDF
          </button>
          <button
            onClick={() => onExport('docx')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            DOCX
          </button>
          <button
            onClick={() => onExport('markdown')}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Markdown
          </button>
          <button
            onClick={() => onExport('html')}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            HTML
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <p className="text-gray-700">{results.summary}</p>
      </div>

      <div className="space-y-6">
        {results.sections.map((section, index) => (
          <div key={index} className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
            <p className="text-gray-700 mb-2">{section.content}</p>
            {section.sources.length > 0 && (
              <div className="text-sm text-gray-500">
                Sources: {section.sources.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {results.citations.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Citations</h3>
          <ol className="space-y-2 list-decimal list-inside">
            {results.citations.map((citation) => (
              <li key={citation.id} className="text-sm text-gray-700">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {citation.title}
                </a>
                {citation.snippet && (
                  <p className="ml-6 mt-1 text-gray-600">{citation.snippet}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Generated at: {new Date(results.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
