import {
  Process,
  ProcessState,
  SchedulerResult,
  GanttBlock,
  SchedulerEvent,
  AlgorithmConfig,
  QueueLevel
} from '@/types/scheduling';
import {
  initializeProcessStates,
  calculateMetrics,
  createGanttBlock,
  createEvent,
  finalizeProcessState
} from './base';

export function multilevelQueue(
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

  const states = initializeProcessStates(processes);
  const ganttChart: GanttBlock[] = [];
  const events: SchedulerEvent[] = [];

  const queueConfigs = config.mlqQueues ?? [
    { algorithm: 'rr' as const, timeQuantum: 2 },
    { algorithm: 'rr' as const, timeQuantum: 4 },
    { algorithm: 'fcfs' as const }
  ];

  // Create queues for each level
  const queues: Map<QueueLevel, string[]> = new Map([
    [0, []], [1, []], [2, []], [3, []], [4, []]
  ]);

  let currentTime = 0;
  let completed = 0;
  const n = states.length;
  const arrivedSet = new Set<string>();

  // Helper to add arriving processes to their queues
  const addArrivals = (time: number) => {
    states
      .filter(p => !arrivedSet.has(p.id) && p.arrivalTime <= time && p.remainingTime > 0)
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
      .forEach(p => {
        queues.get(p.queueLevel)!.push(p.id);
        arrivedSet.add(p.id);
      });
  };

  while (completed < n) {
    addArrivals(currentTime);

    // Find highest priority non-empty queue
    let selectedQueue: QueueLevel | null = null;
    for (let level = 0; level <= 4; level++) {
      if (queues.get(level as QueueLevel)!.length > 0) {
        selectedQueue = level as QueueLevel;
        break;
      }
    }

    if (selectedQueue === null) {
      const nextArrival = states
        .filter(p => !arrivedSet.has(p.id) && p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
      }
      continue;
    }

    const queue = queues.get(selectedQueue)!;
    const queueConfig = queueConfigs[Math.min(selectedQueue, queueConfigs.length - 1)];
    
    const currentId = queue.shift()!;
    const stateIndex = states.findIndex(s => s.id === currentId);
    const current = states[stateIndex];

    if (current.responseTime === null) {
      states[stateIndex].responseTime = currentTime - current.arrivalTime;
    }
    
    if (current.startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    let executeTime: number;
    let isPreemption = false;

    if (queueConfig.algorithm === 'rr' && queueConfig.timeQuantum) {
      executeTime = Math.min(queueConfig.timeQuantum, current.remainingTime);
    } else {
      executeTime = current.remainingTime;
    }

    // Check if higher priority process arrives during execution
    const higherPriorityArrival = states.find(p => 
      !arrivedSet.has(p.id) && 
      p.arrivalTime > currentTime && 
      p.arrivalTime < currentTime + executeTime &&
      p.queueLevel < selectedQueue
    );

    if (higherPriorityArrival) {
      executeTime = higherPriorityArrival.arrivalTime - currentTime;
      isPreemption = true;
    }

    const endTime = currentTime + executeTime;
    
    addArrivals(endTime);

    states[stateIndex].remainingTime -= executeTime;
    
    if (states[stateIndex].remainingTime > 0) {
      isPreemption = true;
    }

    ganttChart.push(createGanttBlock(
      states[stateIndex],
      currentTime,
      endTime,
      isPreemption,
      queueConfig.algorithm === 'rr' ? executeTime : undefined
    ));

    if (states[stateIndex].remainingTime > 0) {
      if (higherPriorityArrival) {
        events.push(createEvent(
          endTime,
          'preemption',
          current.id,
          `Process ${current.name} preempted by higher priority queue ${higherPriorityArrival.queueLevel}`
        ));
      } else {
        events.push(createEvent(
          endTime,
          'preemption',
          current.id,
          `Process ${current.name} quantum expired in queue ${selectedQueue}`
        ));
      }
      queue.push(currentId);
    } else {
      events.push(createEvent(
        endTime,
        'completion',
        current.id,
        `Process ${current.name} completed (queue ${selectedQueue})`
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

export function multilevelFeedbackQueue(
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

  const mlfqConfig = config.mlfqConfig ?? {
    numQueues: 3,
    baseQuantum: 2,
    quantumMultiplier: 2,
    boostInterval: 20
  };

  const states = initializeProcessStates(processes);
  const ganttChart: GanttBlock[] = [];
  const events: SchedulerEvent[] = [];

  // Create queues
  const queues: string[][] = Array.from({ length: mlfqConfig.numQueues }, () => []);
  const processQueues: Map<string, number> = new Map();

  let currentTime = 0;
  let completed = 0;
  const n = states.length;
  const arrivedSet = new Set<string>();
  let lastBoostTime = 0;

  const getQuantum = (queueLevel: number) => 
    mlfqConfig.baseQuantum * Math.pow(mlfqConfig.quantumMultiplier, queueLevel);

  const addArrivals = (time: number) => {
    states
      .filter(p => !arrivedSet.has(p.id) && p.arrivalTime <= time && p.remainingTime > 0)
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
      .forEach(p => {
        queues[0].push(p.id);
        processQueues.set(p.id, 0);
        arrivedSet.add(p.id);
        
        const stateIdx = states.findIndex(s => s.id === p.id);
        states[stateIdx].currentQueue = 0 as QueueLevel;
      });
  };

  while (completed < n) {
    // Priority boost check
    if (currentTime - lastBoostTime >= mlfqConfig.boostInterval) {
      // Move all processes to top queue
      for (let i = 1; i < mlfqConfig.numQueues; i++) {
        while (queues[i].length > 0) {
          const pid = queues[i].shift()!;
          queues[0].push(pid);
          processQueues.set(pid, 0);
          
          const stateIdx = states.findIndex(s => s.id === pid);
          states[stateIdx].currentQueue = 0 as QueueLevel;
          
          events.push(createEvent(
            currentTime,
            'priority-aging',
            pid,
            `Process ${states[stateIdx].name} boosted to queue 0`
          ));
        }
      }
      lastBoostTime = currentTime;
    }

    addArrivals(currentTime);

    // Find highest priority non-empty queue
    let selectedQueue = -1;
    for (let i = 0; i < mlfqConfig.numQueues; i++) {
      if (queues[i].length > 0) {
        selectedQueue = i;
        break;
      }
    }

    if (selectedQueue === -1) {
      const nextArrival = states
        .filter(p => !arrivedSet.has(p.id) && p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      
      if (nextArrival) {
        currentTime = nextArrival.arrivalTime;
      }
      continue;
    }

    const currentId = queues[selectedQueue].shift()!;
    const stateIndex = states.findIndex(s => s.id === currentId);
    const current = states[stateIndex];
    const quantum = getQuantum(selectedQueue);

    if (current.responseTime === null) {
      states[stateIndex].responseTime = currentTime - current.arrivalTime;
    }
    
    if (current.startTime === null) {
      states[stateIndex].startTime = currentTime;
    }

    let executeTime = Math.min(quantum, current.remainingTime);

    // Check for higher priority arrivals
    const higherPriorityArrival = states.find(p => 
      !arrivedSet.has(p.id) && 
      p.arrivalTime > currentTime && 
      p.arrivalTime < currentTime + executeTime
    );

    if (higherPriorityArrival) {
      executeTime = higherPriorityArrival.arrivalTime - currentTime;
    }

    const endTime = currentTime + executeTime;
    
    addArrivals(endTime);

    states[stateIndex].remainingTime -= executeTime;
    
    const isPreemption = states[stateIndex].remainingTime > 0;

    ganttChart.push(createGanttBlock(
      states[stateIndex],
      currentTime,
      endTime,
      isPreemption,
      executeTime
    ));

    if (states[stateIndex].remainingTime > 0) {
      // Demote to lower queue if used full quantum
      const nextQueue = executeTime >= quantum 
        ? Math.min(selectedQueue + 1, mlfqConfig.numQueues - 1)
        : selectedQueue;

      if (nextQueue !== selectedQueue) {
        events.push(createEvent(
          endTime,
          'queue-change',
          current.id,
          `Process ${current.name} demoted: queue ${selectedQueue} → ${nextQueue}`
        ));
        states[stateIndex].currentQueue = nextQueue as QueueLevel;
      } else {
        events.push(createEvent(
          endTime,
          'preemption',
          current.id,
          `Process ${current.name} preempted in queue ${selectedQueue}`
        ));
      }

      queues[nextQueue].push(currentId);
      processQueues.set(currentId, nextQueue);
    } else {
      events.push(createEvent(
        endTime,
        'completion',
        current.id,
        `Process ${current.name} completed (queue ${selectedQueue})`
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
