"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6 space-y-6 text-center">
            <Alert variant="destructive" className="max-w-md bg-white border-red-200 shadow-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
                <AlertDescription className="mt-2 text-sm">
                    {error.message || "An unexpected error occurred while loading this page."}
                </AlertDescription>
            </Alert>

            <div className="flex gap-4">
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    Go Back Home
                </Button>
                <Button
                    onClick={() => reset()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </div>
    );
}
