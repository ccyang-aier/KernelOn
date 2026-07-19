'use client';

import { Club, Diamond, Heart, Spade, Star } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState, type ComponentType, type CSSProperties, type SVGProps } from 'react';

import { cn } from '@kernelon/ui';

import {
  cardLabel,
  getActivePlayer,
  getPlayer,
  getPot,
  type PokerCard,
  type PokerGameState,
  type PokerPlayer,
  type PokerSuit,
} from './pokerGameEngine';
import { pokerAssetRoot, pokerSeatProfiles, type PokerSeatProfile } from './pokerTableData';

const suitIcons: Record<PokerSuit, ComponentType<SVGProps<SVGSVGElement>>> = {
  club: Club,
  diamond: Diamond,
  heart: Heart,
  spade: Spade,
};

const dealerPlacements: Record<string, string> = {
  bear: 'right-[11.2%] top-[31%]',
  eagle: 'right-[7%] bottom-[23%]',
  hero: 'bottom-[12.1%] left-[61%]',
  lion: 'left-[46%] top-[14%]',
  panther: 'bottom-[21%] left-[12%]',
  wolf: 'left-[11%] top-[31%]',
};

export function PokerTableStage({
  game,
  heroHint,
  turnSeconds,
}: Readonly<{ game: PokerGameState; heroHint: string; turnSeconds: number }>) {
  const [favorite, setFavorite] = useState(false);
  const reduceMotion = useReducedMotion();
  const activePlayer = getActivePlayer(game);
  const hero = getPlayer(game, 'hero')!;
  const dealer = game.seats[game.dealerIndex];
  const revealOpponents = game.phase === 'settled';

  return (
    <section
      aria-label="德州扑克牌桌"
      className="relative min-h-0 overflow-hidden border-r border-b border-[#303231] bg-[#0d1011]"
      data-street={game.street}
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
            <p className="mt-0.5 text-[10px] tabular-nums text-[#8d8e89]">
              第 {game.handNumber.toLocaleString('zh-CN')} 手 · {streetLabel(game.street)}
            </p>
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
          底池{' '}
          <motion.span
            animate={{ scale: [1, 1.06, 1] }}
            className="ml-1 inline-block text-[25px] tabular-nums text-[#e2b96d]"
            key={getPot(game)}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            {getPot(game).toLocaleString('zh-CN')}
          </motion.span>
        </p>
        <div className="flex items-center gap-2" aria-label="公共牌">
          {Array.from({ length: 5 }).map((_, index) => {
            const boardCard = game.board[index];
            if (boardCard)
              return <PlayingCard card={boardCard} key={`${boardCard.rank}-${boardCard.suit}`} />;
            if (index === game.board.length && game.board.length > 0 && game.phase === 'playing') {
              return <PlayingCard back key={`future-${index}`} />;
            }
            return <CardPlaceholder key={`empty-${index}`} />;
          })}
        </div>
        <ChipLegend />
      </div>

      {pokerSeatProfiles.map((profile) => {
        const player = getPlayer(game, profile.id);
        return player ? (
          <PlayerSeat
            active={activePlayer?.id === player.id}
            key={player.id}
            player={player}
            profile={profile}
            revealCards={revealOpponents}
            timer={player.id === 'hero' ? turnSeconds : 12}
            winner={Boolean(game.result?.winnerIds.includes(player.id))}
          />
        ) : null;
      })}

      <AnimatePresence mode="popLayout">
        {hero.holeCards.length ? (
          <motion.div
            animate={{ opacity: hero.status === 'folded' ? 0.35 : 1, y: 0 }}
            className="absolute bottom-[17.2%] left-[44.3%] z-30 flex gap-1.5"
            initial={{ opacity: 0, y: 12 }}
            key={`${game.handNumber}-${hero.holeCards.map(cardLabel).join('')}`}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            {hero.holeCards.map((holeCard) => (
              <PlayingCard card={holeCard} hero key={`${holeCard.rank}-${holeCard.suit}`} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {dealer ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'absolute z-30 grid size-8 place-items-center rounded-full border-2 border-[#171717] bg-[linear-gradient(145deg,#edcd86,#b68b46)] text-[18px] font-black text-[#17130c] shadow-[0_4px_10px_rgba(0,0,0,.5)]',
            dealerPlacements[dealer.id],
          )}
          initial={{ opacity: 0, scale: 0.7 }}
          key={`${game.handNumber}-${dealer.id}`}
        >
          D
        </motion.div>
      ) : null}

      <div className="absolute bottom-[10.2%] left-[43.1%] z-40 whitespace-nowrap rounded border border-[#8e713f]/55 bg-[#242119]/95 px-2 py-1 text-[11px] text-[#d6bb81] shadow-[0_5px_12px_rgba(0,0,0,.35)]">
        {hero.status === 'folded' ? '已弃牌 · 自动观战至结算' : heroHint}
      </div>
    </section>
  );
}

function PlayerSeat({
  active,
  player,
  profile,
  revealCards,
  timer,
  winner,
}: Readonly<{
  active: boolean;
  player: PokerPlayer;
  profile: PokerSeatProfile;
  revealCards: boolean;
  timer: number;
  winner: boolean;
}>) {
  const isHero = profile.tone === 'hero';
  const betPlacement = {
    bear: 'right-[263px] top-[104px]',
    eagle: 'right-[291px] top-[40px]',
    hero: 'left-[118px] top-[80px]',
    lion: 'left-[23px] top-[147px]',
    panther: 'left-[235px] top-[48px]',
    wolf: 'left-[186px] top-[104px]',
  }[player.id];
  const cardPlacement = {
    bear: 'left-[20px] top-[94px]',
    eagle: 'left-[17px] top-[94px]',
    lion: 'left-[23px] top-[105px]',
    panther: 'left-[98px] top-[94px]',
    wolf: 'left-[98px] top-[94px]',
  }[player.id];
  const folded = player.status === 'folded';

  return (
    <motion.div
      animate={{ opacity: folded ? 0.48 : 1, scale: active ? 1.025 : 1 }}
      className={cn('absolute z-30 flex items-center gap-2.5', isHero ? 'items-end' : '')}
      data-active={active || undefined}
      data-player={player.id}
      style={profile.layout}
      transition={{ duration: 0.25 }}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'relative size-[94px] overflow-hidden rounded-full border-[3px] bg-[#181b1b] p-[3px] shadow-[0_12px_24px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(255,255,255,.12)] transition duration-300',
            isHero ? 'size-[102px] border-[#e6b85e]' : 'border-[#68625a]',
            active &&
              'border-[#76d78d] shadow-[0_0_0_5px_rgba(73,196,105,.13),0_0_24px_rgba(73,196,105,.38),0_18px_30px_rgba(0,0,0,.7)]',
            winner &&
              'border-[#f2c768] shadow-[0_0_0_6px_rgba(242,199,104,.17),0_0_34px_rgba(242,199,104,.8),0_18px_30px_rgba(0,0,0,.7)]',
          )}
        >
          <img
            alt={`${player.name} 玩家头像`}
            className={cn(
              'size-full rounded-full object-cover',
              isHero ? 'scale-[1.42] object-[center_66%]' : '',
            )}
            src={profile.avatar}
          />
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,.16),transparent_30%,rgba(0,0,0,.18))]" />
        </div>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-1 grid size-[31px] place-items-center rounded-full border-2 bg-[#0e1511] text-[11px] font-semibold tabular-nums shadow-[0_3px_10px_rgba(0,0,0,.7)]',
            active ? 'border-[#54d171] text-[#c7f7d1]' : 'border-[#535957] text-[#89908d]',
          )}
        >
          {active ? `${String(timer).padStart(2, '0')}s` : '··'}
        </span>
        <span
          className={cn(
            'absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full border border-white/[.12] bg-[#232525] px-2 py-0.5 text-[10px] font-medium text-[#aaa69c]',
            isHero ? 'border-[#9f7d42]/60 bg-[#312a1e] text-[#d9bd83]' : '',
          )}
        >
          {player.position}
        </span>
      </div>

      <div className={cn('min-w-[118px]', isHero ? 'pb-[18px]' : '')}>
        <p
          className={cn(
            'text-[15px] font-semibold leading-none text-[#d8d4c9]',
            isHero ? 'text-[#f0d49b]' : '',
          )}
        >
          {player.name}
        </p>
        <p className="mt-1.5 text-[18px] font-semibold leading-none tabular-nums tracking-[.06em] text-[#ddb978]">
          {player.stack.toLocaleString('zh-CN')}
        </p>
        {player.lastAction ? (
          <motion.p
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'mt-2 text-[10px] text-[#9da19d]',
              active && 'text-[#d6c18e]',
              winner && 'text-[#f1cb78]',
            )}
            initial={{ opacity: 0, x: -4 }}
            key={player.lastAction}
          >
            {player.lastAction}
          </motion.p>
        ) : null}
      </div>

      {!isHero && player.holeCards.length > 0 && player.status !== 'folded' ? (
        <div className={cn('absolute flex', cardPlacement)}>
          {player.holeCards.map((holeCard, index) =>
            revealCards ? (
              <MiniPlayingCard
                card={holeCard}
                className={index ? '-ml-1' : ''}
                key={`${holeCard.rank}-${holeCard.suit}`}
              />
            ) : (
              <CardBack className={index ? '-ml-1' : ''} key={index} />
            ),
          )}
        </div>
      ) : null}

      {player.streetBet > 0 ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'absolute flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[12px] font-medium tabular-nums text-[#e3e2db]',
            betPlacement,
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          key={player.streetBet}
        >
          <span className="relative size-4 rounded-full border-2 border-white bg-[#ca413c] shadow-[inset_0_0_0_2px_#fff,inset_0_0_0_4px_#ca413c]" />
          {player.streetBet.toLocaleString('zh-CN')}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function PlayingCard({
  back = false,
  card,
  hero = false,
}: Readonly<{ back?: boolean; card?: PokerCard; hero?: boolean }>) {
  if (back || !card) {
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
  const SuitIcon = suitIcons[card.suit];
  const isRed = card.suit === 'diamond' || card.suit === 'heart';
  return (
    <motion.div
      animate={{ opacity: 1, rotateY: 0, y: 0 }}
      className={cn(
        'relative h-[108px] w-[74px] rounded-[5px] border border-white bg-[linear-gradient(145deg,#fff,#e8e8e5)] p-1.5 text-[#17191a] shadow-[0_4px_11px_rgba(0,0,0,.42),inset_0_1px_0_#fff]',
        hero ? 'h-[112px] w-[68px]' : '',
        isRed ? 'text-[#a63a38]' : '',
      )}
      initial={{ opacity: 0, rotateY: 85, y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <span className="block font-serif text-[23px] font-semibold leading-none">
        {cardLabel(card)}
      </span>
      <SuitIcon className="mt-1 size-7 fill-current stroke-[1.2]" />
      <SuitIcon className="absolute bottom-2 right-2 size-8 fill-current stroke-[1.2]" />
    </motion.div>
  );
}

function MiniPlayingCard({ card, className }: Readonly<{ card: PokerCard; className?: string }>) {
  const SuitIcon = suitIcons[card.suit];
  const red = card.suit === 'diamond' || card.suit === 'heart';
  return (
    <div
      className={cn(
        'relative h-[42px] w-[30px] rotate-1 rounded-[2px] border border-white bg-[#f0f0ed] p-1 font-serif text-[11px] font-bold shadow-[0_3px_7px_rgba(0,0,0,.5)]',
        red ? 'text-[#a63a38]' : 'text-[#17191a]',
        className,
      )}
    >
      {cardLabel(card)}
      <SuitIcon className="absolute bottom-1 right-1 size-3 fill-current" />
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

function CardPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="h-[108px] w-[74px] rounded-[5px] border border-dashed border-[#b89b63]/15 bg-black/[.08]"
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
            <Diamond className="size-2 fill-current" />
          </span>
          <span className="text-[9px] tabular-nums text-[#b8a974]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function streetLabel(street: PokerGameState['street']) {
  return {
    flop: '翻牌圈',
    preflop: '翻牌前',
    river: '河牌圈',
    showdown: '摊牌结算',
    turn: '转牌圈',
  }[street];
}
