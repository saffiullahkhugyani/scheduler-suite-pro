import { Process, QueueLevel, PROCESS_COLORS } from '@/types/scheduling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessInputFormProps {
  processes: Process[];
  onAddProcess: (partial?: Partial<Process>) => void;
  onUpdateProcess: (id: string, updates: Partial<Process>) => void;
  onRemoveProcess: (id: string) => void;
  onClearProcesses: () => void;
  onLoadPreset: (preset: 'basic' | 'priority' | 'multilevel') => void;
  showQueueLevel?: boolean;
}

export function ProcessInputForm({
  processes,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
  onClearProcesses,
  onLoadPreset,
  showQueueLevel = false,
}: ProcessInputFormProps) {
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => onAddProcess()}
            size="sm"
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Process
          </Button>
          <Button
            onClick={onClearProcesses}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
        
        <div className="flex gap-2">
          <span className="text-xs text-muted-foreground font-mono self-center">
            Presets:
          </span>
          <Button
            onClick={() => onLoadPreset('basic')}
            variant="secondary"
            size="sm"
          >
            Basic
          </Button>
          <Button
            onClick={() => onLoadPreset('priority')}
            variant="secondary"
            size="sm"
          >
            Priority
          </Button>
          <Button
            onClick={() => onLoadPreset('multilevel')}
            variant="secondary"
            size="sm"
          >
            Multilevel
          </Button>
        </div>
      </div>

      {/* Process list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {processes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-24 border border-dashed border-border rounded-lg bg-card/30"
            >
              <p className="text-muted-foreground font-mono text-sm">
                No processes added. Click "Add Process" or load a preset.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid gap-2 px-2 text-xs font-mono text-muted-foreground uppercase tracking-wider"
                style={{ gridTemplateColumns: showQueueLevel ? '60px 1fr 80px 80px 80px 80px 40px' : '60px 1fr 80px 80px 80px 40px' }}
              >
                <span>Color</span>
                <span>Name</span>
                <span className="text-center">Arrival</span>
                <span className="text-center">Burst</span>
                <span className="text-center">Priority</span>
                {showQueueLevel && <span className="text-center">Queue</span>}
                <span></span>
              </div>

              {processes.map((process, index) => (
                <motion.div
                  key={process.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-2 items-center p-2 rounded-lg bg-card/50 border border-border hover:border-primary/30 transition-colors"
                  style={{ gridTemplateColumns: showQueueLevel ? '60px 1fr 80px 80px 80px 80px 40px' : '60px 1fr 80px 80px 80px 40px' }}
                >
                  {/* Color indicator */}
                  <div
                    className="w-8 h-8 rounded-md cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: process.color }}
                    onClick={() => {
                      const nextColor = PROCESS_COLORS[(PROCESS_COLORS.indexOf(process.color) + 1) % PROCESS_COLORS.length];
                      onUpdateProcess(process.id, { color: nextColor });
                    }}
                    title="Click to change color"
                  />

                  {/* Name */}
                  <Input
                    value={process.name}
                    onChange={(e) => onUpdateProcess(process.id, { name: e.target.value })}
                    className="h-8 font-mono bg-secondary/50"
                    placeholder="Process name"
                  />

                  {/* Arrival Time */}
                  <Input
                    type="number"
                    min={0}
                    value={process.arrivalTime}
                    onChange={(e) => onUpdateProcess(process.id, { arrivalTime: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-8 font-mono text-center bg-secondary/50"
                  />

                  {/* Burst Time */}
                  <Input
                    type="number"
                    min={1}
                    value={process.burstTime}
                    onChange={(e) => onUpdateProcess(process.id, { burstTime: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="h-8 font-mono text-center bg-secondary/50"
                  />

                  {/* Priority */}
                  <Input
                    type="number"
                    min={0}
                    value={process.priority}
                    onChange={(e) => onUpdateProcess(process.id, { priority: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-8 font-mono text-center bg-secondary/50"
                  />

                  {/* Queue Level */}
                  {showQueueLevel && (
                    <Select
                      value={String(process.queueLevel)}
                      onValueChange={(value) => onUpdateProcess(process.id, { queueLevel: parseInt(value) as QueueLevel })}
                    >
                      <SelectTrigger className="h-8 font-mono bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Q0</SelectItem>
                        <SelectItem value="1">Q1</SelectItem>
                        <SelectItem value="2">Q2</SelectItem>
                        <SelectItem value="3">Q3</SelectItem>
                        <SelectItem value="4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveProcess(process.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
