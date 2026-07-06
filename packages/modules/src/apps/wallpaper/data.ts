import type {
  CategoryOption,
  HeroSlide,
  RecommendedWallpaper,
  RecommendedWallpaperSection,
  WallpaperAsset,
} from './types';

export const viewLabels = {
  explore: 'Explore',
  home: 'Home',
  settings: 'Settings',
} as const;

export const popularTags = [
  '4K',
  'Ultrawide',
  '21:9',
  '32:9',
  '16:9',
  'DesktopHut',
  'Loop',
  'Aesthetic',
];

export const categories: CategoryOption[] = [
  { id: 'All' },
  {
    id: 'Animals',
    image:
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Anime',
    image:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Cars',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Games',
    image:
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Graphics',
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Minimalist',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Movies',
    image:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Nature',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Other',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'People',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'PixelArt',
    image:
      'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'SciFi',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Space',
    image:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Winter',
    image:
      'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=96&h=96&auto=format&fit=crop',
  },
];

export const wallpaperLibrary: WallpaperAsset[] = [
  {
    id: 'overgrown-cathedral',
    title: 'Overgrown Cathedral',
    category: 'Other',
    author: 'Ark',
    authorInitial: 'A',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop',
    device: 'Ark',
    duration: '0:19',
    durationSeconds: 19,
    resolution: '3840x2160',
    size: '40 MB',
    likes: 53,
    tags: ['4K', '16:9', 'Loop', 'Aesthetic'],
    uploadedAt: '2026-07-05T16:30:00.000Z',
    liked: false,
  },
  {
    id: 'retrowaves',
    title: 'Retrowaves',
    category: 'Graphics',
    author: 'Samsung',
    authorInitial: 'S',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    device: 'SAMSUNG',
    duration: '0:09',
    durationSeconds: 9,
    resolution: '3840x2160',
    size: '31 MB',
    likes: 89,
    tags: ['4K', 'Ultrawide', 'Loop', 'Aesthetic'],
    uploadedAt: '2026-07-05T10:00:00.000Z',
    liked: true,
  },
  {
    id: 'lone-wanderer',
    title: 'Lone Wanderer - Anime',
    category: 'Anime',
    author: 'Froztyy',
    authorInitial: 'F',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    device: 'Froztyy',
    duration: '0:05',
    durationSeconds: 5,
    resolution: '3840x2160',
    size: '14 MB',
    likes: 3,
    tags: ['4K', '16:9', 'Anime', 'Loop'],
    uploadedAt: '2026-07-04T20:00:00.000Z',
    liked: false,
  },
  {
    id: 'silver-surfer',
    title: '4K Silver Surfer',
    category: 'Movies',
    author: '4k Silver Surfer.mp4',
    authorInitial: '4',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    device: 'MSI MP341CQ',
    duration: '0:15',
    durationSeconds: 15,
    resolution: '3840x2160',
    size: '28 MB',
    likes: 3,
    tags: ['4K', '21:9', 'DesktopHut'],
    uploadedAt: '2026-07-04T18:00:00.000Z',
    liked: false,
  },
  {
    id: 'motorcycle',
    title: 'Motorcycle',
    category: 'Other',
    author: 'TechGuy',
    authorInitial: 'T',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop',
    device: 'TechGuy',
    duration: '0:11',
    durationSeconds: 11,
    resolution: '3840x2160',
    size: '36 MB',
    likes: 1,
    tags: ['4K', '16:9', 'Loop'],
    uploadedAt: '2026-07-04T15:00:00.000Z',
    liked: false,
  },
  {
    id: 'ocean-school',
    title: 'Ocean',
    category: 'Nature',
    author: 'MSI MP341CQ',
    authorInitial: 'M',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    device: 'MSI MP341CQ',
    duration: '0:08',
    durationSeconds: 8,
    resolution: '5120x2880',
    size: '52 MB',
    likes: 18,
    tags: ['4K', 'Ultrawide', '21:9', 'Loop'],
    uploadedAt: '2026-07-04T09:15:00.000Z',
    liked: true,
  },
  {
    id: 'shirt-blue',
    title: 'Shirt Blue!',
    category: 'People',
    author: 'Samsung',
    authorInitial: 'S',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
    device: 'SAMSUNG',
    duration: '0:12',
    durationSeconds: 12,
    resolution: '3840x2160',
    size: '21 MB',
    likes: 42,
    tags: ['4K', '16:9', 'Aesthetic'],
    uploadedAt: '2026-07-03T22:00:00.000Z',
    liked: true,
  },
  {
    id: 'blue-panel',
    title: 'Blue Panel Loop',
    category: 'Minimalist',
    author: 'DesktopHut',
    authorInitial: 'D',
    image:
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop',
    device: 'LG ULTRAFINE',
    duration: '0:09',
    durationSeconds: 9,
    resolution: '3440x1440',
    size: '18 MB',
    likes: 7,
    tags: ['Ultrawide', '21:9', 'DesktopHut', 'Loop'],
    uploadedAt: '2026-07-03T18:20:00.000Z',
    liked: false,
  },
  {
    id: 'dark-sky',
    title: 'Dark Sky',
    category: 'Nature',
    author: 'Kinc',
    authorInitial: 'K',
    image:
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200&auto=format&fit=crop',
    device: 'Kinc',
    duration: '0:50',
    durationSeconds: 50,
    resolution: '3840x2160',
    size: '9 MB',
    likes: 336,
    tags: ['4K', '16:9', 'Aesthetic'],
    uploadedAt: '2026-07-02T08:00:00.000Z',
    liked: true,
  },
  {
    id: 'boat-floats',
    title: 'Boat Floats',
    category: 'Nature',
    author: 'Unknown',
    authorInitial: 'U',
    image:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop',
    device: 'Mac Studio',
    duration: '0:15',
    durationSeconds: 15,
    resolution: '3840x2160',
    size: '44 MB',
    likes: 157,
    tags: ['4K', '16:9', 'Loop'],
    uploadedAt: '2026-07-01T12:00:00.000Z',
    liked: true,
  },
  {
    id: 'bloodlight-face',
    title: 'Bloodlight Face',
    category: 'Anime',
    author: 'Unknown',
    authorInitial: 'U',
    image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
    device: 'ASUS PROART',
    duration: '0:14',
    durationSeconds: 14,
    resolution: '3840x2160',
    size: '24 MB',
    likes: 54,
    tags: ['4K', 'Anime', 'Aesthetic'],
    uploadedAt: '2026-06-30T22:10:00.000Z',
    liked: true,
  },
  {
    id: 'zelda-forest-temple',
    title: 'Zelda Forest Temple',
    category: 'Games',
    author: 'Hyunjinniee',
    authorInitial: 'H',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    device: 'HYUNJINNIEE',
    duration: '0:06',
    durationSeconds: 6,
    resolution: '3840x2160',
    size: '7 MB',
    likes: 102,
    tags: ['4K', '16:9', 'Loop'],
    uploadedAt: '2026-06-29T11:40:00.000Z',
    liked: true,
  },
  {
    id: 'snowy-village',
    title: 'Snowy Village',
    category: 'Winter',
    author: 'Unknown',
    authorInitial: 'U',
    image:
      'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=1200&auto=format&fit=crop',
    device: 'Studio Display',
    duration: '0:10',
    durationSeconds: 10,
    resolution: '1920x1080',
    size: '4 MB',
    likes: 91,
    tags: ['16:9', 'Loop', 'Winter'],
    uploadedAt: '2026-06-28T21:05:00.000Z',
    liked: true,
  },
  {
    id: 'cat-waves-tail',
    title: 'Cat Waves Its Tail',
    category: 'Minimalist',
    author: 'Unknown',
    authorInitial: 'U',
    image: '',
    device: 'BENQ',
    duration: '0:04',
    durationSeconds: 4,
    resolution: '1920x1080',
    size: '1 MB',
    likes: 186,
    tags: ['16:9', 'Minimalist', 'Loop'],
    uploadedAt: '2026-06-27T19:15:00.000Z',
    liked: true,
    placeholder: 'pink',
  },
  {
    id: 'abi-toads',
    title: 'Abi Toads',
    category: 'Other',
    author: 'Unknown',
    authorInitial: 'U',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop',
    device: 'SAMSUNG',
    duration: '0:12',
    durationSeconds: 12,
    resolution: '3840x2160',
    size: '127 MB',
    likes: 329,
    tags: ['4K', '16:9', 'DesktopHut'],
    uploadedAt: '2026-06-26T14:00:00.000Z',
    liked: true,
  },
  {
    id: 'red-runner',
    title: 'Red Runner',
    category: 'Cars',
    author: 'Nikko',
    authorInitial: 'N',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    device: 'Alienware',
    duration: '0:17',
    durationSeconds: 17,
    resolution: '3840x1600',
    size: '62 MB',
    likes: 74,
    tags: ['Ultrawide', '21:9', 'Aesthetic'],
    uploadedAt: '2026-06-25T09:30:00.000Z',
    liked: false,
  },
  {
    id: 'jelly-blue',
    title: 'Jelly Blue',
    category: 'PixelArt',
    author: 'BokehLab',
    authorInitial: 'B',
    image:
      'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1200&auto=format&fit=crop',
    device: 'Studio',
    duration: '0:13',
    durationSeconds: 13,
    resolution: '5120x1440',
    size: '71 MB',
    likes: 221,
    tags: ['32:9', 'Loop', 'Aesthetic'],
    uploadedAt: '2026-06-24T10:10:00.000Z',
    liked: false,
  },
];

export const heroSlides: HeroSlide[] = wallpaperLibrary.slice(0, 8).map((wallpaper) => ({
  ...wallpaper,
  categoryLabel: wallpaper.category.toUpperCase(),
  meta: [
    wallpaper.resolution,
    wallpaper.author,
    wallpaper.size,
    wallpaper.duration.replace('0:', '') + 's',
  ],
}));

const recommendationFallbackImage =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop';

const recommendationTitles = new Map<string, string>([
  ['bloodlight-face', 'Arcade Heat'],
  ['blue-panel', 'Blue Riot'],
  ['overgrown-cathedral', 'Cathedral Bloom'],
  ['silver-surfer', 'Silver Drift'],
  ['motorcycle', 'Forest Sprint'],
  ['dark-sky', 'Night Signal'],
  ['zelda-forest-temple', 'Temple Green'],
  ['snowy-village', 'Snow Drift'],
  ['boat-floats', 'Lake Pulse'],
  ['red-runner', 'Red Runner'],
  ['jelly-blue', 'Jelly Blue'],
  ['shirt-blue', 'Shirt Blue!'],
  ['lone-wanderer', 'Lone Wanderer'],
  ['abi-toads', 'Abi Toads'],
]);

const wallpaperById = new Map(wallpaperLibrary.map((wallpaper) => [wallpaper.id, wallpaper]));

export const recommendationSections: RecommendedWallpaperSection[] = [
  {
    id: 'recommended',
    title: 'Recommended For You',
    items: createRecommendedWallpapers([
      'retrowaves',
      'bloodlight-face',
      'blue-panel',
      'ocean-school',
    ]),
  },
  {
    id: 'fresh-4k-loops',
    title: 'Fresh 4K Loops',
    items: createRecommendedWallpapers([
      'overgrown-cathedral',
      'silver-surfer',
      'motorcycle',
      'dark-sky',
    ]),
  },
  {
    id: 'cinematic-worlds',
    title: 'Cinematic Worlds',
    items: createRecommendedWallpapers([
      'zelda-forest-temple',
      'snowy-village',
      'boat-floats',
      'red-runner',
    ]),
  },
  {
    id: 'ultrawide-moods',
    title: 'Ultrawide Moods',
    items: createRecommendedWallpapers(['jelly-blue', 'shirt-blue', 'lone-wanderer', 'abi-toads']),
  },
];

function createRecommendedWallpapers(wallpaperIds: string[]): RecommendedWallpaper[] {
  return wallpaperIds
    .map((wallpaperId) => wallpaperById.get(wallpaperId))
    .filter((wallpaper): wallpaper is WallpaperAsset => Boolean(wallpaper))
    .map((wallpaper) => ({
      id: `rec-${wallpaper.id}`,
      title: recommendationTitles.get(wallpaper.id) ?? wallpaper.title,
      device: wallpaper.device,
      image: wallpaper.image || recommendationFallbackImage,
      sourceWallpaperId: wallpaper.id,
    }));
}
