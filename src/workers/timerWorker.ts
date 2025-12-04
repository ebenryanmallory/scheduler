/**
 * Timer Web Worker
 * Provides accurate timing independent of main thread blocking
 * Sends tick messages every second with elapsed time
 */

let intervalId: ReturnType<typeof setInterval> | null = null;
let startTime: number = 0;
let accumulatedMs: number = 0;

interface TimerMessage {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'sync';
  startTime?: number;
  accumulatedMs?: number;
}

interface TickMessage {
  type: 'tick';
  elapsedMs: number;
}

self.onmessage = (event: MessageEvent<TimerMessage>) => {
  const { type, startTime: msgStartTime, accumulatedMs: msgAccumulatedMs } = event.data;

  switch (type) {
    case 'start':
      // Start fresh timer
      accumulatedMs = msgAccumulatedMs ?? 0;
      startTime = performance.now();
      startTicking();
      break;

    case 'resume':
      // Resume with accumulated time
      accumulatedMs = msgAccumulatedMs ?? 0;
      startTime = performance.now();
      startTicking();
      break;

    case 'pause':
    case 'stop':
      // Stop ticking
      stopTicking();
      // Send final elapsed time
      const finalElapsed = accumulatedMs + (performance.now() - startTime);
      self.postMessage({ type: 'tick', elapsedMs: finalElapsed } as TickMessage);
      break;

    case 'sync':
      // Sync accumulated time without stopping
      if (msgAccumulatedMs !== undefined) {
        // Calculate current session time
        const currentSessionMs = performance.now() - startTime;
        accumulatedMs = msgAccumulatedMs;
        // Reset start time to now, keeping the current session going
        startTime = performance.now() - currentSessionMs;
      }
      break;
  }
};

function startTicking() {
  // Clear any existing interval
  stopTicking();
  
  // Send immediate tick
  sendTick();
  
  // Start interval (every 1000ms)
  intervalId = setInterval(() => {
    sendTick();
  }, 1000);
}

function stopTicking() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function sendTick() {
  const currentElapsed = accumulatedMs + (performance.now() - startTime);
  self.postMessage({ type: 'tick', elapsedMs: currentElapsed } as TickMessage);
}

// Export for TypeScript module resolution (worker runs in global scope)
export {};






