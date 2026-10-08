import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3B34]">
      <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" />
    </div>
  );
}
