export type WeeklyShowCategory = '全部' | '产品创意' | '技术实践' | '文化生活' | '设计作品' | '经验分享';

export interface WeeklyShowEntry {
  author: string;
  category: Exclude<WeeklyShowCategory, '全部'>;
  coffees: number;
  employeeId: string;
  flowers: number;
  id: string;
  likes: number;
  score: number;
  spritePosition: string;
  title: string;
}

export const weeklyShowCategories: WeeklyShowCategory[] = [
  '全部',
  '产品创意',
  '技术实践',
  '文化生活',
  '设计作品',
  '经验分享',
];

export const weeklyShowEntries: WeeklyShowEntry[] = [
  {
    author: '林深不知处',
    category: '产品创意',
    coffees: 128,
    employeeId: '10025',
    flowers: 86,
    id: 'whale-realm',
    likes: 986,
    score: 1200,
    spritePosition: '0% 0%',
    title: '鲸落之境',
  },
  {
    author: '廖与森',
    category: '文化生活',
    coffees: 92,
    employeeId: '10038',
    flowers: 64,
    id: 'summer-train',
    likes: 830,
    score: 986,
    spritePosition: '50% 0%',
    title: '夏日列车',
  },
  {
    author: '云中漫步',
    category: '文化生活',
    coffees: 76,
    employeeId: '10012',
    flowers: 58,
    id: 'dusk-mail',
    likes: 739,
    score: 873,
    spritePosition: '100% 0%',
    title: '黄昏邮局',
  },
  {
    author: '一格设计',
    category: '设计作品',
    coffees: 62,
    employeeId: '10045',
    flowers: 48,
    id: 'light-composition',
    likes: 632,
    score: 742,
    spritePosition: '0% 100%',
    title: '光之构成',
  },
  {
    author: '念白',
    category: '产品创意',
    coffees: 55,
    employeeId: '10031',
    flowers: 41,
    id: 'future-library',
    likes: 500,
    score: 596,
    spritePosition: '50% 100%',
    title: '未来图书馆',
  },
  {
    author: '苏小暖',
    category: '文化生活',
    coffees: 44,
    employeeId: '10017',
    flowers: 36,
    id: 'morning-light',
    likes: 393,
    score: 473,
    spritePosition: '100% 100%',
    title: '晨露微光',
  },
];

export const categoryStyles: Record<Exclude<WeeklyShowCategory, '全部'>, string> = {
  产品创意: 'bg-[#eee9ff] text-[#7660de]',
  技术实践: 'bg-[#e5f1ff] text-[#347fd0]',
  文化生活: 'bg-[#eaf5e7] text-[#60a354]',
  设计作品: 'bg-[#fff0e1] text-[#d58a3a]',
  经验分享: 'bg-[#e8f4f4] text-[#4b969a]',
};
