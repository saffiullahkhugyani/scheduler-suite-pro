import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GanttChart } from '@/components/GanttChart';
import { MetricsPanel } from '@/components/MetricsPanel';
import { ProcessResultsTable } from '@/components/ProcessResultsTable';
import { ProcessInputForm } from '@/components/ProcessInputForm';
import { AlgorithmSelector } from '@/components/AlgorithmSelector';
import { useProcessManager, useSchedulerConfig } from '@/hooks/useScheduler';
import { runScheduler } from '@/utils/schedulers';
import { SchedulerResult } from '@/types/scheduling';

const Index = () => {
  const {
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    clearProcesses,
    loadPreset,
  } = useProcessManager();

  const {
    algorithm,
    setAlgorithm,
    config,
    updateConfig,
  } = useSchedulerConfig();

  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [showEvents, setShowEvents] = useState(true);

  const handleSimulate = () => {
    if (processes.length === 0) return;
    const schedulerResult = runScheduler(algorithm, processes, config);
    setResult(schedulerResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  const showQueueLevel = algorithm === 'mlq' || algorithm === 'mlfq';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Terminal className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight">
            <span className="text-gradient">SCHEDULING</span>
            <span className="text-foreground"> SIMULATOR</span>
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          CPU Process Scheduling Algorithm Visualization
        </p>
      </motion.header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Configuration Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Algorithm Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 bg-card/80 backdrop-blur-sm border-border">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Algorithm Configuration
              </h2>
              <AlgorithmSelector
                algorithm={algorithm}
                onAlgorithmChange={setAlgorithm}
                config={config}
                onConfigChange={updateConfig}
              />
            </Card>
          </motion.div>

          {/* Process Input */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 bg-card/80 backdrop-blur-sm border-border">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Process Queue
              </h2>
              <ProcessInputForm
                processes={processes}
                onAddProcess={addProcess}
                onUpdateProcess={updateProcess}
                onRemoveProcess={removeProcess}
                onClearProcesses={clearProcesses}
                onLoadPreset={loadPreset}
                showQueueLevel={showQueueLevel}
              />
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-4"
        >
          <Button
            onClick={handleSimulate}
            disabled={processes.length === 0}
            size="lg"
            className="gap-2 px-8"
          >
            <Play className="w-5 h-5" />
            Run Simulation
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={!result}
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </Button>
        </motion.div>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Metrics */}
            <Card className="p-5 bg-card/80 backdrop-blur-sm border-border">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Performance Metrics
              </h2>
              <MetricsPanel metrics={result.metrics} />
            </Card>

            {/* Gantt Chart */}
            <Card className="p-5 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  Gantt Chart
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEvents(!showEvents)}
                  className="gap-1 text-xs"
                >
                  {showEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showEvents ? 'Hide' : 'Show'} Events
                </Button>
              </div>
              <GanttChart
                blocks={result.ganttChart}
                events={result.events}
                showEvents={showEvents}
              />
            </Card>

            {/* Process Results Table */}
            <Card className="p-5 bg-card/80 backdrop-blur-sm border-border">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Process Results
              </h2>
              <ProcessResultsTable processStates={result.processStates} />
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8 border-t border-border mt-12"
        >
          <p className="text-xs text-muted-foreground font-mono">
            Scheduling Algorithm Simulator • 10 Algorithms • Built with React
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
