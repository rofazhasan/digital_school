import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Loading Evaluation Page</h2>
                <p className="text-muted-foreground animate-pulse">Establishing secure connection to exam data...</p>
            </div>
        </div>
    );
}
