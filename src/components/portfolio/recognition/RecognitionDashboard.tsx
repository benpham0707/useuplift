import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Recognitions ({sortedRecognitions.length})</h3>
          <p className="text-sm text-muted-foreground">Browse 2 at a time with navigation arrows</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portfolioLift">Portfolio Lift</SelectItem>
              <SelectItem value="impressiveness">Impressiveness</SelectItem>
              <SelectItem value="narrativeFit">Narrative Fit</SelectItem>
              <SelectItem value="recency">Recency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/20">
        <Select value={filterTier} onValueChange={(v) => setFilterTier(v as FilterTier)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="regional">Regional</SelectItem>
            <SelectItem value="school">School</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterUse} onValueChange={(v) => setFilterUse(v as FilterUse)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
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

        {(filterTier !== 'all' || filterUse !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterTier('all');
              setFilterUse('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Carousel */}
      {sortedRecognitions.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {sortedRecognitions.map((recognition) => (
              <CarouselItem key={recognition.id} className="pl-4 md:basis-1/2 lg:basis-1/2">
                <RecognitionCard 
                  recognition={recognition}
                  onViewAnalysis={() => onViewRecognition(recognition)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </Carousel>
      ) : (
        <div className="text-center py-12 rounded-lg border bg-muted/20">
          <p className="text-muted-foreground">No recognitions match your filters</p>
        </div>
      )}
    </div>
  );
};
