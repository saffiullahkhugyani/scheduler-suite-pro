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

export function sjf(processes: Process[]): SchedulerResult {
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

  while (completed < n) {
    const readyQueue = getReadyProcesses(states, currentTime);

    if (readyQueue.length === 0) {
      // Find next arriving process
      const nextArrival = states
        .filter(p => p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
      }
      continue;
    }

    // Select process with shortest burst time
    const selected = readyQueue.sort((a, b) => a.burstTime - b.burstTime)[0];
    const stateIndex = states.findIndex(s => s.id === selected.id);

    if (selected.responseTime === null) {
      selected.responseTime = currentTime - selected.arrivalTime;
      states[stateIndex].responseTime = selected.responseTime;
    }
    
    if (selected.startTime === null) {
      selected.startTime = currentTime;
      states[stateIndex].startTime = currentTime;
    }

    events.push(createEvent(
      currentTime,
      'arrival',
      selected.id,
      `Process ${selected.name} selected (burst: ${selected.burstTime})`
    ));

    const endTime = currentTime + selected.remainingTime;
    
    ganttChart.push(createGanttBlock(selected, currentTime, endTime, false));

    events.push(createEvent(
      endTime,
      'completion',
      selected.id,
      `Process ${selected.name} completed`
    ));

    states[stateIndex] = finalizeProcessState(states[stateIndex], endTime);
    states[stateIndex].remainingTime = 0;

    currentTime = endTime;
    completed++;
  }

  return {
    ganttChart,
    processStates: states,
    metrics: calculateMetrics(states, ganttChart, currentTime),
    events
  };
}
