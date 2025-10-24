import React, { useState, useMemo } from 'react';
import { ExtracurricularItem, ExtracurricularCard } from './ExtracurricularCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExtracurricularDashboardProps {
  activities: ExtracurricularItem[];
}

export const ExtracurricularDashboard: React.FC<ExtracurricularDashboardProps> = ({ activities }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [useFilter, setUseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('contribution');
  const [currentPage, setCurrentPage] = useState(0);

  const cardsPerPage = 2;

  // Filter and sort activities
  const filteredAndSorted = useMemo(() => {
    let result = [...activities];

    // Apply filters
    if (categoryFilter !== 'all') {
      result = result.filter(a => a.category === categoryFilter);
    }
    if (useFilter !== 'all') {
      result = result.filter(a => a.recommendedUse === useFilter);
    }

    // Apply sorting
    if (sortBy === 'contribution') {
      result.sort((a, b) => b.scores.portfolioContribution.overall - a.scores.portfolioContribution.overall);
    } else if (sortBy === 'hours') {
      result.sort((a, b) => b.scores.commitment.totalHours - a.scores.commitment.totalHours);
    } else if (sortBy === 'impact') {
      result.sort((a, b) => b.scores.impact.overall - a.scores.impact.overall);
    }

    return result;
  }, [activities, categoryFilter, useFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / cardsPerPage);
  const currentActivities = filteredAndSorted.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [categoryFilter, useFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header with filters and navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          All Activities Dashboard ({filteredAndSorted.length})
        </h2>
      </div>

      {/* Filters and Navigation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Category" />
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

          <Select value={useFilter} onValueChange={setUseFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Use" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="centerpiece">Centerpiece</SelectItem>
              <SelectItem value="supporting">Supporting</SelectItem>
              <SelectItem value="breadth">Breadth</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contribution">Portfolio Contribution</SelectItem>
              <SelectItem value="hours">Commitment Hours</SelectItem>
              <SelectItem value="impact">Impact Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Centered Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="h-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground whitespace-nowrap px-2">
              Slide {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="h-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {currentActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentActivities.map(activity => (
            <ExtracurricularCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No activities match your filters
        </div>
      )}
    </div>
  );
};
