// hooks/useEffectOnce.ts
import { useCallback, useRef } from 'react';

export const useAbortController = () => {
    const abortControllerRef = useRef<AbortController | null>(null);

    const getSignal = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        return abortControllerRef.current.signal;
    }, []);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return { getSignal, abort };
};
