import type { CSSProperties } from 'react';

export const pokerAssetRoot = '/kernelon-assets/apps/poker';

export type PokerSeatProfile = {
  id: string;
  name: string;
  avatar: string;
  layout: CSSProperties;
  tone?: 'hero' | 'standard';
};

export const pokerSeatProfiles: PokerSeatProfile[] = [
  {
    avatar: `${pokerAssetRoot}/avatar-lion.webp`,
    id: 'lion',
    layout: { left: '38.2%', top: '2.6%' },
    name: 'LionKing',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-wolf.webp`,
    id: 'wolf',
    layout: { left: '6.8%', top: '21.5%' },
    name: '银河狼王',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-bear.webp`,
    id: 'bear',
    layout: { right: '3.1%', top: '21.7%' },
    name: '北极熊先生',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-panther.webp`,
    id: 'panther',
    layout: { left: '1.8%', top: '54%' },
    name: '暗夜黑豹',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-eagle.webp`,
    id: 'eagle',
    layout: { right: '0.6%', top: '54.5%' },
    name: '老鹰之眼',
  },
  {
    avatar: `${pokerAssetRoot}/avatar-deer.webp`,
    id: 'hero',
    layout: { bottom: '11.7%', left: '35.8%' },
    name: '你',
    tone: 'hero',
  },
];

export const reactionOptions = [
  { count: 8, label: '精彩' },
  { count: 6, label: '赞' },
  { count: 2, label: '惊讶' },
  { count: 1, label: '鼓掌' },
  { count: 1, label: '思考' },
] as const;
