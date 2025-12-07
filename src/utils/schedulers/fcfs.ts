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
  finalizeProcessState
} from './base';

export function fcfs(processes: Process[]): SchedulerResult {
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

  // Sort by arrival time
  const sortedStates = [...states].sort((a, b) => a.arrivalTime - b.arrivalTime);
  
  let currentTime = 0;

  for (const process of sortedStates) {
    // If CPU is idle, jump to process arrival
    if (currentTime < process.arrivalTime) {
      currentTime = process.arrivalTime;
    }

    events.push(createEvent(
      currentTime,
      'arrival',
      process.id,
      `Process ${process.name} starts execution`
    ));

    // Record first response time
    if (process.responseTime === null) {
      process.responseTime = currentTime - process.arrivalTime;
    }
    process.startTime = currentTime;

    const endTime = currentTime + process.burstTime;
    
    ganttChart.push(createGanttBlock(process, currentTime, endTime, false));

    events.push(createEvent(
      endTime,
      'completion',
      process.id,
      `Process ${process.name} completed`
    ));

    // Update process state
    const stateIndex = states.findIndex(s => s.id === process.id);
    states[stateIndex] = finalizeProcessState(process, endTime);
    states[stateIndex].remainingTime = 0;

    currentTime = endTime;
  }

  return {
    ganttChart,
    processStates: states,
    metrics: calculateMetrics(states, ganttChart, currentTime),
    events
  };
}
