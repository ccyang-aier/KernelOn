'use client';

import { Clock3, Eye, RefreshCw, UserRoundPlus, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { pokerRoomFilters, type PokerRoom, type PokerRoomFilter } from './pokerRoomData';

interface PokerRoomListProps {
  filter: PokerRoomFilter;
  onFilterChange(value: PokerRoomFilter): void;
  onJoin(room: PokerRoom): void;
  onRefresh(): void;
  onSpectate(room: PokerRoom): void;
  onStakeFilterChange(value: string): void;
  rooms: ReadonlyArray<PokerRoom>;
  stakeFilter: string;
}

export function PokerRoomList({
  filter,
  onFilterChange,
  onJoin,
  onRefresh,
  onSpectate,
  onStakeFilterChange,
  rooms,
  stakeFilter,
}: PokerRoomListProps) {
  return (
    <section className="grid min-h-0 grid-rows-[42px_52px_minmax(0,1fr)_30px] overflow-hidden rounded-[10px] border border-[#45391f] bg-[linear-gradient(180deg,#111412,#0c0f0e)] shadow-[inset_0_1px_0_rgba(255,255,255,.032)]">
      <div className="flex items-center px-4">
        <h1 className="text-[25px] font-bold tracking-[.035em] text-[#e6c987]">牌桌大厅</h1>
        <span className="ml-3 text-[11px] text-[#777a73]">选择房间，或交给匹配管家</span>
      </div>

      <div className="mx-3 flex items-center justify-between gap-3 rounded-[8px] border border-[#373127] bg-[#111310] px-2">
        <div className="flex h-9 items-stretch overflow-hidden rounded-[6px] border border-[#332d24] bg-[#0d100e]">
          {pokerRoomFilters.map((item) => (
            <button
              aria-pressed={filter === item.id}
              className={`min-w-[104px] border-r border-[#302b23] px-3 text-[12px] font-semibold transition last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d5b369]/60 ${
                filter === item.id
                  ? 'bg-[linear-gradient(180deg,#e1c483,#bd9550)] text-[#16120b] shadow-[inset_0_1px_0_rgba(255,255,255,.55)]'
                  : 'text-[#918d82] hover:bg-white/[.035] hover:text-[#ddcfb0]'
              }`}
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="poker-room-stakes-filter">
            筛选盲注
          </label>
          <select
            className="h-9 w-[156px] appearance-none rounded-[7px] border border-[#443b2d] bg-[#141714] px-3 text-[12px] text-[#c8bca3] outline-none transition hover:border-[#7d6840] focus:border-[#ae8b4d]"
            id="poker-room-stakes-filter"
            onChange={(event) => onStakeFilterChange(event.target.value)}
            value={stakeFilter}
          >
            <option value="all">全部盲注</option>
            <option value="2 / 5">2 / 5</option>
            <option value="5 / 10">5 / 10</option>
            <option value="10 / 20">10 / 20</option>
            <option value="20 / 40">20 / 40</option>
            <option value="100 / 200">100 / 200</option>
          </select>
          <motion.button
            aria-label="刷新房间列表"
            className="grid size-9 place-items-center rounded-[7px] border border-[#443b2d] bg-[#141714] text-[#aaa397] transition hover:border-[#8d7443] hover:text-[#e2c781] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
            onClick={onRefresh}
            type="button"
            whileTap={{ rotate: 110, scale: 0.9 }}
          >
            <RefreshCw className="size-4" />
          </motion.button>
        </div>
      </div>

      <div className="min-h-0 px-3 pb-1 pt-2">
        <AnimatePresence initial={false} mode="popLayout">
          {rooms.length > 0 ? (
            <motion.div className="grid h-full min-h-0 gap-1.5" layout>
              {rooms.map((room) => (
                <PokerRoomRow key={room.id} onJoin={onJoin} onSpectate={onSpectate} room={room} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex h-full items-center justify-center text-sm text-[#817e75]"
              initial={{ opacity: 0 }}
            >
              没有找到符合条件的牌桌
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-[#6f706a]">
        <span className="h-px w-20 bg-[linear-gradient(90deg,transparent,#6b5126)]" />共{' '}
        {rooms.length} 张牌桌
        <span className="h-px w-20 bg-[linear-gradient(90deg,#6b5126,transparent)]" />
      </div>
    </section>
  );
}

function PokerRoomRow({
  onJoin,
  onSpectate,
  room,
}: Readonly<{
  onJoin(room: PokerRoom): void;
  onSpectate(room: PokerRoom): void;
  room: PokerRoom;
}>) {
  const openSeats = room.capacity - room.players;
  const joinable = room.status === 'forming' && openSeats > 0;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="group grid min-h-0 grid-cols-[164px_236px_minmax(190px,1fr)_112px] items-center gap-3 overflow-hidden rounded-[8px] border border-[#3f3524] bg-[linear-gradient(100deg,#131713,#101311)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition-colors hover:border-[#82683a] hover:bg-[#151a15]"
      initial={{ opacity: 0, y: 5 }}
      layout
      transition={{ damping: 28, stiffness: 360, type: 'spring' }}
    >
      <div className="relative h-full min-h-[72px] overflow-hidden rounded-[6px] border border-[#705329]/70 bg-[#06100b]">
        <img
          alt={`${room.name}牌桌预览`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          src={room.image}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,5,.04),rgba(3,5,4,.22))]" />
        <span
          className={`absolute bottom-1.5 left-1.5 rounded-[4px] border px-1.5 py-0.5 text-[9px] font-semibold ${
            room.status === 'forming'
              ? 'border-[#8c6d32] bg-[#4d3917]/92 text-[#e4bd6b]'
              : 'border-[#326840] bg-[#15371e]/92 text-[#6fc77a]'
          }`}
        >
          {room.statusLabel}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <img
          alt={`${room.host}房主头像`}
          className="size-[50px] shrink-0 rounded-full border-2 border-[#9c7c42] object-cover shadow-[0_5px_14px_rgba(0,0,0,.5)]"
          src={room.hostAvatar}
        />
        <div className="min-w-0">
          <strong className="block truncate text-[15px] font-bold text-[#ead9b5]">
            {room.name}
          </strong>
          <span className="mt-1 block text-[11px] text-[#aeaa9f]">盲注&nbsp; {room.stakes}</span>
          <span className="mt-0.5 block text-[10px] text-[#777a73]">
            底池上限&nbsp; {room.buyIn}
          </span>
          <span className="mt-1 block truncate text-[10px] text-[#827f76]">房主 · {room.host}</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center -space-x-1.5">
          {room.playerAvatars.slice(0, 5).map((playerAvatar, index) => (
            <img
              alt=""
              className="size-8 rounded-full border border-[#b39154] object-cover shadow-[0_3px_8px_rgba(0,0,0,.48)]"
              key={`${room.id}-player-${index}`}
              src={playerAvatar}
            />
          ))}
          {room.players > 5 ? (
            <span className="grid size-8 place-items-center rounded-full border border-[#5b5140] bg-[#1a1c18] text-[9px] text-[#aaa392]">
              +{room.players - 5}
            </span>
          ) : null}
          {Array.from({ length: Math.min(3, openSeats) }).map((_, index) => (
            <span
              aria-hidden="true"
              className="size-8 rounded-full border border-dashed border-[#4d483f] bg-[#101310]"
              key={`${room.id}-open-${index}`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-[#777b75]">
          <span className="flex items-center gap-1.5 font-semibold text-[#c3b89e]">
            <Users className="size-3.5 text-[#ad8f52]" /> {room.players} / {room.capacity}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Clock3 className="size-3.5" /> {room.waitLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-1.5">
        {joinable ? (
          <motion.button
            aria-label={`加入 ${room.name}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-[7px] border border-[#e0bf79] bg-[linear-gradient(180deg,#e6ca8e,#c49a4e)] text-[12px] font-bold text-[#17130c] shadow-[inset_0_1px_0_rgba(255,255,255,.55)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dca7]"
            onClick={() => onJoin(room)}
            type="button"
            whileTap={{ scale: 0.965 }}
          >
            <UserRoundPlus className="size-3.5" /> 加入房间
          </motion.button>
        ) : null}
        <motion.button
          aria-label={`旁观 ${room.name}`}
          className="flex h-8 items-center justify-center gap-1.5 rounded-[7px] border border-[#47443c] bg-[#171a17] text-[11px] font-semibold text-[#a9a69d] transition hover:border-[#786849] hover:text-[#dbc896] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={() => onSpectate(room)}
          type="button"
          whileTap={{ scale: 0.965 }}
        >
          <Eye className="size-3.5" /> 旁观
        </motion.button>
      </div>
    </motion.article>
  );
}
