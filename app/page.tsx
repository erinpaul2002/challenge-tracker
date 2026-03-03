import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black italic mb-2 tracking-tighter">
          CHALLENGE<span className="text-tactical">TRACKER</span>
        </h1>
        <p className="text-dimmed font-mono tracking-[0.3em] uppercase">Tactical Engagement System</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <Link href="/login" className="btn-tactical text-center min-w-[200px]">
          SIGN IN
        </Link>
        <Link href="/signup" className="border border-gunmetal bg-armor hover:border-tactical transition-colors text-hud font-chakra font-bold py-3 px-10 text-center min-w-[200px]" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
          RECRUITMENT
        </Link>
      </div>

      <div className="mt-24 max-w-2xl text-center">
        <div className="grid grid-cols-3 gap-8 py-8 border-y border-gunmetal/30">
          <div>
            <div className="text-tactical font-black text-2xl mb-1 italic">01 //</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-hud">Real-time Overlay</div>
          </div>
          <div>
            <div className="text-tactical font-black text-2xl mb-1 italic">02 //</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-hud">Mod Delegation</div>
          </div>
          <div>
            <div className="text-tactical font-black text-2xl mb-1 italic">03 //</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-hud">Data Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}

