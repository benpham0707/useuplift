/**
 * Test Harness for TeachingUnitCard Component
 *
 * Purpose: Visual testing and iteration on the teaching framework UI
 * - Displays simple and complex test scenarios
 * - Allows toggling between test cases
 * - Shows loading/error states for LLM prompts
 * - Captures reflection answers and completion state
 */

import React, { useState } from 'react';
import { TeachingUnitCard } from '@/components/portfolio/extracurricular/workshop/TeachingUnitCard';
import {
  simpleEntry,
  simpleIssue,
  complexEntry,
  complexIssues,
  edgeCaseNoTeachingExample,
  edgeCaseLongDraft,
} from '@/components/portfolio/extracurricular/workshop/__tests__/TeachingUnitCard.test-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TestScenario = 'simple' | 'complex' | 'edge-no-example' | 'edge-long';

export default function TestTeachingUnit() {
  console.log('[TestTeachingUnit] Component mounting...');
  console.log('[TestTeachingUnit] simpleEntry:', simpleEntry);
  console.log('[TestTeachingUnit] simpleIssue:', simpleIssue);

  const [scenario, setScenario] = useState<TestScenario>('simple');
  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(new Set());
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, Record<string, string>>>({});
  const [completedIssues, setCompletedIssues] = useState<Set<string>>(new Set());

  console.log('[TestTeachingUnit] Current scenario:', scenario);

  // Toggle expansion state
  const handleToggle = (issueId: string) => {
    setExpandedIssueIds(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  // Handle reflection answers
  const handleReflectionAnswersChange = (issueId: string, answers: Record<string, string>) => {
    setReflectionAnswers(prev => ({
      ...prev,
      [issueId]: answers,
    }));
  };

  // Handle mark complete
  const handleMarkComplete = (issueId: string) => {
    setCompletedIssues(prev => new Set([...prev, issueId]));
    console.log(`[TestHarness] Issue ${issueId} marked complete`);
    console.log('Reflection answers:', reflectionAnswers[issueId]);
  };

  // Get current test data
  const getTestData = () => {
    switch (scenario) {
      case 'simple':
        return {
          entry: simpleEntry,
          issues: [simpleIssue],
          description: 'Simple test case: Food bank volunteer with missing metrics',
        };
      case 'complex':
        return {
          entry: complexEntry,
          issues: complexIssues,
          description: 'Complex test case: Robotics team with 4 realistic issues (essay-speak, vague outcomes, passive role, no stakes)',
        };
      case 'edge-no-example':
        return {
          entry: simpleEntry,
          issues: [edgeCaseNoTeachingExample],
          description: 'Edge case: Issue with no teaching example available',
        };
      case 'edge-long':
        return {
          entry: edgeCaseLongDraft,
          issues: [simpleIssue],
          description: 'Edge case: Very long draft text (Climate Action Club)',
        };
    }
  };

  const testData = getTestData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                TeachingUnitCard Test Harness
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Visual testing and iteration on the teaching framework UI
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Test Mode
            </Badge>
          </div>

          {/* Scenario Selector */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Test Scenario:
                </span>
                <Button
                  size="sm"
                  variant={scenario === 'simple' ? 'default' : 'outline'}
                  onClick={() => setScenario('simple')}
                >
                  Simple (1 issue)
                </Button>
                <Button
                  size="sm"
                  variant={scenario === 'complex' ? 'default' : 'outline'}
                  onClick={() => setScenario('complex')}
                >
                  Complex (4 issues)
                </Button>
                <Button
                  size="sm"
                  variant={scenario === 'edge-no-example' ? 'default' : 'outline'}
                  onClick={() => setScenario('edge-no-example')}
                >
                  Edge: No Example
                </Button>
                <Button
                  size="sm"
                  variant={scenario === 'edge-long' ? 'default' : 'outline'}
                  onClick={() => setScenario('edge-long')}
                >
                  Edge: Long Draft
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {testData.description}
              </p>
            </div>
          </Card>

          {/* State Inspector */}
          <Alert>
            <AlertDescription className="text-xs font-mono space-y-1">
              <div><strong>Expanded Issues:</strong> {Array.from(expandedIssueIds).join(', ') || 'none'}</div>
              <div><strong>Completed Issues:</strong> {Array.from(completedIssues).join(', ') || 'none'}</div>
              <div><strong>Reflection Answers:</strong> {Object.keys(reflectionAnswers).length} issue(s) answered</div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Activity Context */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Student's Activity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Title:</span>{' '}
                <span className="text-blue-900 dark:text-blue-100">{testData.entry.title}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Role:</span>{' '}
                <span className="text-blue-900 dark:text-blue-100">{testData.entry.role || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Category:</span>{' '}
                <span className="text-blue-900 dark:text-blue-100">{testData.entry.category}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Time:</span>{' '}
                <span className="text-blue-900 dark:text-blue-100">
                  {testData.entry.hours_per_week ? `${testData.entry.hours_per_week}h/week` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
              <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">Original Draft:</span>
              <p className="text-sm text-blue-900 dark:text-blue-100 mt-1 italic">
                "{testData.entry.description_original}"
              </p>
            </div>
          </div>
        </Card>

        {/* Teaching Units */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Detected Issues ({testData.issues.length})
          </h2>

          {testData.issues.map((issue, idx) => (
            <TeachingUnitCard
              key={issue.id}
              issue={issue}
              entry={testData.entry}
              isExpanded={expandedIssueIds.has(issue.id)}
              onToggle={() => handleToggle(issue.id)}
              onReflectionAnswersChange={(answers) => handleReflectionAnswersChange(issue.id, answers)}
              onMarkComplete={() => handleMarkComplete(issue.id)}
            />
          ))}
        </div>

        {/* Debug Inspector */}
        <Card className="p-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
          <details>
            <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              🔍 Debug: Reflection Answers JSON
            </summary>
            <pre className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-auto max-h-64 p-2 bg-white dark:bg-slate-900 rounded border">
              {JSON.stringify(reflectionAnswers, null, 2)}
            </pre>
          </details>
        </Card>
      </div>
    </div>
  );
}
