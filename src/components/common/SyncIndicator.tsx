import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface SyncIndicatorProps {
  onRefresh: () => void | Promise<unknown>;
  isLoading?: boolean;
  lastUpdated?: Date;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  onRefresh,
  isLoading = false,
  lastUpdated = new Date(),
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getTimeAgoText = () => {
    if (secondsAgo < 5) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6c747f] font-medium">
        Synced: <span className="text-[#17223a] font-semibold">{getTimeAgoText()}</span>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        isLoading={isLoading}
        leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-[#204079] ${isLoading ? 'animate-spin' : ''}`} />}
      >
        Refresh
      </Button>
    </div>
  );
};
