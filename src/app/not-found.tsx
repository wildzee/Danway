import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full p-6 text-center">
            <div className="bg-slate-100 p-6 rounded-full inline-flex items-center justify-center mb-6">
                <FileQuestion className="h-16 w-16 text-slate-400" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Page Not Found</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
                We couldn't find the page you were looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
            </p>

            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
    );
}
