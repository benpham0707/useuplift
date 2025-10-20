import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecognitionCard, RecognitionItem } from './RecognitionCard';

interface RecognitionDashboardProps {
  recognitions: RecognitionItem[];
  onViewRecognition: (recognition: RecognitionItem) => void;
}

type SortOption = 'portfolioLift' | 'impressiveness' | 'narrativeFit' | 'recency';
type FilterTier = 'all' | 'national' | 'state' | 'regional' | 'school';
type FilterUse = 'all' | 'flagship' | 'bridge' | 'support' | 'footnote' | 'archive';

export const RecognitionDashboard: React.FC<RecognitionDashboardProps> = ({ recognitions, onViewRecognition }) => {
  const [sortBy, setSortBy] = useState<SortOption>('portfolioLift');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [filterUse, setFilterUse] = useState<FilterUse>('all');

  // Apply filters
  const filteredRecognitions = recognitions.filter(rec => {
    if (filterTier !== 'all' && rec.tier !== filterTier) return false;
    if (filterUse !== 'all' && rec.recommendedUse !== filterUse) return false;
    return true;
  });

  // Apply sorting
  const sortedRecognitions = [...filteredRecognitions].sort((a, b) => {
    switch (sortBy) {
      case 'portfolioLift':
        return b.scores.portfolioLift.overall - a.scores.portfolioLift.overall;
      case 'impressiveness':
        return b.scores.impressiveness.overall - a.scores.impressiveness.overall;
      case 'narrativeFit':
        return b.scores.narrativeFit.overall - a.scores.narrativeFit.overall;
      case 'recency':
        // Parse dates and sort
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/20">
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portfolioLift">Portfolio Lift</SelectItem>
              <SelectItem value="impressiveness">Impressiveness</SelectItem>
              <SelectItem value="narrativeFit">Narrative Fit</SelectItem>
              <SelectItem value="recency">Recency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterTier} onValueChange={(v) => setFilterTier(v as FilterTier)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="national">National</SelectItem>
              <SelectItem value="state">State</SelectItem>
              <SelectItem value="regional">Regional</SelectItem>
              <SelectItem value="school">School</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterUse} onValueChange={(v) => setFilterUse(v as FilterUse)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Uses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Uses</SelectItem>
              <SelectItem value="flagship">Flagship</SelectItem>
              <SelectItem value="bridge">Bridge</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="footnote">Footnote</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filterTier !== 'all' || filterUse !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterTier('all');
              setFilterUse('all');
            }}
            className="ml-auto text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedRecognitions.length} of {recognitions.length} recognitions
      </div>

      {/* Recognition Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedRecognitions.map(recognition => (
          <RecognitionCard 
            key={recognition.id} 
            recognition={recognition}
            onViewAnalysis={() => onViewRecognition(recognition)}
          />
        ))}
      </div>

      {sortedRecognitions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No recognitions match your filters
        </div>
      )}
    </div>
  );
};
