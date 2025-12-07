import { useState, useCallback } from 'react';
import { Process, AlgorithmType, AlgorithmConfig, PROCESS_COLORS, QueueLevel } from '@/types/scheduling';

let processCounter = 0;

export function useProcessManager() {
  const [processes, setProcesses] = useState<Process[]>([]);

  const addProcess = useCallback((partial?: Partial<Process>) => {
    const id = `P${++processCounter}`;
    const newProcess: Process = {
      id,
      name: partial?.name ?? id,
      arrivalTime: partial?.arrivalTime ?? 0,
      burstTime: partial?.burstTime ?? 1,
      priority: partial?.priority ?? 1,
      queueLevel: partial?.queueLevel ?? 0,
      color: PROCESS_COLORS[processes.length % PROCESS_COLORS.length],
    };
    setProcesses(prev => [...prev, newProcess]);
    return newProcess;
  }, [processes.length]);

  const updateProcess = useCallback((id: string, updates: Partial<Process>) => {
    setProcesses(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearProcesses = useCallback(() => {
    setProcesses([]);
    processCounter = 0;
  }, []);

  const loadPreset = useCallback((preset: 'basic' | 'priority' | 'multilevel') => {
    processCounter = 0;
    
    const presets: Record<string, Process[]> = {
      basic: [
        { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, queueLevel: 0, color: PROCESS_COLORS[0] },
        { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0, color: PROCESS_COLORS[1] },
        { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 8, priority: 1, queueLevel: 0, color: PROCESS_COLORS[2] },
        { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 2, priority: 1, queueLevel: 0, color: PROCESS_COLORS[3] },
      ],
      priority: [
        { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 4, priority: 2, queueLevel: 0, color: PROCESS_COLORS[0] },
        { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0, color: PROCESS_COLORS[1] },
        { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 5, priority: 4, queueLevel: 0, color: PROCESS_COLORS[2] },
        { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 2, priority: 3, queueLevel: 0, color: PROCESS_COLORS[3] },
        { id: 'P5', name: 'P5', arrivalTime: 5, burstTime: 6, priority: 1, queueLevel: 0, color: PROCESS_COLORS[4] },
      ],
      multilevel: [
        { id: 'P1', name: 'System', arrivalTime: 0, burstTime: 3, priority: 1, queueLevel: 0, color: PROCESS_COLORS[0] },
        { id: 'P2', name: 'Interactive', arrivalTime: 1, burstTime: 4, priority: 2, queueLevel: 1, color: PROCESS_COLORS[1] },
        { id: 'P3', name: 'Batch1', arrivalTime: 2, burstTime: 6, priority: 3, queueLevel: 2, color: PROCESS_COLORS[2] },
        { id: 'P4', name: 'System2', arrivalTime: 4, burstTime: 2, priority: 1, queueLevel: 0, color: PROCESS_COLORS[3] },
        { id: 'P5', name: 'Batch2', arrivalTime: 5, burstTime: 5, priority: 3, queueLevel: 2, color: PROCESS_COLORS[4] },
      ],
    };

    processCounter = presets[preset].length;
    setProcesses(presets[preset]);
  }, []);

  return {
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    clearProcesses,
    loadPreset,
  };
}

export function useSchedulerConfig() {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('fcfs');
  const [config, setConfig] = useState<AlgorithmConfig>({
    timeQuantum: 2,
    agingInterval: 10,
    agingBoost: 1,
    dynamicQuantumMin: 1,
    dynamicQuantumMax: 6,
    mlqQueues: [
      { algorithm: 'rr', timeQuantum: 2 },
      { algorithm: 'rr', timeQuantum: 4 },
      { algorithm: 'fcfs' },
    ],
    mlfqConfig: {
      numQueues: 3,
      baseQuantum: 2,
      quantumMultiplier: 2,
      boostInterval: 20,
    },
  });

  const updateConfig = useCallback((updates: Partial<AlgorithmConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    algorithm,
    setAlgorithm,
    config,
    updateConfig,
  };
}
