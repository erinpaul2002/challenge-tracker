import { PartyPopper } from 'lucide-react';

interface CompletionCelebrationProps {
  label: string;
  accentColor: string;
  borderColor: string;
  textColor?: string;
}

const CONFETTI_COUNT = 20;
const CARD_CONFETTI_COUNT = 56;

export default function CompletionCelebration({
  label,
  accentColor,
  borderColor,
  textColor = '#07130b',
}: CompletionCelebrationProps) {
  const confettiPalette = [accentColor, '#ffffff', '#ffd166', '#ff6b6b', '#4ecdc4'];

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[65] overflow-hidden">
        {Array.from({ length: CARD_CONFETTI_COUNT }).map((_, index) => (
          <span
            key={`card-${index}`}
            className="completion-confetti completion-confetti-card"
            style={{
              left: `${(index * 97) % 100}%`,
              top: `${-20 - (index % 8) * 12}px`,
              animationDelay: `${(index % 14) * 0.08}s`,
              animationDuration: `${1.7 + (index % 7) * 0.25}s`,
              backgroundColor: confettiPalette[index % confettiPalette.length],
              transform: `rotate(${(index * 37) % 360}deg)`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute -top-2 right-2 z-[70]">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm shadow-lg border"
          style={{
            color: textColor,
            backgroundColor: accentColor,
            borderColor,
          }}
        >
          <PartyPopper size={12} className="completion-popper" />
          <span>{label}</span>
        </div>

        <div className="absolute -top-2 -right-2 h-20 w-28 overflow-visible">
          {Array.from({ length: CONFETTI_COUNT }).map((_, index) => (
            <span
              key={index}
              className="completion-confetti"
              style={{
                left: `${((index * 17) % 120) - 10}%`,
                animationDelay: `${(index % 8) * 0.12}s`,
                animationDuration: `${1.5 + (index % 5) * 0.22}s`,
                backgroundColor: confettiPalette[index % confettiPalette.length],
                transform: `rotate(${(index * 37) % 360}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .completion-popper {
          animation: popper-bounce 900ms ease-in-out infinite;
        }

        .completion-confetti {
          position: absolute;
          top: 0;
          width: 5px;
          height: 10px;
          border-radius: 1px;
          opacity: 0;
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1);
          animation-iteration-count: infinite;
        }

        .completion-confetti-card {
          width: 4px;
          height: 9px;
          animation-name: confetti-fall-card;
        }

        @keyframes popper-bounce {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          35% { transform: rotate(-15deg) translateY(-1px); }
          65% { transform: rotate(8deg) translateY(1px); }
        }

        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          100% {
            transform: translate3d(-14px, 76px, 0) rotate(420deg) scale(0.85);
            opacity: 0;
          }
        }

        @keyframes confetti-fall-card {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(-24px, 220px, 0) rotate(540deg) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
