import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(2);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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

  // Determine items per page based on viewport
  useEffect(() => {
    const computePerPage = () => setPerPage(window.innerWidth < 768 ? 1 : 2);
    computePerPage();
    window.addEventListener('resize', computePerPage);
    return () => window.removeEventListener('resize', computePerPage);
  }, []);

  // Keep slide/page indicator in sync with the carousel and data
  useEffect(() => {
    const computeTotals = () => {
      setTotalPages(Math.max(1, Math.ceil(sortedRecognitions.length / perPage)));
      if (carouselApi) {
        const idx = carouselApi.selectedScrollSnap?.() ?? 0;
        setCurrentPage(Math.floor(idx / perPage) + 1);
        setCanPrev(carouselApi.canScrollPrev());
        setCanNext(carouselApi.canScrollNext());
      } else {
        setCurrentPage(1);
        setCanPrev(false);
        setCanNext(sortedRecognitions.length > perPage);
      }
    };

    computeTotals();
  }, [carouselApi, sortedRecognitions.length, perPage]);

  // Update current page on carousel selection events
  useEffect(() => {
    if (!carouselApi) return;
    const updatePage = () => {
      const idx = carouselApi.selectedScrollSnap?.() ?? 0;
      setCurrentPage(Math.floor(idx / perPage) + 1);
      setCanPrev(carouselApi.canScrollPrev());
      setCanNext(carouselApi.canScrollNext());
    };
    carouselApi.on('select', updatePage);
    carouselApi.on('reInit', updatePage);
    updatePage();
    return () => {
      carouselApi.off('select', updatePage);
      carouselApi.off('reInit', updatePage);
    };
  }, [carouselApi, perPage]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            All Recognitions ({sortedRecognitions.length})
          </h3>
          <p className="text-sm text-muted-foreground">Sort and filter to prioritize which recognitions to feature in your applications</p>
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

      {/* Filters + Centered Navigation */}
      <div className="relative flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
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
        {/* Centered nav group */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          <Button
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => carouselApi?.scrollPrev()}
          >
            <span className="sr-only">Previous slide</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>
          </Button>
          <div className="text-xs font-medium text-foreground min-w-[92px] text-center">
            Slide {currentPage} of {totalPages}
          </div>
          <Button
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => carouselApi?.scrollNext()}
          >
            <span className="sr-only">Next slide</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 6l6 6-6 6"/></svg>
          </Button>
        </div>
      </div>

      {/* Carousel */}
      {sortedRecognitions.length > 0 ? (
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: perPage,
            }}
            className="w-full"
            setApi={setCarouselApi}
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
          </Carousel>
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border bg-muted/20">
          <p className="text-muted-foreground">No recognitions match your filters</p>
        </div>
      )}
    </div>
  );
};
