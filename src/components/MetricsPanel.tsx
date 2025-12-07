import { SchedulerMetrics } from '@/types/scheduling';
import { motion } from 'framer-motion';
import { Clock, Zap, BarChart3, RefreshCcw, Activity, Timer } from 'lucide-react';

interface MetricsPanelProps {
  metrics: SchedulerMetrics | null;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

function MetricCard({ label, value, unit, icon, color, delay = 0 }: MetricCardProps) {
  const colorClasses = {
    primary: 'border-primary/30 bg-primary/5',
    accent: 'border-accent/30 bg-accent/5',
    success: 'border-[hsl(145,70%,45%,0.3)] bg-[hsl(145,70%,45%,0.05)]',
    warning: 'border-[hsl(35,90%,55%,0.3)] bg-[hsl(35,90%,55%,0.05)]',
  };

  const iconColors = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-[hsl(145,70%,50%)]',
    warning: 'text-[hsl(35,90%,55%)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`p-4 rounded-lg border ${colorClasses[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-mono font-bold text-foreground">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-mono">{unit}</span>
        )}
      </div>
    </motion.div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="p-4 rounded-lg border border-border bg-card/50 animate-pulse"
          >
            <div className="h-4 w-20 bg-secondary rounded mb-3" />
            <div className="h-8 w-16 bg-secondary rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label="Avg Wait Time"
        value={metrics.averageWaitingTime}
        unit="ms"
        icon={<Clock className="w-4 h-4" />}
        color="primary"
        delay={0}
      />
      <MetricCard
        label="Avg Turnaround"
        value={metrics.averageTurnaroundTime}
        unit="ms"
        icon={<Timer className="w-4 h-4" />}
        color="accent"
        delay={0.05}
      />
      <MetricCard
        label="Avg Response"
        value={metrics.averageResponseTime}
        unit="ms"
        icon={<Zap className="w-4 h-4" />}
        color="success"
        delay={0.1}
      />
      <MetricCard
        label="CPU Util"
        value={metrics.cpuUtilization}
        unit="%"
        icon={<Activity className="w-4 h-4" />}
        color="primary"
        delay={0.15}
      />
      <MetricCard
        label="Throughput"
        value={metrics.throughput}
        unit="/ms"
        icon={<BarChart3 className="w-4 h-4" />}
        color="accent"
        delay={0.2}
      />
      <MetricCard
        label="Context Switches"
        value={metrics.contextSwitches}
        icon={<RefreshCcw className="w-4 h-4" />}
        color="warning"
        delay={0.25}
      />
    </div>
  );
}
