import { pokerAssetRoot } from './data';

export type PokerRoomFilter = 'all' | 'starting' | 'friends' | 'high';
export type PokerRoomStatus = 'forming' | 'playing';
export type PokerMatchMode = 'quick' | 'regular' | 'short' | 'tournament';
export type PokerMatchSeats = 6 | 9;
export type PokerMatchStakes = '5 / 10' | '10 / 20' | '20 / 40';

export type PokerRoom = {
  buyIn: string;
  capacity: number;
  filterTags: ReadonlyArray<Exclude<PokerRoomFilter, 'all'>>;
  host: string;
  hostAvatar: string;
  id: string;
  image: string;
  name: string;
  players: number;
  playerAvatars: ReadonlyArray<string>;
  stakes: string;
  status: PokerRoomStatus;
  statusLabel: string;
  waitLabel: string;
};

const avatar = (name: string) => `${pokerAssetRoot}/avatar-${name}.webp`;

export const pokerRoomFilters = [
  { id: 'all', label: '全部牌桌' },
  { id: 'starting', label: '即将开始' },
  { id: 'friends', label: '好友房' },
  { id: 'high', label: '高额桌' },
] as const satisfies ReadonlyArray<{ id: PokerRoomFilter; label: string }>;

export const pokerRooms: ReadonlyArray<PokerRoom> = [
  {
    buyIn: '¥10,000',
    capacity: 9,
    filterTags: [],
    host: 'LionKing',
    hostAvatar: avatar('lion'),
    id: 'crown-deep',
    image: `${pokerAssetRoot}/table-green.webp`,
    name: '王冠深筹',
    players: 7,
    playerAvatars: [
      avatar('lion'),
      avatar('panda'),
      avatar('wolf'),
      avatar('eagle'),
      avatar('fox'),
    ],
    stakes: '10 / 20',
    status: 'playing',
    statusLabel: '进行中',
    waitLabel: '预计等待 · 1 分钟',
  },
  {
    buyIn: '¥5,000',
    capacity: 9,
    filterTags: ['friends'],
    host: 'NightOwl',
    hostAvatar: avatar('wolf'),
    id: 'twilight-club',
    image: `${pokerAssetRoot}/table-black.webp`,
    name: '暮色俱乐部',
    players: 5,
    playerAvatars: [
      avatar('wolf'),
      avatar('lion'),
      avatar('fox'),
      avatar('eagle'),
      avatar('panda'),
    ],
    stakes: '5 / 10',
    status: 'playing',
    statusLabel: '进行中',
    waitLabel: '预计等待 · 30 秒',
  },
  {
    buyIn: '¥2,000',
    capacity: 9,
    filterTags: ['starting'],
    host: 'PandaPro',
    hostAvatar: avatar('panda'),
    id: 'emerald-regular',
    image: `${pokerAssetRoot}/table-green.webp`,
    name: '翡翠常规桌',
    players: 4,
    playerAvatars: [avatar('panda'), avatar('owl'), avatar('wolf'), avatar('fox')],
    stakes: '2 / 5',
    status: 'forming',
    statusLabel: '即将开始',
    waitLabel: '预计开始 · 45 秒',
  },
  {
    buyIn: '¥20,000',
    capacity: 6,
    filterTags: ['high'],
    host: '老鹰之眼',
    hostAvatar: avatar('eagle'),
    id: 'lightning-short',
    image: `${pokerAssetRoot}/table-red.webp`,
    name: '闪电短桌',
    players: 6,
    playerAvatars: [
      avatar('eagle'),
      avatar('lion'),
      avatar('bear'),
      avatar('panther'),
      avatar('wolf'),
    ],
    stakes: '20 / 40',
    status: 'playing',
    statusLabel: '进行中',
    waitLabel: '牌局已满',
  },
  {
    buyIn: '¥3,000',
    capacity: 6,
    filterTags: ['starting', 'friends'],
    host: 'Mr.Fox',
    hostAvatar: avatar('fox'),
    id: 'friends-party',
    image: `${pokerAssetRoot}/table-blue.webp`,
    name: '好友组局',
    players: 3,
    playerAvatars: [avatar('fox'), avatar('panda'), avatar('wolf')],
    stakes: '5 / 10',
    status: 'forming',
    statusLabel: '好友房',
    waitLabel: '等待 3 人',
  },
  {
    buyIn: '¥100,000',
    capacity: 6,
    filterTags: ['high'],
    host: '北极熊先生',
    hostAvatar: avatar('bear'),
    id: 'private-high',
    image: `${pokerAssetRoot}/table-black.webp`,
    name: '高额私人桌',
    players: 4,
    playerAvatars: [avatar('bear'), avatar('lion'), avatar('eagle'), avatar('panther')],
    stakes: '100 / 200',
    status: 'playing',
    statusLabel: '高额桌',
    waitLabel: '预计等待 · 2 分钟',
  },
];

export const pokerMatchModes = [
  { id: 'quick', label: '快速匹配' },
  { id: 'regular', label: '常规桌' },
  { id: 'short', label: '短桌' },
  { id: 'tournament', label: '锦标赛' },
] as const satisfies ReadonlyArray<{ id: PokerMatchMode; label: string }>;

export const pokerMatchStakes: ReadonlyArray<PokerMatchStakes> = ['5 / 10', '10 / 20', '20 / 40'];

export const matchingAvatars = [
  avatar('lion'),
  avatar('panda'),
  avatar('wolf'),
  avatar('eagle'),
  avatar('owl'),
  avatar('fox'),
] as const;
