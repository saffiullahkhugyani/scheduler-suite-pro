import { Process, AlgorithmType, AlgorithmConfig, SchedulerResult } from '@/types/scheduling';
import { fcfs } from './fcfs';
import { sjf } from './sjf';
import { srtf } from './srtf';
import { priorityNonPreemptive, priorityPreemptive } from './priority';
import { roundRobin, dynamicRoundRobin } from './roundRobin';
import { hrrn } from './hrrn';
import { multilevelQueue, multilevelFeedbackQueue } from './multilevel';

export function runScheduler(
  algorithm: AlgorithmType,
  processes: Process[],
  config: AlgorithmConfig = {}
): SchedulerResult {
  switch (algorithm) {
    case 'fcfs':
      return fcfs(processes);
    case 'sjf':
      return sjf(processes);
    case 'srtf':
      return srtf(processes);
    case 'priority-np':
      return priorityNonPreemptive(processes, config);
    case 'priority-p':
      return priorityPreemptive(processes, config);
    case 'rr':
      return roundRobin(processes, config);
    case 'hrrn':
      return hrrn(processes);
    case 'mlq':
      return multilevelQueue(processes, config);
    case 'mlfq':
      return multilevelFeedbackQueue(processes, config);
    case 'dynamic-rr':
      return dynamicRoundRobin(processes, config);
    default:
      return fcfs(processes);
  }
}

export * from './fcfs';
export * from './sjf';
export * from './srtf';
export * from './priority';
export * from './roundRobin';
export * from './hrrn';
export * from './multilevel';
