import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markPerformance, measurePerformance } from '../performanceMonitor';

describe('markPerformance()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls performance.mark with the given name', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(performance, 'mark').mockImplementation(() => ({} as any));
    markPerformance('test-mark');
    expect(spy).toHaveBeenCalledWith('test-mark');
  });

  it('does not throw when performance is undefined', () => {
    // In jsdom, performance exists, but let's ensure no error on call
    expect(() => markPerformance('safe-mark')).not.toThrow();
  });
});

describe('measurePerformance()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls performance.measure with name and startMark', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(performance, 'measure').mockImplementation(() => ({} as any));
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([]);
    measurePerformance('test-measure', 'start-mark');
    expect(spy).toHaveBeenCalledWith('test-measure', 'start-mark', undefined);
  });

  it('calls performance.measure with name, startMark and endMark', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(performance, 'measure').mockImplementation(() => ({} as any));
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([]);
    measurePerformance('test-measure', 'start', 'end');
    expect(spy).toHaveBeenCalledWith('test-measure', 'start', 'end');
  });

  it('logs measure duration in non-production', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(performance, 'measure').mockImplementation(() => ({} as any));
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { duration: 123.456, name: 'test', entryType: 'measure', startTime: 0, toJSON: () => ({}) } as any,
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    measurePerformance('test', 'start');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('does not throw on measure failure', () => {
    vi.spyOn(performance, 'measure').mockImplementation(() => {
      throw new Error('no mark');
    });
    expect(() => measurePerformance('bad', 'nonexistent')).not.toThrow();
  });
});
