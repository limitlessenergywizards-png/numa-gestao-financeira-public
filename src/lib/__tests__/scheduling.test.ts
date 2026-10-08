import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleIdleTask } from '../scheduling';

describe('scheduleIdleTask()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls callback via setTimeout fallback', () => {
    // Remove requestIdleCallback to test fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = (window as any).requestIdleCallback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).requestIdleCallback;

    const cb = vi.fn();
    scheduleIdleTask(cb);

    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledOnce();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (original) (window as any).requestIdleCallback = original;
  });

  it('uses custom timeout for setTimeout fallback', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = (window as any).requestIdleCallback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).requestIdleCallback;

    const cb = vi.fn();
    scheduleIdleTask(cb, { timeout: 1000 });

    vi.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledOnce();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (original) (window as any).requestIdleCallback = original;
  });

  it('returns cleanup function that cancels setTimeout', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = (window as any).requestIdleCallback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).requestIdleCallback;

    const cb = vi.fn();
    const cancel = scheduleIdleTask(cb);

    cancel();
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (original) (window as any).requestIdleCallback = original;
  });

  it('uses requestIdleCallback when available', () => {
    const mockCancel = vi.fn();
    const mockRequest = vi.fn().mockReturnValue(42);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestIdleCallback = mockRequest;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).cancelIdleCallback = mockCancel;

    const cb = vi.fn();
    const cancel = scheduleIdleTask(cb, { timeout: 5000 });

    expect(mockRequest).toHaveBeenCalledWith(cb, { timeout: 5000 });

    cancel();
    expect(mockCancel).toHaveBeenCalledWith(42);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).requestIdleCallback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).cancelIdleCallback;
  });

  it('defaults timeout to 3000ms', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = (window as any).requestIdleCallback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).requestIdleCallback;

    const cb = vi.fn();
    scheduleIdleTask(cb);

    vi.advanceTimersByTime(2999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledOnce();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (original) (window as any).requestIdleCallback = original;
  });
});
