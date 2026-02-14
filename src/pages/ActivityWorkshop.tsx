import { useParams } from 'react-router-dom';
import ActivityPortfolioOverview from '@/components/portfolio/activity-workshop/ActivityPortfolioOverview';
import { MOCK_DATA } from '@/components/portfolio/activity-workshop/mockData';

const ActivityWorkshop = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  // HARD-CODED MOCK DATA: Using sample pipeline result until API endpoint is wired up
  const data = MOCK_DATA;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ActivityPortfolioOverview data={data} />
      </div>
    </div>
  );
};

export default ActivityWorkshop;
