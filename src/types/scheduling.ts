export type AlgorithmType =
  | 'fcfs'
  | 'sjf'
  | 'srtf'
  | 'priority-np'
  | 'priority-p'
  | 'rr'
  | 'hrrn'
  | 'mlq'
  | 'mlfq'
  | 'dynamic-rr';

export type QueueLevel = 0 | 1 | 2 | 3 | 4;

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  queueLevel: QueueLevel;
  color: string;
}

export interface ProcessState extends Process {
  remainingTime: number;
  startTime: number | null;
  endTime: number | null;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number | null;
  responseRatio: number;
  currentPriority: number;
  currentQueue: QueueLevel;
}

export interface GanttBlock {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  isPreemption: boolean;
  queueLevel: QueueLevel;
  priority: number;
  quantumUsed?: number;
  color: string;
}

export interface SchedulerMetrics {
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
  totalExecutionTime: number;
}

export interface SchedulerResult {
  ganttChart: GanttBlock[];
  processStates: ProcessState[];
  metrics: SchedulerMetrics;
  events: SchedulerEvent[];
}

export interface SchedulerEvent {
  time: number;
  type: 'arrival' | 'completion' | 'preemption' | 'queue-change' | 'priority-aging' | 'quantum-update';
  processId: string;
  description: string;
  details?: Record<string, number | string>;
}

export interface AlgorithmConfig {
  timeQuantum?: number;
  agingInterval?: number;
  agingBoost?: number;
  dynamicQuantumMin?: number;
  dynamicQuantumMax?: number;
  mlqQueues?: {
    algorithm: 'fcfs' | 'rr' | 'sjf';
    timeQuantum?: number;
  }[];
  mlfqConfig?: {
    numQueues: number;
    baseQuantum: number;
    quantumMultiplier: number;
    boostInterval: number;
  };
}

export const ALGORITHM_INFO: Record<AlgorithmType, { name: string; description: string; preemptive: boolean }> = {
  'fcfs': {
    name: 'First Come First Serve',
    description: 'Processes are executed in the order they arrive. Simple but can cause convoy effect.',
    preemptive: false
  },
  'sjf': {
    name: 'Shortest Job First',
    description: 'Non-preemptive. Selects the process with the smallest burst time from ready queue.',
    preemptive: false
  },
  'srtf': {
    name: 'Shortest Remaining Time First',
    description: 'Preemptive version of SJF. Always runs the process with least remaining time.',
    preemptive: true
  },
  'priority-np': {
    name: 'Priority (Non-Preemptive)',
    description: 'Selects highest priority process. Lower number = higher priority. No preemption.',
    preemptive: false
  },
  'priority-p': {
    name: 'Priority (Preemptive)',
    description: 'Preemptive priority scheduling. New high-priority arrivals preempt current process.',
    preemptive: true
  },
  'rr': {
    name: 'Round Robin',
    description: 'Each process gets a fixed time quantum. Fair but may have high context switches.',
    preemptive: true
  },
  'hrrn': {
    name: 'Highest Response Ratio Next',
    description: 'Non-preemptive. Selects process with highest (waiting + burst) / burst ratio.',
    preemptive: false
  },
  'mlq': {
    name: 'Multilevel Queue',
    description: 'Multiple queues with different priorities. Each queue can have different algorithms.',
    preemptive: true
  },
  'mlfq': {
    name: 'Multilevel Feedback Queue',
    description: 'Processes move between queues based on behavior. Implements aging to prevent starvation.',
    preemptive: true
  },
  'dynamic-rr': {
    name: 'Dynamic Round Robin',
    description: 'Round Robin with adaptive quantum based on process burst times and system load.',
    preemptive: true
  }
};

export const QUEUE_COLORS: Record<QueueLevel, string> = {
  0: 'hsl(175, 80%, 50%)',
  1: 'hsl(145, 70%, 45%)',
  2: 'hsl(45, 90%, 55%)',
  3: 'hsl(280, 70%, 60%)',
  4: 'hsl(0, 70%, 55%)'
};

export const PROCESS_COLORS = [
  'hsl(175, 80%, 50%)',
  'hsl(145, 70%, 45%)',
  'hsl(45, 90%, 55%)',
  'hsl(280, 70%, 60%)',
  'hsl(200, 80%, 60%)',
  'hsl(330, 70%, 60%)',
  'hsl(100, 60%, 50%)',
  'hsl(20, 85%, 55%)',
];
