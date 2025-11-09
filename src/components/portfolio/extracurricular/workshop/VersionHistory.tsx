/**
 * Version History Component
 *
 * Shows essay revision history with:
 * - Timeline view of all versions
 * - Score improvements at a glance
 * - Quick restore functionality
 * - Detailed comparison view
 */

import React, { useState, useMemo } from 'react';
import type { ExtracurricularItem } from '../ExtracurricularCard';
import {
  getVersions,
  getVersionHistorySummary,
  compareVersions,
  deleteVersion,
  addVersionNote,
  exportVersionHistory,
  type EssayVersion,
  type VersionComparison,
} from './versioningSystem';

interface VersionHistoryProps {
  activity: ExtracurricularItem;
  currentVersionId?: string;
  onRestoreVersion: (version: EssayVersion) => void;
  onClose: () => void;
}

export function VersionHistory({ activity, currentVersionId, onRestoreVersion, onClose }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<EssayVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const versions = useMemo(() => getVersions(activity.id), [activity.id]);
  const summary = useMemo(() => getVersionHistorySummary(activity), [activity]);

  const comparison = useMemo(() => {
    if (!compareMode || !selectedVersion || !compareWithId) return null;
    return compareVersions(activity.id, compareWithId, selectedVersion.id);
  }, [compareMode, selectedVersion, compareWithId, activity.id]);

  const handleSaveNote = (versionId: string) => {
    if (noteText.trim()) {
      addVersionNote(activity.id, versionId, noteText.trim());
      setEditingNoteFor(null);
      setNoteText('');
      // Force re-render
      window.location.reload();
    }
  };

  const handleDelete = (versionId: string) => {
    if (confirm('Delete this version? This cannot be undone.')) {
      deleteVersion(activity.id, versionId);
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null);
      }
      // Force re-render
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = exportVersionHistory(activity.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activity.name.replace(/\s+/g, '_')}_versions_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (versions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Version History</h2>
          <p className="text-gray-600 mb-6">
            No saved versions yet. Analyze your essay to create the first version.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Version History</h2>
              <p className="text-blue-100">{activity.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm text-blue-100">Total Versions</div>
                <div className="text-2xl font-bold">{summary.totalVersions}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm text-blue-100">Current Score</div>
                <div className="text-2xl font-bold">{summary.latestVersion.analysis.nqi}/100</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm text-blue-100">Total Improvement</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {summary.improvement.nqiDelta > 0 && (
                    <span className="text-green-300">+{summary.improvement.nqiDelta.toFixed(1)}</span>
                  )}
                  {summary.improvement.nqiDelta < 0 && (
                    <span className="text-red-300">{summary.improvement.nqiDelta.toFixed(1)}</span>
                  )}
                  {summary.improvement.nqiDelta === 0 && <span>0</span>}
                  {summary.improvement.percentChange !== 0 && (
                    <span className="text-sm text-blue-100">
                      ({summary.improvement.percentChange > 0 ? '+' : ''}{summary.improvement.percentChange.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              compareMode
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {compareMode ? 'Exit Compare' : 'Compare Versions'}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Export History
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!compareMode ? (
            /* Timeline View */
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isSelected = selectedVersion?.id === version.id;
                const isCurrent = version.id === currentVersionId;
                const prevVersion = versions[index + 1];
                const nqiDelta = prevVersion ? version.analysis.nqi - prevVersion.analysis.nqi : 0;

                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Latest
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {version.analysis.nqi}/100
                            </span>
                            {nqiDelta !== 0 && (
                              <span
                                className={`text-sm font-medium ${
                                  nqiDelta > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {nqiDelta > 0 ? '+' : ''}{nqiDelta.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <span className="text-sm text-gray-500">
                            {version.metadata.wordCount} words
                          </span>

                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {version.metadata.engine === 'sophisticated_19_iteration_system'
                              ? 'Full Analysis'
                              : 'Quick Analysis'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedVersion(isSelected ? null : version)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {isSelected ? 'Hide' : 'View'}
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => onRestoreVersion(version)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(version.id)}
                          className="px-2 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Note */}
                    {version.note && !editingNoteFor && (
                      <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="font-medium text-yellow-800">Note: </span>
                        <span className="text-yellow-900">{version.note}</span>
                      </div>
                    )}

                    {/* Edit Note */}
                    {editingNoteFor === version.id ? (
                      <div className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note about this version..."
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNote(version.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNoteFor(null);
                            setNoteText('');
                          }}
                          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      !version.note && (
                        <button
                          onClick={() => {
                            setEditingNoteFor(version.id);
                            setNoteText(version.note || '');
                          }}
                          className="text-xs text-blue-600 hover:underline mb-2"
                        >
                          + Add note
                        </button>
                      )
                    )}

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Essay Text:</h4>
                          <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {version.description}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Category Scores:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {version.analysis.categoryScores.map((cat) => (
                              <div key={cat.name} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                <span className="text-gray-700">{cat.name}</span>
                                <span className="font-medium">{cat.score}/{cat.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {version.analysis.flags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Flags:</h4>
                            <div className="flex flex-wrap gap-1">
                              {version.analysis.flags.map((flag) => (
                                <span key={flag} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  {flag.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compare Mode */
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Compare Versions</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Select a version above, then choose another version to compare with:
                </p>

                {selectedVersion && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Comparing: <span className="text-blue-900">{new Date(selectedVersion.timestamp).toLocaleString()}</span>
                    </p>

                    <select
                      value={compareWithId || ''}
                      onChange={(e) => setCompareWithId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="">Choose version to compare with...</option>
                      {versions.filter(v => v.id !== selectedVersion.id).map(v => (
                        <option key={v.id} value={v.id}>
                          {new Date(v.timestamp).toLocaleString()} - NQI: {v.analysis.nqi}/100
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!selectedVersion && (
                  <p className="text-sm text-blue-600">Select a version above to start comparing</p>
                )}
              </div>

              {/* Comparison Results */}
              {comparison && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">From</h4>
                      <p className="text-sm">{new Date(comparison.from.timestamp).toLocaleString()}</p>
                      <p className="text-2xl font-bold">{comparison.from.analysis.nqi}/100</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">To</h4>
                      <p className="text-sm">{new Date(comparison.to.timestamp).toLocaleString()}</p>
                      <p className="text-2xl font-bold">{comparison.to.analysis.nqi}/100</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Score Change</h4>
                      <span className={`text-xl font-bold ${
                        comparison.improvements.nqi > 0 ? 'text-green-600' :
                        comparison.improvements.nqi < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {comparison.improvements.nqi > 0 ? '+' : ''}{comparison.improvements.nqi.toFixed(1)}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mb-2">Category Changes:</h4>
                    <div className="space-y-1">
                      {comparison.improvements.categories.map(cat => (
                        <div key={cat.name} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-700">{cat.name}</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            cat.direction === 'up' ? 'text-green-600' :
                            cat.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {cat.direction === 'up' && '↑'}
                            {cat.direction === 'down' && '↓'}
                            {cat.direction === 'same' && '→'}
                            {cat.delta > 0 ? '+' : ''}{cat.delta.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Text Changes:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Added: {comparison.textChanges.added} characters</p>
                        <p>Removed: {comparison.textChanges.removed} characters</p>
                        <p>Net Change: {comparison.textChanges.netChange > 0 ? '+' : ''}{comparison.textChanges.netChange} characters</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
