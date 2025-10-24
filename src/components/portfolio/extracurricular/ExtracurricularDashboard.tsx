import React, { useState, useEffect } from 'react';
import { ExtracurricularItem, ExtracurricularCard } from './ExtracurricularCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

interface ExtracurricularDashboardProps {
  activities: ExtracurricularItem[];
}

type SortOption = 'contribution' | 'hours' | 'impact';
type FilterCategory = 'all' | 'leadership' | 'service' | 'research' | 'athletics' | 'arts' | 'academic' | 'work';
type FilterUse = 'all' | 'centerpiece' | 'supporting' | 'breadth' | 'optional';

export const ExtracurricularDashboard: React.FC<ExtracurricularDashboardProps> = ({ activities }) => {
  const [sortBy, setSortBy] = useState<SortOption>('contribution');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterUse, setFilterUse] = useState<FilterUse>('all');
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(2);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Apply filters
  const filteredActivities = activities.filter(act => {
    if (filterCategory !== 'all' && act.category !== filterCategory) return false;
    if (filterUse !== 'all' && act.recommendedUse !== filterUse) return false;
    return true;
  });

  // Apply sorting
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'contribution':
        return b.scores.portfolioContribution.overall - a.scores.portfolioContribution.overall;
      case 'hours':
        return b.scores.commitment.totalHours - a.scores.commitment.totalHours;
      case 'impact':
        return b.scores.impact.overall - a.scores.impact.overall;
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

  // Keep slide/page indicator in sync
  useEffect(() => {
    const computeTotals = () => {
      setTotalPages(Math.max(1, Math.ceil(sortedActivities.length / perPage)));
      if (carouselApi) {
        const idx = carouselApi.selectedScrollSnap?.() ?? 0;
        setCurrentPage(Math.floor(idx / perPage) + 1);
        setCanPrev(carouselApi.canScrollPrev());
        setCanNext(carouselApi.canScrollNext());
      } else {
        setCurrentPage(1);
        setCanPrev(false);
        setCanNext(sortedActivities.length > perPage);
      }
    };
    computeTotals();
  }, [carouselApi, sortedActivities.length, perPage]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            All Activities Dashboard ({sortedActivities.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Review your complete activity portfolio with strategic insights
          </p>
        </div>
      </div>

      {/* Filters + Centered Navigation */}
      <div className="relative flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="athletics">Athletics</SelectItem>
              <SelectItem value="arts">Arts</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="work">Work</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUse} onValueChange={(v) => setFilterUse(v as FilterUse)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="centerpiece">Centerpiece</SelectItem>
              <SelectItem value="supporting">Supporting</SelectItem>
              <SelectItem value="breadth">Breadth</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>

          {(filterCategory !== 'all' || filterUse !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory('all');
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
      {sortedActivities.length > 0 ? (
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
              {sortedActivities.map((activity) => (
                <CarouselItem key={activity.id} className="pl-4 md:basis-1/2 lg:basis-1/2">
                  <ExtracurricularCard activity={activity} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border bg-muted/20">
          <p className="text-muted-foreground">No activities match your filters</p>
        </div>
      )}
    </div>
  );
};
