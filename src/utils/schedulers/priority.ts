import {
  Process,
  ProcessState,
  SchedulerResult,
  GanttBlock,
  SchedulerEvent,
  AlgorithmConfig
} from '@/types/scheduling';
import {
  initializeProcessStates,
  calculateMetrics,
  createGanttBlock,
  createEvent,
  finalizeProcessState,
  getReadyProcesses
} from './base';

export function priorityNonPreemptive(
  processes: Process[],
  config?: AlgorithmConfig
): SchedulerResult {
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
  const agingInterval = config?.agingInterval ?? 0;
  const agingBoost = config?.agingBoost ?? 1;

  while (completed < n) {
    // Apply aging if configured
    if (agingInterval > 0) {
      states.forEach((p, idx) => {
        if (p.remainingTime > 0 && p.arrivalTime <= currentTime) {
          const waitTime = currentTime - p.arrivalTime - (p.burstTime - p.remainingTime);
          const boosts = Math.floor(waitTime / agingInterval);
          const newPriority = Math.max(0, p.priority - boosts * agingBoost);
          
          if (newPriority !== states[idx].currentPriority) {
            events.push(createEvent(
              currentTime,
              'priority-aging',
              p.id,
              `Process ${p.name} priority aged: ${states[idx].currentPriority} → ${newPriority}`
            ));
            states[idx].currentPriority = newPriority;
          }
        }
      });
    }

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

    // Select highest priority (lowest number)
    const selected = readyQueue.sort((a, b) => a.currentPriority - b.currentPriority)[0];
    const stateIndex = states.findIndex(s => s.id === selected.id);

    if (states[stateIndex].responseTime === null) {
      states[stateIndex].responseTime = currentTime - selected.arrivalTime;
    }
    
    if (states[stateIndex].startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    events.push(createEvent(
      currentTime,
      'arrival',
      selected.id,
      `Process ${selected.name} selected (priority: ${selected.currentPriority})`
    ));

    const endTime = currentTime + states[stateIndex].remainingTime;
    
    ganttChart.push(createGanttBlock(states[stateIndex], currentTime, endTime, false));

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

export function priorityPreemptive(
  processes: Process[],
  config?: AlgorithmConfig
): SchedulerResult {
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
  const agingInterval = config?.agingInterval ?? 0;
  const agingBoost = config?.agingBoost ?? 1;

  while (completed < n) {
    // Apply aging
    if (agingInterval > 0) {
      states.forEach((p, idx) => {
        if (p.remainingTime > 0 && p.arrivalTime <= currentTime) {
          const waitTime = currentTime - p.arrivalTime - (p.burstTime - p.remainingTime);
          const boosts = Math.floor(waitTime / agingInterval);
          const newPriority = Math.max(0, p.priority - boosts * agingBoost);
          
          if (newPriority !== states[idx].currentPriority) {
            events.push(createEvent(
              currentTime,
              'priority-aging',
              p.id,
              `Process ${p.name} priority aged: ${states[idx].currentPriority} → ${newPriority}`
            ));
            states[idx].currentPriority = newPriority;
          }
        }
      });
    }

    const readyQueue = getReadyProcesses(states, currentTime);

    if (readyQueue.length === 0) {
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

    const selected = readyQueue.sort((a, b) => a.currentPriority - b.currentPriority)[0];
    const stateIndex = states.findIndex(s => s.id === selected.id);

    // Check for preemption
    if (currentProcess && currentProcess.id !== selected.id) {
      ganttChart.push(createGanttBlock(currentProcess, blockStartTime, currentTime, true));
      
      events.push(createEvent(
        currentTime,
        'preemption',
        currentProcess.id,
        `Process ${currentProcess.name} preempted by ${selected.name} (priority: ${selected.currentPriority})`
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
