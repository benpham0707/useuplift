import React, { useEffect, useState } from 'react';
import Dock from '@/components/Dock';
import { Target, Frame, BarChart3, FolderOpen, Lock, CheckSquare, Lightbulb } from 'lucide-react';

interface ImpactDockProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const ImpactDock: React.FC<ImpactDockProps> = ({ activeSection, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dockItems = [
    { Icon: Target, label: 'Snapshot', id: 'snapshot' },
    { Icon: Frame, label: 'Frames', id: 'frames' },
    { Icon: BarChart3, label: 'Outcomes', id: 'outcomes' },
    { Icon: FolderOpen, label: 'Initiatives', id: 'initiatives' },
    { Icon: Lock, label: 'Evidence', id: 'evidence' },
    { Icon: CheckSquare, label: 'Quality', id: 'quality' },
    { Icon: Lightbulb, label: 'Guidance', id: 'guidance' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Dock 
        items={dockItems.map(item => ({
          icon: <item.Icon className="w-5 h-5" />,
          label: item.label,
          onClick: () => onNavigate(item.id),
        }))}
        magnification={isMobile ? 40 : 60}
        distance={isMobile ? 100 : 140}
        className="backdrop-blur-lg"
      />
    </div>
  );
};