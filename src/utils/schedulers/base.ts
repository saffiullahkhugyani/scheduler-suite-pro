import {
  Process,
  ProcessState,
  GanttBlock,
  SchedulerResult,
  SchedulerMetrics,
  SchedulerEvent,
  AlgorithmConfig,
  QueueLevel
} from '@/types/scheduling';

export function initializeProcessStates(processes: Process[]): ProcessState[] {
  return processes.map(p => ({
    ...p,
    remainingTime: p.burstTime,
    startTime: null,
    endTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: null,
    responseRatio: 0,
    currentPriority: p.priority,
    currentQueue: p.queueLevel
  }));
}

export function calculateMetrics(
  processStates: ProcessState[],
  ganttChart: GanttBlock[],
  totalTime: number
): SchedulerMetrics {
  const n = processStates.length;
  if (n === 0) {
    return {
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      totalExecutionTime: 0
    };
  }

  const totalWaiting = processStates.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTurnaround = processStates.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalResponse = processStates.reduce((sum, p) => sum + (p.responseTime ?? 0), 0);
  
  const busyTime = ganttChart.reduce((sum, block) => sum + (block.endTime - block.startTime), 0);
  
  const contextSwitches = ganttChart.length > 1 
    ? ganttChart.filter((block, i) => i > 0 && block.processId !== ganttChart[i - 1].processId).length
    : 0;

  return {
    averageWaitingTime: totalWaiting / n,
    averageTurnaroundTime: totalTurnaround / n,
    averageResponseTime: totalResponse / n,
    cpuUtilization: totalTime > 0 ? (busyTime / totalTime) * 100 : 0,
    throughput: totalTime > 0 ? n / totalTime : 0,
    contextSwitches,
    totalExecutionTime: totalTime
  };
}

export function calculateResponseRatio(waitingTime: number, burstTime: number): number {
  if (burstTime === 0) return Infinity;
  return (waitingTime + burstTime) / burstTime;
}

export function getReadyProcesses(
  states: ProcessState[],
  currentTime: number
): ProcessState[] {
  return states.filter(
    p => p.arrivalTime <= currentTime && p.remainingTime > 0
  );
}

export function createGanttBlock(
  process: ProcessState,
  startTime: number,
  endTime: number,
  isPreemption: boolean = false,
  quantumUsed?: number
): GanttBlock {
  return {
    processId: process.id,
    processName: process.name,
    startTime,
    endTime,
    isPreemption,
    queueLevel: process.currentQueue,
    priority: process.currentPriority,
    quantumUsed,
    color: process.color
  };
}

export function createEvent(
  time: number,
  type: SchedulerEvent['type'],
  processId: string,
  description: string,
  details?: Record<string, number | string>
): SchedulerEvent {
  return { time, type, processId, description, details };
}

export function finalizeProcessState(
  state: ProcessState,
  endTime: number
): ProcessState {
  const turnaroundTime = endTime - state.arrivalTime;
  const waitingTime = turnaroundTime - state.burstTime;
  const responseRatio = calculateResponseRatio(waitingTime, state.burstTime);

  return {
    ...state,
    endTime,
    waitingTime,
    turnaroundTime,
    responseRatio
  };
}
