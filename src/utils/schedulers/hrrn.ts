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
  calculateResponseRatio,
  createGanttBlock,
  createEvent,
  finalizeProcessState,
  getReadyProcesses
} from './base';

export function hrrn(processes: Process[]): SchedulerResult {
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
      const nextArrival = states
        .filter(p => p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
      }
      continue;
    }

    // Calculate response ratio for each ready process
    const withRatio = readyQueue.map(p => {
      const waitingTime = currentTime - p.arrivalTime;
      const ratio = calculateResponseRatio(waitingTime, p.burstTime);
      return { process: p, ratio, waitingTime };
    });

    // Select process with highest response ratio
    const selected = withRatio.sort((a, b) => b.ratio - a.ratio)[0];
    const stateIndex = states.findIndex(s => s.id === selected.process.id);

    if (states[stateIndex].responseTime === null) {
      states[stateIndex].responseTime = currentTime - selected.process.arrivalTime;
    }
    
    if (states[stateIndex].startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    events.push(createEvent(
      currentTime,
      'arrival',
      selected.process.id,
      `Process ${selected.process.name} selected (ratio: ${selected.ratio.toFixed(2)}, wait: ${selected.waitingTime})`,
      { responseRatio: selected.ratio, waitingTime: selected.waitingTime }
    ));

    const endTime = currentTime + states[stateIndex].remainingTime;
    
    ganttChart.push(createGanttBlock(states[stateIndex], currentTime, endTime, false));

    events.push(createEvent(
      endTime,
      'completion',
      selected.process.id,
      `Process ${selected.process.name} completed`
    ));

    states[stateIndex] = finalizeProcessState(states[stateIndex], endTime);
    states[stateIndex].remainingTime = 0;
    states[stateIndex].responseRatio = selected.ratio;

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
