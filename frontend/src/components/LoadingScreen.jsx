import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
    <div className="flex items-center gap-3 text-sm font-medium">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading MERN CRM
    </div>
  </main>
);

export default LoadingScreen;
