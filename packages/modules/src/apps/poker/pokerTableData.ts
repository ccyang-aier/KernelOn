import type { CSSProperties } from 'react';

export const pokerAssetRoot = '/kernelon-assets/apps/poker';

export type PokerSeat = {
  id: string;
  name: string;
  stack: string;
  avatar: string;
  position: string;
  timer: string;
  cardCount: number;
  bet: string;
  layout: CSSProperties;
  tone?: 'hero' | 'standard';
};

export const pokerSeats: PokerSeat[] = [
  {
    avatar: `${pokerAssetRoot}/avatar-lion.webp`,
    bet: '20',
    cardCount: 2,
    id: 'lion',
    layout: { left: '38.2%', top: '2.6%' },
    name: 'LionKing',
    position: 'UTG',
    stack: '4,560',
    timer: '12s',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-wolf.webp`,
    bet: '20',
    cardCount: 2,
    id: 'wolf',
    layout: { left: '6.8%', top: '21.5%' },
    name: '银河狼王',
    position: 'BB',
    stack: '3,210',
    timer: '14s',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-bear.webp`,
    bet: '20',
    cardCount: 2,
    id: 'bear',
    layout: { right: '3.1%', top: '21.7%' },
    name: '北极熊先生',
    position: 'UTG+1',
    stack: '6,230',
    timer: '16s',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-panther.webp`,
    bet: '10',
    cardCount: 0,
    id: 'panther',
    layout: { left: '1.8%', top: '54%' },
    name: '暗夜黑豹',
    position: 'SB',
    stack: '7,890',
    timer: '10s',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-eagle.webp`,
    bet: '240',
    cardCount: 2,
    id: 'eagle',
    layout: { right: '0.6%', top: '54.5%' },
    name: '老鹰之眼',
    position: 'HJ',
    stack: '5,980',
    timer: '08s',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-deer.webp`,
    bet: '',
    cardCount: 0,
    id: 'hero',
    layout: { bottom: '11.7%', left: '35.8%' },
    name: '你',
    position: 'CO',
    stack: '8,640',
    timer: '20s',
    tone: 'hero',
  },
];

export const handHistory = [
  ['20:15:30', '银河狼王', 'BB', '过牌', '–', '0'],
  ['20:15:32', '暗夜黑豹', 'SB', '下注', '10', '10'],
  ['20:15:35', 'LionKing', 'UTG', '跟注', '10', '20'],
  ['20:15:38', '北极熊先生', 'UTG+1', '跟注', '10', '30'],
  ['20:15:41', '老鹰之眼', 'HJ', '加注', '240', '270'],
] as const;

export const reactionOptions = [
  { count: 8, label: '精彩' },
  { count: 6, label: '赞' },
  { count: 2, label: '惊讶' },
  { count: 1, label: '鼓掌' },
  { count: 1, label: '思考' },
] as const;
