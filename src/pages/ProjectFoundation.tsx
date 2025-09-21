import React from 'react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import PortfolioMetricsDashboard from '@/components/PortfolioMetricsDashboard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectFoundation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/project-incubation">Project Incubation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project Portfolio</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/project-incubation')}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
          
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-foreground mb-4">Project Portfolio</h1>
            <p className="text-xl text-muted-foreground">
              Analyze your project performance and strategic growth
            </p>
          </div>
        </div>

        {/* Portfolio Metrics Dashboard */}
        <PortfolioMetricsDashboard />
      </div>
    </div>
  );
};

export default ProjectFoundation;