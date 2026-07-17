import {
  CircleUserRound,
  Club,
  House,
  PlaySquare,
  Spade,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export const pokerAssetRoot = '/kernelon-assets/apps/poker';

export const pokerNavigation = [
  { Icon: House, id: 'lobby', label: '大厅' },
  { Icon: Spade, id: 'tables', label: '牌桌' },
  { Icon: Trophy, id: 'events', label: '赛事' },
  { Icon: Club, id: 'club', label: '俱乐部' },
  { Icon: PlaySquare, id: 'replay', label: '复盘' },
  { Icon: Star, id: 'collection', label: '收藏' },
  { Icon: CircleUserRound, id: 'profile', label: '我的' },
] as const satisfies ReadonlyArray<{ Icon: LucideIcon; id: string; label: string }>;

export const pokerFriends = [
  {
    avatar: `${pokerAssetRoot}/avatar-lion.webp`,
    id: 'lion-king',
    name: 'LionKing',
    status: '深筹常规桌',
    stakes: '10 / 20',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-panda.webp`,
    id: 'panda-pro',
    name: 'PandaPro',
    status: '标准常规桌',
    stakes: '5 / 10',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-wolf.webp`,
    id: 'wolfy',
    name: 'Wolfy',
    status: '短筹急速桌',
    stakes: '20 / 40',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-owl.webp`,
    id: 'night-owl',
    name: 'NightOwl',
    status: '深筹常规桌',
    stakes: '10 / 20',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-fox.webp`,
    id: 'mr-fox',
    name: 'Mr.Fox',
    status: '豪客私人桌',
    stakes: '50 / 100',
  },
] as const;

export const pokerTables = [
  {
    averagePot: '¥2,860',
    image: `${pokerAssetRoot}/table-green.webp`,
    name: '深筹常规桌',
    occupancy: '6 / 9',
    stakes: '10 / 20',
    tone: 'green',
  },
  {
    averagePot: '¥1,420',
    image: `${pokerAssetRoot}/table-blue.webp`,
    name: '标准常规桌',
    occupancy: '8 / 9',
    stakes: '5 / 10',
    tone: 'blue',
  },
  {
    averagePot: '¥3,680',
    image: `${pokerAssetRoot}/table-red.webp`,
    name: '短筹急速桌',
    occupancy: '5 / 6',
    stakes: '20 / 40',
    tone: 'red',
  },
  {
    averagePot: '¥8,950',
    image: `${pokerAssetRoot}/table-black.webp`,
    name: '豪客私人桌',
    occupancy: '3 / 6',
    stakes: '50 / 100',
    tone: 'black',
  },
] as const;

export const dailyTasks = [
  { current: 2, id: 'hands', label: '完成 3 场牌局', reward: '¥300', target: 3 },
  { current: 3200, id: 'chips', label: '赢得 5,000 筹码', reward: '¥200', target: 5000 },
  { current: 0, id: 'review', label: '完成 1 次手牌复盘', reward: '牌谱券', target: 1 },
] as const;
