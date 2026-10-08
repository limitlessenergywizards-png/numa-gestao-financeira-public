import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { safeAsync, safeAsyncThrow } from '../safeAsync';

// ================================================================
// safeAsync()
// ================================================================
describe('safeAsync()', () => {
  it('success → [result, null]', async () => {
    const [result, error] = await safeAsync(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(error).toBeNull();
  });

  it('async function returning object', async () => {
    const [result, error] = await safeAsync(() => Promise.resolve({ id: 1 }));
    expect(result).toEqual({ id: 1 });
    expect(error).toBeNull();
  });

  it('error → [null, Error]', async () => {
    const [result, error] = await safeAsync(() => Promise.reject(new Error('fail')));
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe('fail');
  });

  it('non-Error throw → wrapped in Error', async () => {
    const [result, error] = await safeAsync(() => Promise.reject('string error'));
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe('string error');
  });

  it('calls onError callback on failure', async () => {
    const onError = vi.fn();
    await safeAsync(() => Promise.reject(new Error('boom')), { onError });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe('boom');
  });

  it('timeout triggers error', async () => {
    const [result, error] = await safeAsync(
      () => new Promise(resolve => setTimeout(() => resolve('late'), 500)),
      { timeout: 50 }
    );
    expect(result).toBeNull();
    expect(error!.message).toContain('expirou');
  });

  it('completes before timeout → success', async () => {
    const [result, error] = await safeAsync(
      () => Promise.resolve('fast'),
      { timeout: 5000 }
    );
    expect(result).toBe('fast');
    expect(error).toBeNull();
  });

  it('no timeout (default) → normal execution', async () => {
    const [result, error] = await safeAsync(() => Promise.resolve('done'));
    expect(result).toBe('done');
    expect(error).toBeNull();
  });

  it('timeout = 0 → no timeout applied', async () => {
    const [result, error] = await safeAsync(
      () => Promise.resolve('ok'),
      { timeout: 0 }
    );
    expect(result).toBe('ok');
    expect(error).toBeNull();
  });
});

// ================================================================
// safeAsyncThrow()
// ================================================================
describe('safeAsyncThrow()', () => {
  it('success → returns result directly', async () => {
    const result = await safeAsyncThrow(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('error → throws', async () => {
    await expect(
      safeAsyncThrow(() => Promise.reject(new Error('fail')))
    ).rejects.toThrow('fail');
  });

  it('timeout → throws timeout error', async () => {
    await expect(
      safeAsyncThrow(
        () => new Promise(resolve => setTimeout(() => resolve('late'), 500)),
        { timeout: 50 }
      )
    ).rejects.toThrow(/expirou/);
  });

  it('calls onError then re-throws', async () => {
    const onError = vi.fn();
    await expect(
      safeAsyncThrow(() => Promise.reject(new Error('boom')), { onError })
    ).rejects.toThrow('boom');
    expect(onError).toHaveBeenCalledOnce();
  });
});
