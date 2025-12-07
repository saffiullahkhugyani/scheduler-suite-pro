import {
  Process,
  ProcessState,
  SchedulerResult,
  GanttBlock,
  SchedulerEvent
} from '@/types/scheduling';
import {
  initializeProcessStates,
  calculateMetrics,
  createGanttBlock,
  createEvent,
  finalizeProcessState,
  getReadyProcesses
} from './base';

export function srtf(processes: Process[]): SchedulerResult {
  if (processes.length === 0) {
    return {
      ganttChart: [],
      processStates: [],
      metrics: calculateMetrics([], [], 0),
      events: []
    };
  }

  const states = initializeProcessStates(processes);
  const ganttChart: GanttBlock[] = [];
  const events: SchedulerEvent[] = [];
  
  let currentTime = 0;
  let completed = 0;
  const n = states.length;
  let currentProcess: ProcessState | null = null;
  let blockStartTime = 0;

  while (completed < n) {
    const readyQueue = getReadyProcesses(states, currentTime);

    if (readyQueue.length === 0) {
      // Save current block if exists
      if (currentProcess && blockStartTime < currentTime) {
        ganttChart.push(createGanttBlock(currentProcess, blockStartTime, currentTime, false));
      }
      
      const nextArrival = states
        .filter(p => p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
        currentProcess = null;
      }
      continue;
    }

    // Select process with shortest remaining time
    const selected = readyQueue.sort((a, b) => a.remainingTime - b.remainingTime)[0];
    const stateIndex = states.findIndex(s => s.id === selected.id);

    // Check for preemption
    if (currentProcess && currentProcess.id !== selected.id) {
      ganttChart.push(createGanttBlock(currentProcess, blockStartTime, currentTime, true));
      
      events.push(createEvent(
        currentTime,
        'preemption',
        currentProcess.id,
        `Process ${currentProcess.name} preempted by ${selected.name}`
      ));
      
      blockStartTime = currentTime;
    } else if (!currentProcess) {
      blockStartTime = currentTime;
    }

    if (states[stateIndex].responseTime === null) {
      states[stateIndex].responseTime = currentTime - selected.arrivalTime;
    }
    
    if (states[stateIndex].startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    currentProcess = states[stateIndex];

    // Find next event time (arrival or completion)
    const remainingProcesses = states.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
    const nextArrivalTime = remainingProcesses.length > 0
      ? Math.min(...remainingProcesses.map(p => p.arrivalTime))
      : Infinity;
    
    const completionTime = currentTime + states[stateIndex].remainingTime;
    const nextEventTime = Math.min(nextArrivalTime, completionTime);

    const timeElapsed = nextEventTime - currentTime;
    states[stateIndex].remainingTime -= timeElapsed;
    currentTime = nextEventTime;

    if (states[stateIndex].remainingTime === 0) {
      ganttChart.push(createGanttBlock(states[stateIndex], blockStartTime, currentTime, false));
      
      events.push(createEvent(
        currentTime,
        'completion',
        selected.id,
        `Process ${selected.name} completed`
      ));

      states[stateIndex] = finalizeProcessState(states[stateIndex], currentTime);
      completed++;
      currentProcess = null;
    }
  }

  return {
    ganttChart,
    processStates: states,
    metrics: calculateMetrics(states, ganttChart, currentTime),
    events
  };
}
