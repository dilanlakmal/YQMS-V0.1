import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';

export function useMiningStatus(jobId, onComplete, onError) {
    const [status, setStatus] = useState(null);
    const [progress, setProgress] = useState({ processed: 0, total: 0 });
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    // Use ref to avoid closure staleness if needed, though simple effect dependency is usually safely
    const pollTimerRef = useRef(null);

    useEffect(() => {
        if (!jobId) {
            setStatus(null);
            setProgress({ processed: 0, total: 0 });
            return;
        }

        setIsPolling(true);
        let failures = 0;

        const poll = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/glossary/jobs/${jobId}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Failed to fetch status');

                const job = data.job;
                setStatus(job.status);
                setProgress({
                    processed: job.processedChunks || 0,
                    total: job.totalChunks || 0,
                    step: getStepFromStatus(job.status)
                });

                if (job.status === 'completed') {
                    setIsPolling(false);
                    if (onComplete) onComplete(job);
                } else if (job.status === 'failed') {
                    setIsPolling(false);
                    setError(job.errorMessage);
                    if (onError) onError(job.errorMessage);
                } else {
                    // Continue polling
                    pollTimerRef.current = setTimeout(poll, 2000); // 2s interval
                }
            } catch (err) {
                console.error("Polling error:", err);
                failures++;
                if (failures > 5) {
                    setIsPolling(false);
                    setError("Lost connection to server");
                    if (onError) onError("Lost connection");
                } else {
                    pollTimerRef.current = setTimeout(poll, 5000); // Backoff
                }
            }
        };

        poll();

        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, [jobId]);

    return { status, progress, error, isPolling };
}

function getStepFromStatus(status) {
    switch (status) {
        case 'uploading': return 0;
        case 'ingesting': return 1; // OCR level
        case 'mining': return 2;    // Chunk processing
        case 'completed': return 3;
        case 'failed': return -1;
        default: return 0;
    }
}
