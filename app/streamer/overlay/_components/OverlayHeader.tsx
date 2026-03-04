export default function OverlayHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter">
          OVERLAY_CONFIGURATION
        </h1>
        <p className="text-dimmed text-xs font-mono tracking-widest mt-1">OVERLAY_SETTINGS // READY_TO_STREAM</p>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-terminal bg-terminal/10 border border-terminal/30 px-3 py-1.5 font-mono text-[10px] uppercase font-bold tracking-widest">
          <div className="w-2 h-2 bg-terminal rounded-full animate-pulse"></div>
          SIGNAL_ONLINE
        </div>
      </div>
    </div>
  );
}