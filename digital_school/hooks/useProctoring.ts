import { useState, useEffect, useCallback } from 'react';
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

    // Trigger violation handler
    const triggerViolation = useCallback((reason: string) => {
        if (!isExamActive) return;

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
    }, [isExamActive, maxWarnings, onViolation]);

    // We can auto-reset after a timeout just in case focus never returns properly,
    // although the blur/focus events usually handle it.
    // Logic moved to context consumption layer if needed.

    // Handle Visibility Change (Tab Switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            // IGNORE warnings if exam is not fully active or during init
            if (!isExamActive) return;

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
            // IGNORE warnings if isUploading is true (system dialogs)
            // AND ensure isExamActive is true before warning
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

            if (!isFull && isExamActive) {
                // We don't necessarily trigger a warning here immediately to avoid double counting with blur,
                // but the UI will block them until they re-enter.
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
    }, [isExamActive]);

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
            // Don't toast error here, just let it fail silently or log.
            // Toasting might confuse user if they are on a device that simply doesn't support it (like iOS).
            // toast.error('Could not enter fullscreen mode. Please manually enable it.');
        }
    };

    // Prevent Copy/Paste/Context Menu
    useEffect(() => {
        if (!isExamActive) return;

        const preventDefault = (e: Event) => {
            e.preventDefault();
            return false;
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            toast.error('Copying content is disabled during the exam.');
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault(); // Optional: allow pasting if needed, but blocking is safer
            toast.error('Pasting is disabled during the exam.');
        };

        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCopy);
        document.addEventListener('selectstart', preventDefault); // Disable selection

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCopy);
            document.removeEventListener('selectstart', preventDefault);
        };
    }, [isExamActive]);

    return {
        isFullscreen,
        warnings,
        enterFullscreen,
        isTabActive
    };
};
