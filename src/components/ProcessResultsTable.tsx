import { ProcessState } from '@/types/scheduling';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProcessResultsTableProps {
  processStates: ProcessState[];
}

export function ProcessResultsTable({ processStates }: ProcessResultsTableProps) {
  if (processStates.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg bg-card/50">
        <p className="text-muted-foreground font-mono text-sm">
          No process data available
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Process
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Arrival
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Burst
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Priority
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Start
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              End
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-primary text-center">
              Wait
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-accent text-center">
              Turnaround
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-[hsl(145,70%,50%)] text-center">
              Response
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Ratio
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processStates.map((process, index) => (
            <motion.tr
              key={process.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-border hover:bg-secondary/30"
            >
              <TableCell className="font-mono font-semibold">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: process.color }}
                  />
                  {process.name}
                </div>
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.arrivalTime}
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.burstTime}
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.priority}
                {process.currentPriority !== process.priority && (
                  <span className="text-[hsl(280,70%,60%)] ml-1">
                    →{process.currentPriority}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.startTime ?? '-'}
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.endTime ?? '-'}
              </TableCell>
              <TableCell className="font-mono text-center font-semibold text-primary">
                {process.waitingTime}
              </TableCell>
              <TableCell className="font-mono text-center font-semibold text-accent">
                {process.turnaroundTime}
              </TableCell>
              <TableCell className="font-mono text-center font-semibold text-[hsl(145,70%,50%)]">
                {process.responseTime ?? '-'}
              </TableCell>
              <TableCell className="font-mono text-center text-muted-foreground">
                {process.responseRatio > 0 ? process.responseRatio.toFixed(2) : '-'}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
