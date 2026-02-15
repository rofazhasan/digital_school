import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="relative flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse"></div>
                    <div className="relative h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                </div>
                <p className="text-lg font-medium text-muted-foreground animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
