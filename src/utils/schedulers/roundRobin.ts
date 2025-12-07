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
  finalizeProcessState
} from './base';

export function roundRobin(
  processes: Process[],
  config: AlgorithmConfig
): SchedulerResult {
  if (processes.length === 0) {
    return {
      ganttChart: [],
      processStates: [],
      metrics: calculateMetrics([], [], 0),
      events: []
    };
  }

  const timeQuantum = config.timeQuantum ?? 2;
  const states = initializeProcessStates(processes);
  const ganttChart: GanttBlock[] = [];
  const events: SchedulerEvent[] = [];
  
  let currentTime = 0;
  let completed = 0;
  const n = states.length;
  
  // Initialize ready queue with processes sorted by arrival time
  const readyQueue: string[] = [];
  const arrivedSet = new Set<string>();

  // Add initial processes
  states
    .filter(p => p.arrivalTime === 0)
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .forEach(p => {
      readyQueue.push(p.id);
      arrivedSet.add(p.id);
    });

  while (completed < n) {
    if (readyQueue.length === 0) {
      // Find next arriving process
      const nextArrival = states
        .filter(p => !arrivedSet.has(p.id) && p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
        readyQueue.push(nextArrival.id);
        arrivedSet.add(nextArrival.id);
      }
      continue;
    }

    const currentId = readyQueue.shift()!;
    const stateIndex = states.findIndex(s => s.id === currentId);
    const current = states[stateIndex];

    if (current.responseTime === null) {
      states[stateIndex].responseTime = currentTime - current.arrivalTime;
    }
    
    if (current.startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    const executeTime = Math.min(timeQuantum, current.remainingTime);
    const endTime = currentTime + executeTime;

    // Check for new arrivals during execution
    states
      .filter(p => 
        !arrivedSet.has(p.id) && 
        p.arrivalTime > currentTime && 
        p.arrivalTime <= endTime
      )
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
      .forEach(p => {
        readyQueue.push(p.id);
        arrivedSet.add(p.id);
      });

    states[stateIndex].remainingTime -= executeTime;
    
    const isPreemption = states[stateIndex].remainingTime > 0;
    
    ganttChart.push(createGanttBlock(
      states[stateIndex],
      currentTime,
      endTime,
      isPreemption,
      executeTime
    ));

    if (isPreemption) {
      events.push(createEvent(
        endTime,
        'preemption',
        current.id,
        `Process ${current.name} quantum expired (used: ${executeTime})`
      ));
      readyQueue.push(currentId);
    } else {
      events.push(createEvent(
        endTime,
        'completion',
        current.id,
        `Process ${current.name} completed`
      ));
      states[stateIndex] = finalizeProcessState(states[stateIndex], endTime);
      completed++;
    }

    currentTime = endTime;
  }

  return {
    ganttChart,
    processStates: states,
    metrics: calculateMetrics(states, ganttChart, currentTime),
    events
  };
}

export function dynamicRoundRobin(
  processes: Process[],
  config: AlgorithmConfig
): SchedulerResult {
  if (processes.length === 0) {
    return {
      ganttChart: [],
      processStates: [],
      metrics: calculateMetrics([], [], 0),
      events: []
    };
  }

  const minQuantum = config.dynamicQuantumMin ?? 1;
  const maxQuantum = config.dynamicQuantumMax ?? 6;
  const states = initializeProcessStates(processes);
  const ganttChart: GanttBlock[] = [];
  const events: SchedulerEvent[] = [];
  
  let currentTime = 0;
  let completed = 0;
  const n = states.length;
  let currentQuantum = Math.ceil((minQuantum + maxQuantum) / 2);
  
  const readyQueue: string[] = [];
  const arrivedSet = new Set<string>();

  states
    .filter(p => p.arrivalTime === 0)
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .forEach(p => {
      readyQueue.push(p.id);
      arrivedSet.add(p.id);
    });

  while (completed < n) {
    if (readyQueue.length === 0) {
      const nextArrival = states
        .filter(p => !arrivedSet.has(p.id) && p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
        readyQueue.push(nextArrival.id);
        arrivedSet.add(nextArrival.id);
      }
      continue;
    }

    // Dynamic quantum calculation based on ready queue
    const readyProcesses = readyQueue.map(id => states.find(s => s.id === id)!);
    const avgBurstRemaining = readyProcesses.reduce((sum, p) => sum + p.remainingTime, 0) / readyProcesses.length;
    
    // Adjust quantum: shorter processes = smaller quantum, longer = larger
    const newQuantum = Math.max(
      minQuantum,
      Math.min(maxQuantum, Math.ceil(avgBurstRemaining / 2))
    );

    if (newQuantum !== currentQuantum) {
      events.push(createEvent(
        currentTime,
        'quantum-update',
        '',
        `Quantum adjusted: ${currentQuantum} → ${newQuantum} (avg remaining: ${avgBurstRemaining.toFixed(1)})`
      ));
      currentQuantum = newQuantum;
    }

    const currentId = readyQueue.shift()!;
    const stateIndex = states.findIndex(s => s.id === currentId);
    const current = states[stateIndex];

    if (current.responseTime === null) {
      states[stateIndex].responseTime = currentTime - current.arrivalTime;
    }
    
    if (current.startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    const executeTime = Math.min(currentQuantum, current.remainingTime);
    const endTime = currentTime + executeTime;

    states
      .filter(p => 
        !arrivedSet.has(p.id) && 
        p.arrivalTime > currentTime && 
        p.arrivalTime <= endTime
      )
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
      .forEach(p => {
        readyQueue.push(p.id);
        arrivedSet.add(p.id);
      });

    states[stateIndex].remainingTime -= executeTime;
    
    const isPreemption = states[stateIndex].remainingTime > 0;
    
    ganttChart.push(createGanttBlock(
      states[stateIndex],
      currentTime,
      endTime,
      isPreemption,
      executeTime
    ));

    if (isPreemption) {
      events.push(createEvent(
        endTime,
        'preemption',
        current.id,
        `Process ${current.name} quantum expired (quantum: ${currentQuantum})`
      ));
      readyQueue.push(currentId);
    } else {
      events.push(createEvent(
        endTime,
        'completion',
        current.id,
        `Process ${current.name} completed`
      ));
      states[stateIndex] = finalizeProcessState(states[stateIndex], endTime);
      completed++;
    }

    currentTime = endTime;
  }

  return {
    ganttChart,
    processStates: states,
    metrics: calculateMetrics(states, ganttChart, currentTime),
    events
  };
}
