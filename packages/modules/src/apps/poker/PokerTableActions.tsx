'use client';

import { ChevronDown, Coins, MessageSquare, Send, Smile } from 'lucide-react';

import { cn } from '@kernelon/ui';

type PokerTableActionsProps = {
  betAmount: number;
  betPercent: number;
  callAmount: number;
  canRaise: boolean;
  chatValue: string;
  heroStack: number;
  isHeroTurn: boolean;
  maximumRaiseTo: number;
  minimumRaiseTo: number;
  onAction(action: 'fold' | 'call' | 'raise'): void;
  onBetChange(amount: number): void;
  onChatChange(value: string): void;
  onChoosePreset(preset: 'half' | 'twoThirds' | 'pot' | 'allIn'): void;
  onNextHand(): void;
  onSendChat(): void;
  resultSummary?: string;
  statusLabel: string;
};

export function PokerTableActions({
  betAmount,
  betPercent,
  callAmount,
  canRaise,
  chatValue,
  heroStack,
  isHeroTurn,
  maximumRaiseTo,
  minimumRaiseTo,
  onAction,
  onBetChange,
  onChatChange,
  onChoosePreset,
  onNextHand,
  onSendChat,
  resultSummary,
  statusLabel,
}: Readonly<PokerTableActionsProps>) {
  return (
    <footer className="relative z-10 col-span-2 grid min-h-0 grid-cols-[31.6%_30.35%_38.05%] bg-[linear-gradient(180deg,#141718,#0e1112)]">
      <section className="border-r border-[#343635] px-[18px] py-3">
        <form
          className="flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSendChat();
          }}
        >
          <button
            aria-label="快捷消息"
            className="grid size-8 place-items-center rounded border border-transparent text-[#d6bd88] transition hover:border-[#8b754d]/45 hover:bg-white/[.04]"
            onClick={() => onChatChange('打得漂亮！')}
            type="button"
          >
            <MessageSquare className="size-5 fill-[#d6bd88] text-[#d6bd88]" />
          </button>
          <button
            aria-label="选择表情"
            className="grid size-8 place-items-center rounded-full border border-[#d0ae66]/70 text-[#d6bd88] transition hover:rotate-6 hover:bg-[#d6bd88]/10"
            onClick={() => onChatChange('精彩的一手！')}
            type="button"
          >
            <Smile className="size-5" />
          </button>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">牌桌聊天</span>
            <input
              className="h-9 w-full rounded-md border border-white/[.035] bg-[#232626] pl-3 pr-10 text-[12px] text-[#d6d5cf] outline-none transition placeholder:text-[#6d716f] focus:border-[#b8914e]/50 focus:bg-[#282a29] focus:shadow-[0_0_0_3px_rgba(181,140,73,.1)]"
              onChange={(event) => onChatChange(event.target.value)}
              placeholder="在此输入聊天内容..."
              value={chatValue}
            />
            <button
              aria-label="发送聊天"
              className="absolute right-1 top-1 grid size-7 place-items-center text-[#6f7471] transition hover:text-[#d9b66f]"
              type="submit"
            >
              <Send className="size-4" />
            </button>
          </label>
        </form>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-5 border-t border-white/[.07] pt-2.5">
          <div className="grid grid-cols-2 rounded-md bg-white/[.025] px-3 py-2.5">
            <TimeBlock label="银行时间" value="20:15:43" />
            <TimeBlock label="北京时间" value="2024-05-24 20:15" />
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-[#78623e]/65 bg-[linear-gradient(145deg,#22231f,#171a1a)] px-3 text-[#e1c282] shadow-[inset_0_1px_0_rgba(255,255,255,.04)] transition hover:-translate-y-0.5 hover:border-[#ba9251] hover:bg-[#2b261d] active:translate-y-0"
            type="button"
          >
            <Coins className="size-5" />
            <span className="text-[16px] font-semibold tabular-nums">
              {(heroStack + 12_450).toLocaleString('zh-CN')}
            </span>
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </section>

      <section className="relative border-r border-[#343635] px-5 py-3">
        <div className="rounded bg-white/[.055] py-1.5 text-center text-[20px] font-semibold tabular-nums tracking-[.06em] text-[#d9d9d4]">
          {betAmount.toLocaleString('zh-CN')}
        </div>
        <div className="mt-3 px-1">
          <div className="relative h-2 rounded-full bg-[#333735]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#e2c384,#f1d697)] shadow-[0_0_10px_rgba(221,184,111,.32)]"
              style={{ width: `${betPercent}%` }}
            />
            <span
              className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f2daaa] bg-[linear-gradient(145deg,#f4d99e,#b88842)] shadow-[0_4px_10px_rgba(0,0,0,.55),0_0_10px_rgba(225,184,105,.3)]"
              style={{ left: `${betPercent}%` }}
            />
            <input
              aria-label="加注金额"
              className="absolute inset-0 z-10 h-7 w-full -translate-y-[9px] cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={!isHeroTurn || !canRaise}
              max={Math.max(maximumRaiseTo, minimumRaiseTo)}
              min={minimumRaiseTo}
              onChange={(event) => onBetChange(Number(event.target.value))}
              step={10}
              type="range"
              value={betAmount}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] tabular-nums text-[#858986]">
            <span>{minimumRaiseTo.toLocaleString('zh-CN')}</span>
            <span>{maximumRaiseTo.toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-3">
          <PresetButton
            disabled={!isHeroTurn || !canRaise}
            label="1 / 2"
            onClick={() => onChoosePreset('half')}
          />
          <PresetButton
            disabled={!isHeroTurn || !canRaise}
            label="2 / 3"
            onClick={() => onChoosePreset('twoThirds')}
          />
          <PresetButton
            disabled={!isHeroTurn || !canRaise}
            label="底池"
            onClick={() => onChoosePreset('pot')}
          />
          <PresetButton
            disabled={!isHeroTurn || !canRaise}
            label="全下"
            onClick={() => onChoosePreset('allIn')}
          />
        </div>
        <p
          className="absolute inset-x-5 bottom-1 text-center text-[10px] tracking-[.05em] text-[#858986]"
          aria-live="polite"
        >
          {statusLabel}
        </p>
      </section>

      {resultSummary ? (
        <section className="grid grid-cols-[1fr_1.05fr] items-stretch gap-3 px-3.5 pb-10 pt-11">
          <div className="flex flex-col justify-center rounded-xl border border-[#6a5a3e]/55 bg-[linear-gradient(145deg,#24231f,#151818)] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
            <span className="text-[10px] font-semibold tracking-[.12em] text-[#8d8f89]">
              本手结算
            </span>
            <strong className="mt-2 text-[14px] font-semibold text-[#e5c889]">
              {resultSummary}
            </strong>
          </div>
          <ActionButton label="开始下一手" onClick={onNextHand} sublabel="庄位轮转" tone="red" />
        </section>
      ) : (
        <section className="grid grid-cols-[.92fr_.9fr_1.28fr] gap-3 px-3.5 pb-10 pt-11">
          <ActionButton
            disabled={!isHeroTurn}
            label="弃牌"
            onClick={() => onAction('fold')}
            tone="neutral"
          />
          <ActionButton
            disabled={!isHeroTurn}
            label={callAmount === 0 ? '过牌' : '跟注'}
            onClick={() => onAction('call')}
            sublabel={callAmount > 0 ? callAmount.toLocaleString('zh-CN') : 'CHECK'}
            tone="gold"
          />
          <ActionButton
            disabled={!isHeroTurn || !canRaise}
            label={betAmount === maximumRaiseTo ? '全下' : '加注至'}
            onClick={() => onAction('raise')}
            sublabel={betAmount.toLocaleString('zh-CN')}
            tone="red"
          />
        </section>
      )}
    </footer>
  );
}

function TimeBlock({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-[10px] text-[#777c79]">{label}</p>
      <p className="mt-1 text-[11px] tabular-nums text-[#d6b66e]">{value}</p>
    </div>
  );
}

function PresetButton({
  disabled,
  label,
  onClick,
}: Readonly<{ disabled?: boolean; label: string; onClick(): void }>) {
  return (
    <button
      className="h-9 rounded-md border border-[#65533a]/70 bg-[linear-gradient(145deg,#202222,#191b1b)] text-[13px] text-[#cac8c0] shadow-[inset_0_1px_0_rgba(255,255,255,.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bb9556]/75 hover:bg-[#28251f] hover:text-[#ead4a7] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  sublabel,
  tone,
}: Readonly<{
  label: string;
  disabled?: boolean;
  onClick(): void;
  sublabel?: string;
  tone: 'gold' | 'neutral' | 'red';
}>) {
  return (
    <button
      className={cn(
        'relative min-h-0 overflow-hidden rounded-[10px] border px-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_10px_20px_rgba(0,0,0,.26)] transition duration-200 after:absolute after:inset-x-3 after:top-0 after:h-px after:bg-white/25 hover:-translate-y-1 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_16px_26px_rgba(0,0,0,.38)] active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:brightness-100',
        tone === 'neutral' &&
          'border-[#555959] bg-[linear-gradient(145deg,#323536,#171a1b)] text-[#eeeeea]',
        tone === 'gold' &&
          'border-[#f0d39a] bg-[linear-gradient(145deg,#f0d29a,#c89c52)] text-[#15120c]',
        tone === 'red' &&
          'border-[#e47768] bg-[linear-gradient(145deg,#d86858,#af3c34)] text-[#fff3e9] shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_10px_24px_rgba(138,35,27,.28)]',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="block text-[20px] font-semibold tracking-[.06em]">{label}</span>
      {sublabel ? (
        <span className="mt-1 block text-[22px] font-semibold tabular-nums">{sublabel}</span>
      ) : null}
    </button>
  );
}
