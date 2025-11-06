/**
 * Moderation Stats Component
 *
 * Displays queue statistics dashboard with enhanced visual design
 * Merged best features from prototype while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { QueueStats } from '../../types/moderation';

interface ModerationStatsProps {
  stats: QueueStats;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColorClass: string;
}

const StatCard = ({ title, value, icon, iconColorClass }: StatCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 ${iconColorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ModerationStats({ stats }: ModerationStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Pending Review"
        value={stats.pending_count}
        icon={<Clock className="h-5 w-5" />}
        iconColorClass="text-blue-500"
      />
      <StatCard
        title="Escalated"
        value={stats.escalated_count}
        icon={<AlertTriangle className="h-5 w-5" />}
        iconColorClass="text-orange-500"
      />
      <StatCard
        title="Urgent (>24h)"
        value={stats.urgent_count}
        icon={<TrendingUp className="h-5 w-5" />}
        iconColorClass="text-red-500"
      />
    </div>
  );
}
