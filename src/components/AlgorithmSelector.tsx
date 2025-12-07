import { AlgorithmType, AlgorithmConfig, ALGORITHM_INFO } from '@/types/scheduling';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Zap } from 'lucide-react';

interface AlgorithmSelectorProps {
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  config: AlgorithmConfig;
  onConfigChange: (config: Partial<AlgorithmConfig>) => void;
}

export function AlgorithmSelector({
  algorithm,
  onAlgorithmChange,
  config,
  onConfigChange,
}: AlgorithmSelectorProps) {
  const info = ALGORITHM_INFO[algorithm];

  const showQuantum = algorithm === 'rr';
  const showDynamicQuantum = algorithm === 'dynamic-rr';
  const showAging = algorithm === 'priority-p' || algorithm === 'priority-np';
  const showMlfqConfig = algorithm === 'mlfq';

  return (
    <div className="space-y-4">
      {/* Algorithm Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Scheduling Algorithm
        </Label>
        <Select value={algorithm} onValueChange={(v) => onAlgorithmChange(v as AlgorithmType)}>
          <SelectTrigger className="w-full font-mono bg-card">
            <SelectValue placeholder="Select algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fcfs" className="font-mono">
              FCFS - First Come First Serve
            </SelectItem>
            <SelectItem value="sjf" className="font-mono">
              SJF - Shortest Job First
            </SelectItem>
            <SelectItem value="srtf" className="font-mono">
              SRTF - Shortest Remaining Time First
            </SelectItem>
            <SelectItem value="priority-np" className="font-mono">
              Priority (Non-Preemptive)
            </SelectItem>
            <SelectItem value="priority-p" className="font-mono">
              Priority (Preemptive)
            </SelectItem>
            <SelectItem value="rr" className="font-mono">
              RR - Round Robin
            </SelectItem>
            <SelectItem value="hrrn" className="font-mono">
              HRRN - Highest Response Ratio Next
            </SelectItem>
            <SelectItem value="mlq" className="font-mono">
              MLQ - Multilevel Queue
            </SelectItem>
            <SelectItem value="mlfq" className="font-mono">
              MLFQ - Multilevel Feedback Queue
            </SelectItem>
            <SelectItem value="dynamic-rr" className="font-mono">
              Dynamic Round Robin
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Algorithm Info */}
      <motion.div
        key={algorithm}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-lg bg-secondary/30 border border-border"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{info.name}</span>
              {info.preemptive && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-accent/20 text-accent rounded">
                  Preemptive
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Algorithm-specific configuration */}
      <AnimatePresence mode="wait">
        {showQuantum && (
          <motion.div
            key="quantum"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Time Quantum
            </Label>
            <Input
              type="number"
              min={1}
              value={config.timeQuantum ?? 2}
              onChange={(e) => onConfigChange({ timeQuantum: Math.max(1, parseInt(e.target.value) || 1) })}
              className="font-mono bg-card"
            />
          </motion.div>
        )}

        {showDynamicQuantum && (
          <motion.div
            key="dynamic-quantum"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Min Quantum
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.dynamicQuantumMin ?? 1}
                  onChange={(e) => onConfigChange({ dynamicQuantumMin: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="font-mono bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Max Quantum
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.dynamicQuantumMax ?? 6}
                  onChange={(e) => onConfigChange({ dynamicQuantumMax: Math.max(1, parseInt(e.target.value) || 6) })}
                  className="font-mono bg-card"
                />
              </div>
            </div>
          </motion.div>
        )}

        {showAging && (
          <motion.div
            key="aging"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Aging Interval
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={config.agingInterval ?? 10}
                  onChange={(e) => onConfigChange({ agingInterval: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="font-mono bg-card"
                  placeholder="0 = disabled"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Aging Boost
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.agingBoost ?? 1}
                  onChange={(e) => onConfigChange({ agingBoost: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="font-mono bg-card"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Every {config.agingInterval || 10} time units, priority decreases by {config.agingBoost || 1} (lower = higher priority)
            </p>
          </motion.div>
        )}

        {showMlfqConfig && (
          <motion.div
            key="mlfq"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Number of Queues
                </Label>
                <Input
                  type="number"
                  min={2}
                  max={5}
                  value={config.mlfqConfig?.numQueues ?? 3}
                  onChange={(e) => onConfigChange({
                    mlfqConfig: {
                      ...config.mlfqConfig!,
                      numQueues: Math.min(5, Math.max(2, parseInt(e.target.value) || 3))
                    }
                  })}
                  className="font-mono bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Base Quantum
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.mlfqConfig?.baseQuantum ?? 2}
                  onChange={(e) => onConfigChange({
                    mlfqConfig: {
                      ...config.mlfqConfig!,
                      baseQuantum: Math.max(1, parseInt(e.target.value) || 2)
                    }
                  })}
                  className="font-mono bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Quantum Multiplier
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.mlfqConfig?.quantumMultiplier ?? 2}
                  onChange={(e) => onConfigChange({
                    mlfqConfig: {
                      ...config.mlfqConfig!,
                      quantumMultiplier: Math.max(1, parseInt(e.target.value) || 2)
                    }
                  })}
                  className="font-mono bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Boost Interval
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.mlfqConfig?.boostInterval ?? 20}
                  onChange={(e) => onConfigChange({
                    mlfqConfig: {
                      ...config.mlfqConfig!,
                      boostInterval: Math.max(1, parseInt(e.target.value) || 20)
                    }
                  })}
                  className="font-mono bg-card"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Q0: quantum={config.mlfqConfig?.baseQuantum ?? 2}, Q1: quantum={(config.mlfqConfig?.baseQuantum ?? 2) * (config.mlfqConfig?.quantumMultiplier ?? 2)}, ... 
              Priority boost every {config.mlfqConfig?.boostInterval ?? 20} time units.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
