/**
 * Research Form Component
 */

'use client';

import { useState } from 'react';
import type { ResearchQuery } from '@/agents/research-agent';

interface ResearchFormProps {
  onSubmit: (query: ResearchQuery) => void;
  isLoading: boolean;
}

export function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'basic' | 'intermediate' | 'comprehensive'>('intermediate');
  const [sources, setSources] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onSubmit({
      topic: topic.trim(),
      depth,
      sources,
      includeImages: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
            Research Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to research..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="depth" className="block text-sm font-medium text-gray-700">
            Research Depth
          </label>
          <select
            id="depth"
            value={depth}
            onChange={(e) => setDepth(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            disabled={isLoading}
          >
            <option value="basic">Basic (3 sources)</option>
            <option value="intermediate">Intermediate (5 sources)</option>
            <option value="comprehensive">Comprehensive (10 sources)</option>
          </select>
        </div>

        <div>
          <label htmlFor="sources" className="block text-sm font-medium text-gray-700">
            Number of Sources: {sources}
          </label>
          <input
            type="range"
            id="sources"
            min="1"
            max="20"
            value={sources}
            onChange={(e) => setSources(parseInt(e.target.value))}
            className="mt-1 block w-full"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Researching...' : 'Start Research'}
        </button>
      </div>
    </form>
  );
}
