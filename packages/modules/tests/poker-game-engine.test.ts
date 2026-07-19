import { describe, expect, it } from 'vitest';

import {
  applyPokerAction,
  cardLabel,
  chooseAiAction,
  createShowcaseGameState,
  evaluateBestHand,
  getActivePlayer,
  getCallAmount,
  getPot,
  startNextHand,
  type PokerCard,
  type PokerGameState,
  type PokerPlayer,
} from '../src/apps/poker/pokerGameEngine';

describe('poker game engine', () => {
  it('hydrates the showcase turn as a legal hero decision', () => {
    const state = createShowcaseGameState();

    expect(state.street).toBe('turn');
    expect(getPot(state)).toBe(1_240);
    expect(getActivePlayer(state)?.id).toBe('hero');
    expect(getCallAmount(state, 'hero')).toBe(240);
    expect(state.board.map(cardLabel)).toEqual(['10', 'J', '7', '2']);

    const called = applyPokerAction(state, 'hero', { type: 'call' });
    expect(getActivePlayer(called)?.id).toBe('lion');
    expect(called.seats.find((seat) => seat.id === 'hero')?.stack).toBe(8_400);
    expect(getPot(called)).toBe(1_480);
  });

  it('plays every remaining decision through showdown and settlement', () => {
    let state = createShowcaseGameState();
    let decisions = 0;

    while (state.phase === 'playing' && decisions < 80) {
      const active = getActivePlayer(state)!;
      const action =
        active.id === 'hero'
          ? getCallAmount(state, 'hero') > 0
            ? ({ type: 'call' } as const)
            : ({ type: 'check' } as const)
          : chooseAiAction(state);
      expect(action).not.toBeNull();
      state = applyPokerAction(state, active.id, action!);
      decisions += 1;
    }

    expect(state.phase).toBe('settled');
    expect(state.street).toBe('showdown');
    expect(state.board).toHaveLength(5);
    expect(state.result?.totalPot).toBeGreaterThan(1_240);
    expect(state.result?.winnerIds.length).toBeGreaterThan(0);
    expect(state.logs.at(-1)?.emphasis).toBe('result');
  });

  it('ranks complete seven-card hands correctly', () => {
    const royalFlush = evaluateBestHand([
      c(14, 'spade'),
      c(13, 'spade'),
      c(12, 'spade'),
      c(11, 'spade'),
      c(10, 'spade'),
      c(2, 'heart'),
      c(3, 'club'),
    ]);
    const quads = evaluateBestHand([
      c(9, 'spade'),
      c(9, 'heart'),
      c(9, 'diamond'),
      c(9, 'club'),
      c(14, 'spade'),
      c(3, 'heart'),
      c(2, 'club'),
    ]);

    expect(royalFlush.label).toBe('同花顺');
    expect(quads.label).toBe('四条');
    expect(royalFlush.category).toBeGreaterThan(quads.category);
  });

  it('splits main and side pots by contribution and hand strength', () => {
    const base = createShowcaseGameState();
    const seats: PokerPlayer[] = base.seats.map((seat) => ({
      ...seat,
      holeCards: [],
      lastAction: '',
      stack: 0,
      status: 'out',
      streetBet: 0,
      totalCommitted: 0,
    }));
    Object.assign(
      seats.find((seat) => seat.id === 'hero')!,
      {
        holeCards: [c(11, 'spade'), c(10, 'spade')],
        stack: 900,
        status: 'active',
        totalCommitted: 100,
      },
    );
    Object.assign(
      seats.find((seat) => seat.id === 'bear')!,
      {
        holeCards: [c(14, 'heart'), c(14, 'diamond')],
        status: 'all-in',
        totalCommitted: 200,
      },
    );
    Object.assign(
      seats.find((seat) => seat.id === 'eagle')!,
      {
        holeCards: [c(13, 'heart'), c(13, 'diamond')],
        status: 'all-in',
        totalCommitted: 200,
      },
    );
    const riverState: PokerGameState = {
      ...base,
      activeSeatIndex: seats.findIndex((seat) => seat.id === 'hero'),
      actedSeatIds: [],
      board: [c(14, 'spade'), c(13, 'spade'), c(12, 'spade'), c(2, 'diamond'), c(3, 'club')],
      currentBet: 0,
      phase: 'playing',
      seats,
      street: 'river',
    };

    const settled = applyPokerAction(riverState, 'hero', { type: 'check' });

    expect(settled.result?.payouts.hero).toBe(300);
    expect(settled.result?.payouts.bear).toBe(200);
    expect(settled.seats.find((seat) => seat.id === 'hero')?.stack).toBe(1_200);
  });

  it('starts the next hand with a rotated dealer, blinds and fresh cards', () => {
    const next = startNextHand(createShowcaseGameState(), 42);

    expect(next.handNumber).toBe(8_422);
    expect(next.seats[next.dealerIndex]?.id).toBe('panther');
    expect(next.seats.find((seat) => seat.position === 'SB')?.streetBet).toBe(10);
    expect(next.seats.find((seat) => seat.position === 'BB')?.streetBet).toBe(20);
    expect(getPot(next)).toBe(30);
    expect(next.seats.every((seat) => seat.holeCards.length === 2)).toBe(true);
  });

  it('restores a busted hero with a table rebuy so the loop remains playable', () => {
    const busted = createShowcaseGameState();
    busted.seats.find((seat) => seat.id === 'hero')!.stack = 0;

    const next = startNextHand(busted, 84);

    expect(next.seats.find((seat) => seat.id === 'hero')?.stack).toBeGreaterThanOrEqual(4_980);
    expect(next.seats.find((seat) => seat.id === 'hero')?.status).toBe('active');
    expect(next.logs.some((entry) => entry.action === '补充筹码')).toBe(true);
  });
});

function c(rank: PokerCard['rank'], suit: PokerCard['suit']): PokerCard {
  return { rank, suit };
}
