import { GanttBlock, SchedulerEvent, QUEUE_COLORS, QueueLevel } from '@/types/scheduling';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  blocks: GanttBlock[];
  events: SchedulerEvent[];
  showEvents?: boolean;
}

export function GanttChart({ blocks, events, showEvents = true }: GanttChartProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg bg-card/50">
        <p className="text-muted-foreground font-mono text-sm">
          Run simulation to see Gantt chart
        </p>
      </div>
    );
  }

  const totalTime = Math.max(...blocks.map(b => b.endTime));
  const scale = 100 / totalTime;

  // Group consecutive blocks
  const uniqueProcesses = [...new Set(blocks.map(b => b.processId))];

  return (
    <div className="space-y-4">
      {/* Main Gantt Chart */}
      <div className="relative">
        <div className="flex h-16 rounded-lg overflow-hidden border border-border bg-card">
          <AnimatePresence mode="popLayout">
            {blocks.map((block, index) => {
              const width = (block.endTime - block.startTime) * scale;
              const isPreemption = block.isPreemption;

              return (
                <motion.div
                  key={`${block.processId}-${block.startTime}`}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    "relative flex items-center justify-center text-xs font-mono font-semibold border-r border-background/30",
                    isPreemption && "border-r-2 border-r-destructive"
                  )}
                  style={{
                    width: `${width}%`,
                    backgroundColor: block.color,
                    minWidth: width > 3 ? 'auto' : '12px',
                  }}
                  title={`${block.processName}: ${block.startTime} - ${block.endTime}${isPreemption ? ' (preempted)' : ''}`}
                >
                  {width > 5 && (
                    <span className="text-[hsl(220,20%,6%)] truncate px-1">
                      {block.processName}
                    </span>
                  )}
                  
                  {/* Preemption indicator */}
                  {isPreemption && (
                    <div className="absolute -right-1 top-0 bottom-0 w-2 flex items-center justify-center">
                      <div className="w-1 h-full bg-destructive animate-pulse" />
                    </div>
                  )}

                  {/* Quantum indicator for RR */}
                  {block.quantumUsed && width > 8 && (
                    <span className="absolute bottom-1 right-1 text-[10px] opacity-70">
                      q={block.quantumUsed}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Time markers */}
        <div className="flex mt-1">
          {blocks.map((block, index) => (
            <div
              key={`time-${index}`}
              className="text-[10px] text-muted-foreground font-mono"
              style={{ width: `${(block.endTime - block.startTime) * scale}%` }}
            >
              {block.startTime}
            </div>
          ))}
          <div className="text-[10px] text-muted-foreground font-mono">
            {totalTime}
          </div>
        </div>
      </div>

      {/* Queue Level Timeline (for MLQ/MLFQ) */}
      {blocks.some(b => b.queueLevel > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Queue Levels
          </h4>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4].map(level => {
              const levelBlocks = blocks.filter(b => b.queueLevel === level);
              if (levelBlocks.length === 0) return null;
              
              return (
                <div 
                  key={level}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: QUEUE_COLORS[level as QueueLevel] }}
                  />
                  <span className="text-xs font-mono">Q{level}</span>
                  <span className="text-xs text-muted-foreground">
                    ({levelBlocks.length} blocks)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Process Legend */}
      <div className="flex gap-3 flex-wrap">
        {uniqueProcesses.map(pid => {
          const block = blocks.find(b => b.processId === pid);
          if (!block) return null;
          
          return (
            <div key={pid} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: block.color }}
              />
              <span className="text-xs font-mono text-foreground">
                {block.processName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      {showEvents && events.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Event Log
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-secondary/30 rounded-lg p-3">
            {events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  "text-xs font-mono flex items-center gap-2 py-1 px-2 rounded",
                  event.type === 'preemption' && "bg-destructive/10 text-destructive",
                  event.type === 'completion' && "bg-[hsl(145,70%,45%,0.1)] text-[hsl(145,70%,50%)]",
                  event.type === 'queue-change' && "bg-accent/10 text-accent",
                  event.type === 'priority-aging' && "bg-[hsl(280,70%,60%,0.1)] text-[hsl(280,70%,65%)]",
                  event.type === 'quantum-update' && "bg-primary/10 text-primary"
                )}
              >
                <span className="text-muted-foreground w-8">[{event.time}]</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] uppercase",
                  event.type === 'arrival' && "bg-primary/20",
                  event.type === 'preemption' && "bg-destructive/20",
                  event.type === 'completion' && "bg-[hsl(145,70%,45%,0.2)]",
                  event.type === 'queue-change' && "bg-accent/20",
                  event.type === 'priority-aging' && "bg-[hsl(280,70%,60%,0.2)]",
                  event.type === 'quantum-update' && "bg-primary/20"
                )}>
                  {event.type}
                </span>
                <span className="text-foreground/80">{event.description}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
