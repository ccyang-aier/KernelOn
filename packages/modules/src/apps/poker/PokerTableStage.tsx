'use client';

import { Club, Diamond, Heart, Spade, Star } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties, type SVGProps } from 'react';

import { cn } from '@kernelon/ui';

import { pokerAssetRoot, pokerSeats, type PokerSeat } from './pokerTableData';

type Suit = 'club' | 'diamond' | 'heart' | 'spade';

const suitIcons: Record<Suit, ComponentType<SVGProps<SVGSVGElement>>> = {
  club: Club,
  diamond: Diamond,
  heart: Heart,
  spade: Spade,
};

export function PokerTableStage() {
  const [favorite, setFavorite] = useState(false);

  return (
    <section
      aria-label="德州扑克牌桌"
      className="relative min-h-0 overflow-hidden border-r border-b border-[#303231] bg-[#0d1011]"
      data-testid="poker-table-stage"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18] mix-blend-luminosity"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(11,14,15,.15),rgba(5,7,8,.9)),url(${pokerAssetRoot}/lobby-hero.webp)`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(65,76,72,.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_18%,rgba(0,0,0,.28))]"
      />

      <div className="absolute left-4 top-4 z-30 flex items-stretch gap-3">
        <div className="flex min-w-[220px] items-center gap-3 rounded-md border border-[#9e7a3c]/70 bg-[linear-gradient(145deg,rgba(33,32,29,.94),rgba(13,15,15,.96))] px-3 py-2 shadow-[0_14px_30px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.05)]">
          <img
            alt="王冠深筹赛徽章"
            className="size-11 rounded-full object-cover"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <div>
            <p className="text-[14px] font-semibold tracking-[.06em] text-[#ead09a]">
              王冠深筹赛季
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-[#8d8e89]">2024.05.01–2024.06.30</p>
          </div>
        </div>
        <button
          aria-pressed={favorite}
          aria-label="收藏牌桌"
          className={cn(
            'grid size-11 place-items-center rounded-md border border-white/[.07] bg-[linear-gradient(145deg,#2d2e2e,#1c1e1e)] text-xl text-[#e8c77f] shadow-[inset_0_1px_0_rgba(255,255,255,.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b9904c]/50 hover:text-[#ffe2a5] active:translate-y-0',
            favorite
              ? 'border-[#c7a15e]/70 bg-[linear-gradient(145deg,#493b24,#241f17)] shadow-[0_0_18px_rgba(207,162,83,.18),inset_0_1px_0_rgba(255,255,255,.08)]'
              : '',
          )}
          onClick={() => setFavorite((current) => !current)}
          type="button"
        >
          <Star
            aria-hidden="true"
            className={cn('size-5 transition-transform', favorite ? 'scale-110 fill-current' : '')}
          />
        </button>
      </div>

      <div className="absolute inset-x-[4.2%] bottom-[8.9%] top-[10.3%] z-10">
        <img
          alt="黑色皮革包边与墨绿绒面的德州扑克牌桌"
          className="absolute inset-0 size-full translate-y-[30px] scale-x-[1.08] scale-y-[1.18] object-contain mix-blend-lighten drop-shadow-[0_34px_26px_rgba(0,0,0,.7)]"
          src={`${pokerAssetRoot}/table-live.webp`}
        />
        <div className="absolute inset-x-[10%] bottom-[20%] top-[24%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(18,70,48,.2),transparent_68%)]" />
      </div>

      <div className="absolute left-1/2 top-[34.7%] z-20 -translate-x-1/2">
        <p className="mb-2 text-center text-[17px] font-semibold tracking-[.08em] text-[#cfbea0]">
          底池 <span className="ml-1 text-[25px] tabular-nums text-[#e2b96d]">1,240</span>
        </p>
        <div className="flex items-center gap-2">
          <PlayingCard rank="10" suit="spade" />
          <PlayingCard rank="J" suit="diamond" />
          <PlayingCard rank="7" suit="club" />
          <PlayingCard rank="2" suit="heart" />
          <PlayingCard back />
        </div>
        <ChipLegend />
      </div>

      {pokerSeats.map((seat) => (
        <PlayerSeat key={seat.id} seat={seat} />
      ))}

      <div className="absolute bottom-[17.2%] left-[44.3%] z-30 flex gap-1.5">
        <PlayingCard hero rank="A" suit="spade" />
        <PlayingCard hero rank="K" suit="spade" />
      </div>
      <div className="absolute bottom-[12.1%] left-[61%] z-30 grid size-8 place-items-center rounded-full border-2 border-[#171717] bg-[linear-gradient(145deg,#edcd86,#b68b46)] text-[18px] font-black text-[#17130c] shadow-[0_4px_10px_rgba(0,0,0,.5)]">
        D
      </div>
    </section>
  );
}

function PlayerSeat({ seat }: Readonly<{ seat: PokerSeat }>) {
  const isHero = seat.tone === 'hero';
  const betPlacement = {
    bear: 'right-[263px] top-[104px]',
    eagle: 'right-[291px] top-[40px]',
    lion: 'left-[23px] top-[147px]',
    panther: 'left-[235px] top-[48px]',
    wolf: 'left-[186px] top-[104px]',
  }[seat.id];
  const cardPlacement = {
    bear: 'left-[20px] top-[94px]',
    eagle: 'left-[17px] top-[94px]',
    lion: 'left-[23px] top-[105px]',
    wolf: 'left-[98px] top-[94px]',
  }[seat.id];

  return (
    <div
      className={cn('absolute z-30 flex items-center gap-2.5', isHero ? 'items-end' : '')}
      style={seat.layout}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'relative size-[94px] overflow-hidden rounded-full border-[3px] bg-[#181b1b] p-[3px] shadow-[0_12px_24px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(255,255,255,.12)]',
            isHero
              ? 'size-[102px] border-[#e6b85e] shadow-[0_0_0_5px_rgba(222,172,77,.16),0_0_28px_rgba(246,190,84,.7),0_18px_30px_rgba(0,0,0,.7)]'
              : 'border-[#68625a]',
          )}
        >
          <img
            alt={`${seat.name} 玩家头像`}
            className={cn(
              'size-full rounded-full object-cover',
              isHero ? 'scale-[1.42] object-[center_66%]' : '',
            )}
            src={seat.avatar}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,.16),transparent_30%,rgba(0,0,0,.18))]"
          />
        </div>
        <span className="absolute -bottom-0.5 -right-1 grid size-[31px] place-items-center rounded-full border-2 border-[#54d171] bg-[#0e1511] text-[11px] font-semibold tabular-nums text-[#c7f7d1] shadow-[0_3px_10px_rgba(0,0,0,.7)]">
          {seat.timer}
        </span>
        {seat.position ? (
          <span
            className={cn(
              'absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full border border-white/[.12] bg-[#232525] px-2 py-0.5 text-[10px] font-medium text-[#aaa69c]',
              isHero ? 'border-[#9f7d42]/60 bg-[#312a1e] text-[#d9bd83]' : '',
            )}
          >
            {seat.position}
          </span>
        ) : null}
      </div>

      <div className={cn('min-w-[118px]', isHero ? 'pb-[18px]' : '')}>
        <p
          className={cn(
            'text-[15px] font-semibold leading-none text-[#d8d4c9]',
            isHero ? 'text-[15px] text-[#f0d49b]' : '',
          )}
        >
          {seat.name}
        </p>
        <p className="mt-1.5 text-[18px] font-semibold leading-none tabular-nums tracking-[.06em] text-[#ddb978]">
          {seat.stack}
        </p>
      </div>

      {seat.cardCount ? (
        <div className={cn('absolute flex', cardPlacement)}>
          {Array.from({ length: seat.cardCount }).map((_, index) => (
            <CardBack key={index} className={index ? '-ml-1' : ''} />
          ))}
        </div>
      ) : null}

      {seat.bet ? (
        <div
          className={cn(
            'absolute flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[12px] font-medium tabular-nums text-[#e3e2db]',
            betPlacement,
          )}
        >
          <span className="relative size-4 rounded-full border-2 border-white bg-[#ca413c] shadow-[inset_0_0_0_2px_#fff,inset_0_0_0_4px_#ca413c]" />
          {seat.bet}
        </div>
      ) : null}
      {isHero ? (
        <span className="absolute left-[110px] top-[109px] whitespace-nowrap rounded border border-[#8e713f]/55 bg-[#242119]/95 px-2 py-1 text-[11px] text-[#d6bb81]">
          同花听牌
        </span>
      ) : null}
    </div>
  );
}

function PlayingCard({
  back = false,
  hero = false,
  rank,
  suit = 'spade',
}: Readonly<{ back?: boolean; hero?: boolean; rank?: string; suit?: Suit }>) {
  const SuitIcon = suitIcons[suit];
  const isRed = suit === 'diamond' || suit === 'heart';

  if (back) {
    return (
      <div className="relative h-[108px] w-[74px] overflow-hidden rounded-[5px] border border-[#777063] bg-[linear-gradient(145deg,#282723,#151818)] p-1 shadow-[0_4px_11px_rgba(0,0,0,.42)]">
        <div className="grid size-full place-items-center rounded-[3px] border border-[#9d7a3c]/55 bg-[radial-gradient(circle_at_center,#25231d,#121516_70%)]">
          <img
            alt="牌背"
            className="size-[58px] rounded-full object-cover opacity-55 mix-blend-luminosity"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-[108px] w-[74px] rounded-[5px] border border-white bg-[linear-gradient(145deg,#fff,#e8e8e5)] p-1.5 text-[#17191a] shadow-[0_4px_11px_rgba(0,0,0,.42),inset_0_1px_0_#fff]',
        hero ? 'h-[112px] w-[68px]' : '',
        isRed ? 'text-[#a63a38]' : '',
      )}
    >
      <span className="block font-serif text-[23px] font-semibold leading-none">{rank}</span>
      <SuitIcon className="mt-1 size-7 fill-current stroke-[1.2]" />
      <SuitIcon className="absolute bottom-2 right-2 size-8 fill-current stroke-[1.2]" />
    </div>
  );
}

function CardBack({ className }: Readonly<{ className?: string }>) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn(
        'h-[39px] w-[28px] rotate-1 rounded-[2px] border border-[#dbcdc0] object-cover shadow-[0_3px_7px_rgba(0,0,0,.5)]',
        className,
      )}
      src={`${pokerAssetRoot}/card-back-red.webp`}
    />
  );
}

function ChipLegend() {
  const chips = [
    ['#b93c36', '5'],
    ['#3d8c54', '25'],
    ['#444748', '100'],
    ['#6f4d9b', '500'],
    ['#b88c37', '1K'],
    ['#d6b365', '1K'],
  ];

  return (
    <div className="mt-2 flex items-start justify-center gap-2.5">
      {chips.map(([color, label]) => (
        <div className="flex flex-col items-center gap-0.5" key={`${color}-${label}`}>
          <span
            className="grid size-[22px] place-items-center rounded-full border-[3px] border-white/80 text-[7px] font-bold text-white shadow-[0_3px_5px_rgba(0,0,0,.55),inset_0_0_0_2px_rgba(0,0,0,.15)]"
            style={{ backgroundColor: color } as CSSProperties}
          >
            <Diamond aria-hidden="true" className="size-2 fill-current" />
          </span>
          <span className="text-[9px] tabular-nums text-[#b8a974]">{label}</span>
        </div>
      ))}
    </div>
  );
}
