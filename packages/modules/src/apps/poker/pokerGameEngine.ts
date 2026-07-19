export type PokerSuit = 'club' | 'diamond' | 'heart' | 'spade';

export type PokerRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type PokerCard = {
  rank: PokerRank;
  suit: PokerSuit;
};

export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PokerSeatStatus = 'active' | 'all-in' | 'folded' | 'out';

export type PokerPlayer = {
  id: string;
  name: string;
  position: string;
  stack: number;
  status: PokerSeatStatus;
  holeCards: PokerCard[];
  streetBet: number;
  totalCommitted: number;
  lastAction: string;
};

export type PokerLogEntry = {
  id: string;
  time: string;
  player: string;
  position: string;
  action: string;
  amount: number | null;
  pot: number;
  emphasis?: 'hero' | 'raise' | 'result' | 'street';
};

export type PokerHandValue = {
  category: number;
  kickers: number[];
  label: string;
};

export type PokerGameResult = {
  totalPot: number;
  payouts: Record<string, number>;
  winnerIds: string[];
  summary: string;
  handLabels: Record<string, string>;
};

export type PokerGameState = {
  handNumber: number;
  smallBlind: number;
  bigBlind: number;
  dealerIndex: number;
  activeSeatIndex: number | null;
  street: PokerStreet;
  phase: 'playing' | 'settled';
  seats: PokerPlayer[];
  board: PokerCard[];
  deck: PokerCard[];
  currentBet: number;
  minimumRaise: number;
  actedSeatIds: string[];
  logs: PokerLogEntry[];
  result: PokerGameResult | null;
};

export type PokerPlayerAction =
  { type: 'fold' } | { type: 'check' } | { type: 'call' } | { type: 'raise'; to: number };

export const POKER_SEAT_ORDER = ['hero', 'panther', 'wolf', 'lion', 'bear', 'eagle'] as const;

const PLAYER_NAMES: Record<(typeof POKER_SEAT_ORDER)[number], string> = {
  bear: '北极熊先生',
  eagle: '老鹰之眼',
  hero: '你',
  lion: 'LionKing',
  panther: '暗夜黑豹',
  wolf: '银河狼王',
};

const HAND_LABELS = [
  '高牌',
  '一对',
  '两对',
  '三条',
  '顺子',
  '同花',
  '葫芦',
  '四条',
  '同花顺',
] as const;

let SHOWCASE_LOG_COUNTER = 0;

const SHOWCASE_LOGS: PokerLogEntry[] = [
  makeLog('银河狼王', 'BB', '大盲注', 20, 30),
  makeLog('LionKing', 'UTG', '跟注', 20, 50),
  makeLog('北极熊先生', 'HJ', '跟注', 20, 70),
  makeLog('暗夜黑豹', 'SB', '弃牌', null, 70),
  makeLog('老鹰之眼', 'CO', '加注至', 240, 1_240, 'raise'),
];

export function getPot(state: PokerGameState) {
  return state.seats.reduce((total, seat) => total + seat.totalCommitted, 0);
}

export function getActivePlayer(state: PokerGameState) {
  return state.activeSeatIndex === null ? null : (state.seats[state.activeSeatIndex] ?? null);
}

export function getPlayer(state: PokerGameState, seatId: string) {
  return state.seats.find((seat) => seat.id === seatId) ?? null;
}

export function getCallAmount(state: PokerGameState, seatId: string) {
  const player = getPlayer(state, seatId);
  if (!player) return 0;
  return Math.min(player.stack, Math.max(0, state.currentBet - player.streetBet));
}

export function getMinimumRaiseTo(state: PokerGameState, seatId: string) {
  const player = getPlayer(state, seatId);
  if (!player) return 0;
  const maximum = player.streetBet + player.stack;
  const target = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.minimumRaise;
  return Math.min(maximum, target);
}

export function createShowcaseGameState(): PokerGameState {
  const knownCards: PokerCard[] = [
    card(14, 'spade'),
    card(13, 'spade'),
    card(12, 'heart'),
    card(12, 'club'),
    card(9, 'club'),
    card(8, 'club'),
    card(11, 'heart'),
    card(10, 'diamond'),
    card(5, 'spade'),
    card(5, 'diamond'),
    card(6, 'heart'),
    card(6, 'spade'),
    card(10, 'spade'),
    card(11, 'diamond'),
    card(7, 'club'),
    card(2, 'heart'),
  ];
  const remainder = createDeck().filter(
    (candidate) => !knownCards.some((known) => sameCard(candidate, known)),
  );
  const forcedRiver = card(12, 'diamond');
  const deck = [
    card(4, 'heart'),
    forcedRiver,
    ...remainder.filter((item) => !sameCard(item, forcedRiver)),
  ];
  const positions: Record<string, string> = {
    bear: 'HJ',
    eagle: 'CO',
    hero: 'BTN',
    lion: 'UTG',
    panther: 'SB',
    wolf: 'BB',
  };
  const stateById: Record<
    string,
    Pick<
      PokerPlayer,
      'holeCards' | 'lastAction' | 'stack' | 'status' | 'streetBet' | 'totalCommitted'
    >
  > = {
    bear: {
      holeCards: [card(9, 'club'), card(8, 'club')],
      lastAction: '过牌',
      stack: 5_990,
      status: 'active',
      streetBet: 0,
      totalCommitted: 240,
    },
    eagle: {
      holeCards: [card(11, 'heart'), card(10, 'diamond')],
      lastAction: '加注至 240',
      stack: 5_500,
      status: 'active',
      streetBet: 240,
      totalCommitted: 480,
    },
    hero: {
      holeCards: [card(14, 'spade'), card(13, 'spade')],
      lastAction: '思考中',
      stack: 8_640,
      status: 'active',
      streetBet: 0,
      totalCommitted: 250,
    },
    lion: {
      holeCards: [card(12, 'heart'), card(12, 'club')],
      lastAction: '过牌',
      stack: 4_320,
      status: 'active',
      streetBet: 0,
      totalCommitted: 240,
    },
    panther: {
      holeCards: [card(5, 'spade'), card(5, 'diamond')],
      lastAction: '弃牌',
      stack: 7_880,
      status: 'folded',
      streetBet: 0,
      totalCommitted: 10,
    },
    wolf: {
      holeCards: [card(6, 'heart'), card(6, 'spade')],
      lastAction: '弃牌',
      stack: 3_190,
      status: 'folded',
      streetBet: 0,
      totalCommitted: 20,
    },
  };

  return {
    activeSeatIndex: 0,
    actedSeatIds: ['eagle'],
    bigBlind: 20,
    board: [card(10, 'spade'), card(11, 'diamond'), card(7, 'club'), card(2, 'heart')],
    currentBet: 240,
    dealerIndex: 0,
    deck,
    handNumber: 8_421,
    logs: SHOWCASE_LOGS,
    minimumRaise: 220,
    phase: 'playing',
    result: null,
    seats: POKER_SEAT_ORDER.map((id) => ({
      id,
      name: PLAYER_NAMES[id],
      position: positions[id] ?? '',
      ...stateById[id],
    })) as PokerPlayer[],
    smallBlind: 10,
    street: 'turn',
  };
}

export function startNextHand(
  previous: PokerGameState,
  seed = previous.handNumber + 1,
): PokerGameState {
  const heroNeedsRebuy = (previous.seats.find((seat) => seat.id === 'hero')?.stack ?? 0) <= 0;
  const seats = previous.seats.map((seat) => {
    const stack = seat.id === 'hero' && heroNeedsRebuy ? 5_000 : seat.stack;
    return {
      ...seat,
      holeCards: [] as PokerCard[],
      lastAction: '',
      position: '',
      stack,
      status: stack > 0 ? ('active' as const) : ('out' as const),
      streetBet: 0,
      totalCommitted: 0,
    };
  });
  const occupied = seats
    .map((seat, index) => (seat.status !== 'out' ? index : -1))
    .filter((index) => index >= 0);
  if (occupied.length < 2) return previous;

  const dealerIndex = findNextIndex(seats, previous.dealerIndex, (seat) => seat.status !== 'out')!;
  assignPositions(seats, dealerIndex);
  let deck = shuffleDeck(createDeck(), seed);
  for (let pass = 0; pass < 2; pass += 1) {
    let cursor = dealerIndex;
    for (let dealt = 0; dealt < occupied.length; dealt += 1) {
      cursor = findNextIndex(seats, cursor, (seat) => seat.status !== 'out')!;
      const drawn = deck[0];
      if (drawn) seats[cursor]!.holeCards.push(drawn);
      deck = deck.slice(1);
    }
  }

  const smallBlindIndex = findNextIndex(seats, dealerIndex, (seat) => seat.status !== 'out')!;
  const bigBlindIndex = findNextIndex(seats, smallBlindIndex, (seat) => seat.status !== 'out')!;
  postForcedBet(seats[smallBlindIndex]!, previous.smallBlind, '小盲注');
  postForcedBet(seats[bigBlindIndex]!, previous.bigBlind, '大盲注');
  const activeSeatIndex = findNextIndex(seats, bigBlindIndex, (seat) => seat.status === 'active');
  const pot = seats.reduce((total, seat) => total + seat.totalCommitted, 0);
  const logs = [
    makeLog('系统', '', `第 ${previous.handNumber + 1} 手牌开始`, null, 0, 'street'),
    ...(heroNeedsRebuy ? [makeLog('你', '', '补充筹码', 5_000, 0, 'hero')] : []),
    makeLog(
      seats[smallBlindIndex]!.name,
      seats[smallBlindIndex]!.position,
      '小盲注',
      previous.smallBlind,
      previous.smallBlind,
    ),
    makeLog(
      seats[bigBlindIndex]!.name,
      seats[bigBlindIndex]!.position,
      '大盲注',
      previous.bigBlind,
      pot,
    ),
  ];

  return {
    activeSeatIndex,
    actedSeatIds: [],
    bigBlind: previous.bigBlind,
    board: [],
    currentBet: previous.bigBlind,
    dealerIndex,
    deck,
    handNumber: previous.handNumber + 1,
    logs,
    minimumRaise: previous.bigBlind,
    phase: 'playing',
    result: null,
    seats,
    smallBlind: previous.smallBlind,
    street: 'preflop',
  };
}

export function applyPokerAction(
  state: PokerGameState,
  seatId: string,
  action: PokerPlayerAction,
): PokerGameState {
  if (state.phase !== 'playing') return state;
  const active = getActivePlayer(state);
  if (!active || active.id !== seatId || active.status !== 'active') return state;

  const seatIndex = state.activeSeatIndex!;
  const seats = state.seats.map((seat) => ({ ...seat }));
  const seat = seats[seatIndex]!;
  const callAmount = Math.max(0, state.currentBet - seat.streetBet);
  let currentBet = state.currentBet;
  let minimumRaise = state.minimumRaise;
  let actedSeatIds = [...state.actedSeatIds];
  let actionLabel = '';
  let amount: number | null = null;
  let emphasis: PokerLogEntry['emphasis'] = seatId === 'hero' ? 'hero' : undefined;

  if (action.type === 'fold') {
    seat.status = 'folded';
    seat.lastAction = '弃牌';
    actionLabel = '弃牌';
  } else if (action.type === 'check') {
    if (callAmount > 0) return state;
    seat.lastAction = '过牌';
    actionLabel = '过牌';
  } else if (action.type === 'call') {
    const paid = commitChips(seat, callAmount);
    seat.lastAction =
      paid < callAmount || seat.status === 'all-in' ? `全下 ${paid}` : `跟注 ${paid}`;
    actionLabel = paid < callAmount || seat.status === 'all-in' ? '全下跟注' : '跟注';
    amount = paid;
  } else {
    const maximum = seat.streetBet + seat.stack;
    const requested = Math.min(
      maximum,
      Math.round(action.to / state.smallBlind) * state.smallBlind,
    );
    const minimum = getMinimumRaiseTo(state, seatId);
    if (requested <= currentBet || (requested < minimum && requested < maximum)) return state;
    const previousBet = currentBet;
    const paid = commitChips(seat, requested - seat.streetBet);
    currentBet = seat.streetBet;
    const raiseSize = currentBet - previousBet;
    if (raiseSize >= minimumRaise) minimumRaise = raiseSize;
    actedSeatIds = [];
    seat.lastAction = seat.status === 'all-in' ? `全下 ${currentBet}` : `加注至 ${currentBet}`;
    actionLabel = seat.status === 'all-in' ? '全下' : '加注至';
    amount = currentBet;
    emphasis = 'raise';
    if (paid <= 0) return state;
  }

  if (!actedSeatIds.includes(seatId)) actedSeatIds.push(seatId);
  let next: PokerGameState = {
    ...state,
    actedSeatIds,
    currentBet,
    minimumRaise,
    seats,
  };
  next = appendLog(next, seat, actionLabel, amount, emphasis);

  const contenders = seats.filter(
    (candidate) => candidate.status !== 'folded' && candidate.status !== 'out',
  );
  if (contenders.length === 1) return settleUncontested(next, contenders[0]!);
  if (isBettingRoundComplete(next)) return advanceStreet(next);

  return {
    ...next,
    activeSeatIndex: findNextIndex(seats, seatIndex, (candidate) => candidate.status === 'active'),
  };
}

export function chooseAiAction(state: PokerGameState): PokerPlayerAction | null {
  const player = getActivePlayer(state);
  if (!player || player.id === 'hero' || player.status !== 'active') return null;
  const toCall = getCallAmount(state, player.id);
  const pot = Math.max(state.bigBlind, getPot(state));
  const strength = estimateHandStrength(player.holeCards, state.board);
  const pressure = toCall / Math.max(1, player.stack + player.streetBet);
  const roll = deterministicRoll(
    `${state.handNumber}:${state.street}:${player.id}:${state.logs.length}`,
  );

  if (toCall === 0) {
    if (strength > 0.78 && player.stack > state.bigBlind * 4 && roll > 0.42) {
      return {
        type: 'raise',
        to: Math.min(
          player.streetBet + player.stack,
          roundToBlind(Math.max(state.bigBlind, pot * 0.45), state.smallBlind),
        ),
      };
    }
    return { type: 'check' };
  }

  if (toCall >= player.stack) {
    return strength > 0.5 || roll > 0.72 ? { type: 'call' } : { type: 'fold' };
  }
  if ((pressure > 0.34 && strength < 0.72) || (strength < 0.3 && roll < 0.62)) {
    return { type: 'fold' };
  }
  if (strength > 0.84 && roll > 0.7 && player.stack > toCall + state.minimumRaise) {
    const target = Math.min(
      player.streetBet + player.stack,
      Math.max(
        getMinimumRaiseTo(state, player.id),
        roundToBlind(state.currentBet + pot * 0.55, state.smallBlind),
      ),
    );
    return { type: 'raise', to: target };
  }
  return { type: 'call' };
}

export function runUntilHeroOrSettled(state: PokerGameState, limit = 80) {
  let current = state;
  for (let step = 0; step < limit; step += 1) {
    const active = getActivePlayer(current);
    if (current.phase === 'settled' || !active || active.id === 'hero') return current;
    const action = chooseAiAction(current);
    if (!action) return current;
    current = applyPokerAction(current, active.id, action);
  }
  return current;
}

export function evaluateBestHand(cards: PokerCard[]): PokerHandValue {
  if (cards.length < 5) return evaluatePartialHand(cards);
  let best: PokerHandValue | null = null;
  for (const combination of chooseFive(cards)) {
    const value = evaluateFiveCardHand(combination);
    if (!best || compareHandValues(value, best) > 0) best = value;
  }
  return best!;
}

export function compareHandValues(left: PokerHandValue, right: PokerHandValue) {
  if (left.category !== right.category) return left.category - right.category;
  const length = Math.max(left.kickers.length, right.kickers.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left.kickers[index] ?? 0) - (right.kickers[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function cardLabel(cardValue: PokerCard) {
  const ranks: Record<PokerRank, string> = {
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '10',
    11: 'J',
    12: 'Q',
    13: 'K',
    14: 'A',
  };
  return ranks[cardValue.rank];
}

function advanceStreet(state: PokerGameState): PokerGameState {
  if (state.street === 'river') return settleShowdown(state);
  const nextStreet: PokerStreet =
    state.street === 'preflop' ? 'flop' : state.street === 'flop' ? 'turn' : 'river';
  const drawCount = nextStreet === 'flop' ? 3 : 1;
  const deckAfterBurn = state.deck.slice(1);
  const board = [...state.board, ...deckAfterBurn.slice(0, drawCount)];
  const deck = deckAfterBurn.slice(drawCount);
  const seats = state.seats.map((seat) => ({ ...seat, streetBet: 0, lastAction: '' }));
  let next: PokerGameState = {
    ...state,
    actedSeatIds: [],
    board,
    currentBet: 0,
    deck,
    minimumRaise: state.bigBlind,
    seats,
    street: nextStreet,
  };
  next = {
    ...next,
    logs: [
      ...next.logs,
      makeLog('系统', '', streetLabel(nextStreet), null, getPot(next), 'street'),
    ].slice(-7),
  };
  const actionable = seats.filter((seat) => seat.status === 'active');
  if (actionable.length <= 1) return runOutAndSettle(next);
  return {
    ...next,
    activeSeatIndex: findNextIndex(seats, state.dealerIndex, (seat) => seat.status === 'active'),
  };
}

function runOutAndSettle(state: PokerGameState): PokerGameState {
  let current = state;
  while (current.street !== 'river') {
    const nextStreet: PokerStreet =
      current.street === 'preflop' ? 'flop' : current.street === 'flop' ? 'turn' : 'river';
    const drawCount = nextStreet === 'flop' ? 3 : 1;
    const deckAfterBurn = current.deck.slice(1);
    current = {
      ...current,
      board: [...current.board, ...deckAfterBurn.slice(0, drawCount)],
      deck: deckAfterBurn.slice(drawCount),
      street: nextStreet,
    };
  }
  return settleShowdown(current);
}

function settleUncontested(state: PokerGameState, winner: PokerPlayer): PokerGameState {
  const totalPot = getPot(state);
  const seats = state.seats.map((seat) =>
    seat.id === winner.id
      ? { ...seat, stack: seat.stack + totalPot, lastAction: `赢得 ${totalPot}` }
      : seat,
  );
  const result: PokerGameResult = {
    handLabels: {},
    payouts: { [winner.id]: totalPot },
    summary: `${winner.name} 赢得底池`,
    totalPot,
    winnerIds: [winner.id],
  };
  return settleState(state, seats, result);
}

function settleShowdown(state: PokerGameState): PokerGameState {
  const contenders = state.seats.filter(
    (seat) => seat.status !== 'folded' && seat.status !== 'out',
  );
  if (contenders.length === 1) return settleUncontested(state, contenders[0]!);
  const handValues = Object.fromEntries(
    contenders.map((seat) => [seat.id, evaluateBestHand([...seat.holeCards, ...state.board])]),
  ) as Record<string, PokerHandValue>;
  const levels = [
    ...new Set(state.seats.map((seat) => seat.totalCommitted).filter((amount) => amount > 0)),
  ].sort((left, right) => left - right);
  const payouts: Record<string, number> = {};
  let previousLevel = 0;
  for (const level of levels) {
    const contributors = state.seats.filter((seat) => seat.totalCommitted >= level);
    const eligible = contributors.filter(
      (seat) => seat.status !== 'folded' && seat.status !== 'out',
    );
    const sidePot = (level - previousLevel) * contributors.length;
    previousLevel = level;
    if (sidePot <= 0 || eligible.length === 0) continue;
    let winners = [eligible[0]!];
    for (const candidate of eligible.slice(1)) {
      const comparison = compareHandValues(handValues[candidate.id]!, handValues[winners[0]!.id]!);
      if (comparison > 0) winners = [candidate];
      else if (comparison === 0) winners.push(candidate);
    }
    const share = Math.floor(sidePot / winners.length);
    let remainder = sidePot - share * winners.length;
    for (const winner of winners) {
      payouts[winner.id] = (payouts[winner.id] ?? 0) + share + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
    }
  }
  const seats = state.seats.map((seat) => ({
    ...seat,
    lastAction: payouts[seat.id] ? `赢得 ${payouts[seat.id]}` : seat.lastAction,
    stack: seat.stack + (payouts[seat.id] ?? 0),
  }));
  const winnerIds = Object.keys(payouts).filter((id) => (payouts[id] ?? 0) > 0);
  const leadWinner = winnerIds.reduce((best, id) =>
    (payouts[id] ?? 0) > (payouts[best] ?? 0) ? id : best,
  );
  const leadSeat = seats.find((seat) => seat.id === leadWinner)!;
  const result: PokerGameResult = {
    handLabels: Object.fromEntries(
      Object.entries(handValues).map(([id, value]) => [id, value.label]),
    ),
    payouts,
    summary: `${leadSeat.name} 以${handValues[leadWinner]!.label}赢得 ${payouts[leadWinner]!.toLocaleString('zh-CN')}`,
    totalPot: getPot(state),
    winnerIds,
  };
  return settleState(state, seats, result);
}

function settleState(
  state: PokerGameState,
  seats: PokerPlayer[],
  result: PokerGameResult,
): PokerGameState {
  return {
    ...state,
    activeSeatIndex: null,
    logs: [
      ...state.logs,
      makeLog('系统', '', result.summary, result.totalPot, result.totalPot, 'result'),
    ].slice(-7),
    phase: 'settled',
    result,
    seats,
    street: 'showdown',
  };
}

function isBettingRoundComplete(state: PokerGameState) {
  return state.seats
    .filter((seat) => seat.status === 'active')
    .every((seat) => state.actedSeatIds.includes(seat.id) && seat.streetBet === state.currentBet);
}

function appendLog(
  state: PokerGameState,
  seat: PokerPlayer,
  action: string,
  amount: number | null,
  emphasis?: PokerLogEntry['emphasis'],
): PokerGameState {
  return {
    ...state,
    logs: [
      ...state.logs,
      makeLog(seat.name, seat.position, action, amount, getPot(state), emphasis),
    ].slice(-7),
  };
}

function commitChips(seat: PokerPlayer, requested: number) {
  const paid = Math.min(seat.stack, Math.max(0, requested));
  seat.stack -= paid;
  seat.streetBet += paid;
  seat.totalCommitted += paid;
  if (seat.stack === 0) seat.status = 'all-in';
  return paid;
}

function postForcedBet(seat: PokerPlayer, amount: number, label: string) {
  const paid = commitChips(seat, amount);
  seat.lastAction = `${label} ${paid}`;
}

function assignPositions(seats: PokerPlayer[], dealerIndex: number) {
  const activeCount = seats.filter((seat) => seat.status !== 'out').length;
  const labels = activeCount === 2 ? ['BTN/SB', 'BB'] : ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
  let cursor = dealerIndex;
  for (let offset = 0; offset < activeCount; offset += 1) {
    if (offset > 0) cursor = findNextIndex(seats, cursor, (seat) => seat.status !== 'out')!;
    seats[cursor]!.position = labels[offset] ?? `UTG+${offset - 2}`;
  }
}

function findNextIndex(
  seats: PokerPlayer[],
  fromIndex: number,
  predicate: (seat: PokerPlayer) => boolean,
) {
  for (let offset = 1; offset <= seats.length; offset += 1) {
    const index = (fromIndex + offset) % seats.length;
    if (predicate(seats[index]!)) return index;
  }
  return null;
}

function estimateHandStrength(holeCards: PokerCard[], board: PokerCard[]) {
  if (board.length >= 3) {
    const value = evaluateBestHand([...holeCards, ...board]);
    return Math.min(0.98, 0.12 + value.category * 0.11 + (value.kickers[0] ?? 0) / 100);
  }
  const [first, second] = holeCards;
  if (!first || !second) return 0.2;
  const pairBonus = first.rank === second.rank ? 0.35 : 0;
  const suitedBonus = first.suit === second.suit ? 0.07 : 0;
  const connectedBonus = Math.abs(first.rank - second.rank) <= 2 ? 0.06 : 0;
  return Math.min(0.95, (first.rank + second.rank) / 32 + pairBonus + suitedBonus + connectedBonus);
}

function evaluatePartialHand(cards: PokerCard[]): PokerHandValue {
  const counts = rankCounts(cards);
  const groups = [...counts.entries()].sort(
    ([leftRank, leftCount], [rightRank, rightCount]) =>
      rightCount - leftCount || rightRank - leftRank,
  );
  const category =
    groups[0]?.[1] === 4 ? 7 : groups[0]?.[1] === 3 ? 3 : groups[0]?.[1] === 2 ? 1 : 0;
  return {
    category,
    kickers: groups.flatMap(([rank, count]) => Array(count).fill(rank)),
    label: HAND_LABELS[category],
  };
}

function evaluateFiveCardHand(cards: PokerCard[]): PokerHandValue {
  const ranks = cards.map((item) => item.rank).sort((left, right) => right - left);
  const counts = rankCounts(cards);
  const groups = [...counts.entries()].sort(
    ([leftRank, leftCount], [rightRank, rightCount]) =>
      rightCount - leftCount || rightRank - leftRank,
  );
  const flush = cards.every((item) => item.suit === cards[0]!.suit);
  const straightHigh = getStraightHigh(ranks);
  let category = 0;
  let kickers: number[] = ranks;
  if (flush && straightHigh) {
    category = 8;
    kickers = [straightHigh];
  } else if (groups[0]?.[1] === 4) {
    category = 7;
    kickers = [groups[0][0], groups[1]![0]];
  } else if (groups[0]?.[1] === 3 && groups[1]?.[1] === 2) {
    category = 6;
    kickers = [groups[0][0], groups[1][0]];
  } else if (flush) {
    category = 5;
  } else if (straightHigh) {
    category = 4;
    kickers = [straightHigh];
  } else if (groups[0]?.[1] === 3) {
    category = 3;
    kickers = [
      groups[0][0],
      ...groups
        .slice(1)
        .map(([rank]) => rank)
        .sort((a, b) => b - a),
    ];
  } else if (groups[0]?.[1] === 2 && groups[1]?.[1] === 2) {
    category = 2;
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    kickers = [...pairs, groups[2]![0]];
  } else if (groups[0]?.[1] === 2) {
    category = 1;
    kickers = [
      groups[0][0],
      ...groups
        .slice(1)
        .map(([rank]) => rank)
        .sort((a, b) => b - a),
    ];
  }
  return { category, kickers, label: HAND_LABELS[category] };
}

function getStraightHigh(ranks: number[]) {
  const unique = [...new Set(ranks)].sort((left, right) => right - left);
  if (unique.includes(14)) unique.push(1);
  for (let index = 0; index <= unique.length - 5; index += 1) {
    if (unique[index]! - unique[index + 4]! === 4) return unique[index]!;
  }
  return 0;
}

function rankCounts(cards: PokerCard[]) {
  const counts = new Map<number, number>();
  for (const item of cards) counts.set(item.rank, (counts.get(item.rank) ?? 0) + 1);
  return counts;
}

function chooseFive(cards: PokerCard[]) {
  const combinations: PokerCard[][] = [];
  for (let first = 0; first < cards.length - 4; first += 1) {
    for (let second = first + 1; second < cards.length - 3; second += 1) {
      for (let third = second + 1; third < cards.length - 2; third += 1) {
        for (let fourth = third + 1; fourth < cards.length - 1; fourth += 1) {
          for (let fifth = fourth + 1; fifth < cards.length; fifth += 1) {
            combinations.push([
              cards[first]!,
              cards[second]!,
              cards[third]!,
              cards[fourth]!,
              cards[fifth]!,
            ]);
          }
        }
      }
    }
  }
  return combinations;
}

function createDeck() {
  const suits: PokerSuit[] = ['club', 'diamond', 'heart', 'spade'];
  const deck: PokerCard[] = [];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank += 1) deck.push(card(rank as PokerRank, suit));
  }
  return deck;
}

function shuffleDeck(deck: PokerCard[], seed: number) {
  const shuffled = [...deck];
  let value = seed >>> 0;
  const random = () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

function deterministicRoll(value: string) {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function makeLog(
  player: string,
  position: string,
  action: string,
  amount: number | null,
  pot: number,
  emphasis?: PokerLogEntry['emphasis'],
): PokerLogEntry {
  const offset = SHOWCASE_LOG_COUNTER++;
  return {
    action,
    amount,
    emphasis,
    id: `${player}-${action}-${offset}`,
    player,
    position,
    pot,
    time: `20:${String(15 + Math.floor(offset / 50)).padStart(2, '0')}:${String(30 + (offset % 30)).padStart(2, '0')}`,
  };
}

function card(rank: PokerRank, suit: PokerSuit): PokerCard {
  return { rank, suit };
}

function sameCard(left: PokerCard, right: PokerCard) {
  return left.rank === right.rank && left.suit === right.suit;
}

function roundToBlind(value: number, blind: number) {
  return Math.max(blind, Math.round(value / blind) * blind);
}

function streetLabel(street: PokerStreet) {
  return {
    flop: '翻牌 · 发出三张公共牌',
    preflop: '翻牌前',
    river: '河牌 · 最后一张公共牌',
    showdown: '摊牌',
    turn: '转牌 · 第四张公共牌',
  }[street];
}
