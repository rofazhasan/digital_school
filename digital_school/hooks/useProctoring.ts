import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseProctoringProps {
    onViolation?: (warningCount: number) => void;
    maxWarnings?: number;
    isExamActive: boolean;
    isUploading?: boolean; // New prop
}

export const useProctoring = ({
    onViolation,
    maxWarnings = 3,
    isExamActive,
    isUploading = false,
    externalWarnings,
    setExternalWarnings
}: UseProctoringProps & {
    externalWarnings?: number,
    setExternalWarnings?: React.Dispatch<React.SetStateAction<number>>
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [internalWarnings, setInternalWarnings] = useState(0);
    const warnings = externalWarnings !== undefined ? externalWarnings : internalWarnings;
    const setWarnings = setExternalWarnings || setInternalWarnings;
    const [isTabActive, setIsTabActive] = useState(true);

    const lastViolationTimeRef = useRef<number>(0);
    const isUnloadingRef = useRef<boolean>(false);

    // Suppress violations during intentional page unloads or navigations
    useEffect(() => {
        const handleUnload = () => {
            isUnloadingRef.current = true;
        };
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('pagehide', handleUnload);
        };
    }, []);

    // Trigger violation handler with cooldown/debounce
    const triggerViolation = useCallback((reason: string) => {
        if (!isExamActive || isUnloadingRef.current) return;

        const now = Date.now();
        // Cooldown: at least 2.5s between warnings to prevent simultaneous blur + visibilitychange double counts
        if (now - lastViolationTimeRef.current < 2500) {
            return;
        }
        lastViolationTimeRef.current = now;

        setWarnings(prev => {
            const newCount = prev + 1;

            // Notify user
            toast.warning(`Warning ${newCount}/${maxWarnings}: ${reason}`, {
                duration: 5000,
                className: 'bg-yellow-500 text-white border-none',
            });

            // Callback if provided
            if (onViolation) {
                onViolation(newCount);
            }

            return newCount;
        });
    }, [isExamActive, maxWarnings, onViolation, setWarnings]);

    // Handle Visibility Change (Tab Switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isExamActive || isUnloadingRef.current) return;

            if (document.hidden) {
                // Ignore if uploading (file picker dialog)
                if (isUploading) return;

                setIsTabActive(false);
                triggerViolation('You left the exam tab. This has been recorded.');
            } else {
                setIsTabActive(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isExamActive, triggerViolation, isUploading]);

    // Handle Window Blur (Alt+Tab or clicking outside)
    useEffect(() => {
        const handleBlur = () => {
            // If page is unloading or already hidden, visibilitychange handles it
            if (document.hidden || isUnloadingRef.current) return;
            if (isExamActive && !isUploading) {
                triggerViolation('Focus lost. Please stay on the exam window.');
            }
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [isExamActive, triggerViolation, isUploading]);

    // Helper to get fullscreen element with prefixes
    const getFullscreenElement = () => {
        const d = document as any;
        return d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement;
    }

    // Handle Fullscreen Change
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!getFullscreenElement();
            setIsFullscreen(isFull);

            if (!isFull && isExamActive && !isUploading) {
                triggerViolation('You exited fullscreen mode. Fullscreen is mandatory during the exam.');
            }
        };

        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        events.forEach(event => document.addEventListener(event, handleFullscreenChange));

        // Check initial state
        setIsFullscreen(!!getFullscreenElement());

        return () => events.forEach(event => document.removeEventListener(event, handleFullscreenChange));
    }, [isExamActive, triggerViolation, isUploading]);

    // Enter Fullscreen Helper
    const enterFullscreen = async () => {
        try {
            const elem = document.documentElement as any;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari/Chrome */
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                await elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) { /* Firefox */
                await elem.mozRequestFullScreen();
            }
        } catch (err) {
            console.error('Error attempting to enable fullscreen:', err);
        }
    };

    // Prevent & Detect Copy/Paste/Cut/Screenshot/Context Menu
    useEffect(() => {
        if (!isExamActive) return;

        const preventDefault = (e: Event) => {
            e.preventDefault();
            return false;
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            triggerViolation('Copying exam content is strictly prohibited.');
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            triggerViolation('Pasting content into the exam is strictly prohibited.');
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            triggerViolation('Cutting exam content is strictly prohibited.');
        };

        // Detect Screenshot Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen key
            if (e.key === 'PrintScreen' || (e as any).keyCode === 44) {
                e.preventDefault();
                triggerViolation('Screenshot attempt detected. Screenshots are strictly prohibited.');
                return;
            }

            // Windows / Chrome Snipping Tool: Win+Shift+S or Ctrl+Shift+S
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                triggerViolation('Screenshot attempt detected. Screenshots are strictly prohibited.');
                return;
            }

            // Mac Screenshot shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
            if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                triggerViolation('Screenshot attempt detected. Screenshots are strictly prohibited.');
                return;
            }

            // Prevent Developer Tools & Source Inspect: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
                ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'))
            ) {
                e.preventDefault();
                triggerViolation('Developer inspect shortcut blocked.');
                return;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e as any).keyCode === 44) {
                // Clear clipboard if possible to prevent image leak
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('').catch(() => {});
                }
                triggerViolation('Screenshot attempt detected. Screenshots are strictly prohibited.');
            }
        };

        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('selectstart', preventDefault);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('selectstart', preventDefault);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isExamActive, triggerViolation]);

    return {
        isFullscreen,
        warnings,
        enterFullscreen,
        isTabActive
    };
};
