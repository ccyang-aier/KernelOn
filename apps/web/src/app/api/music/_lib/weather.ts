interface GeocodingResult {
  latitude?: number;
  longitude?: number;
  name?: string;
  timezone?: string;
}

interface CurrentWeather {
  apparent_temperature?: number;
  temperature_2m?: number;
  weather_code?: number;
}

const fallbackLocation = { latitude: 31.2304, longitude: 121.4737, name: '上海' };

export async function resolveWeatherMood(city: string) {
  const location = await geocode(city).catch(() => fallbackLocation);
  const target = new URL('https://api.open-meteo.com/v1/forecast');
  target.search = new URLSearchParams({
    current: 'temperature_2m,apparent_temperature,weather_code',
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: 'auto',
  }).toString();
  const response = await fetch(target, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`天气服务请求失败 (${response.status})`);
  const body = (await response.json()) as { current?: CurrentWeather };
  const current = body.current ?? {};
  const mood = moodForCode(current.weather_code ?? 0, new Date().getHours());
  return {
    city: (location.name ?? city) || fallbackLocation.name,
    condition: mood.condition,
    mood: mood.name,
    queries: mood.queries,
    temperature: Math.round(current.temperature_2m ?? current.apparent_temperature ?? 20),
    title: mood.title,
  };
}

async function geocode(city: string) {
  const query = city.trim() || fallbackLocation.name;
  const target = new URL('https://geocoding-api.open-meteo.com/v1/search');
  target.search = new URLSearchParams({ count: '1', language: 'zh', name: query }).toString();
  const response = await fetch(target, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`城市查询失败 (${response.status})`);
  const body = (await response.json()) as { results?: GeocodingResult[] };
  const first = body.results?.[0];
  if (!first?.latitude || !first.longitude) throw new Error('没有找到天气城市');
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    name: first.name ?? query,
  };
}

function moodForCode(code: number, hour: number) {
  const night = hour < 6 || hour >= 19;
  if (code >= 95) {
    return {
      condition: '雷雨',
      name: '强烈与释放',
      queries: ['氛围电子 雷雨', '后摇 现场', '暗潮 摇滚'],
      title: '雷雨电影电台',
    };
  }
  if (code >= 51) {
    return {
      condition: code >= 71 ? '降雪' : '降雨',
      name: '潮湿与安静',
      queries: ['雨天 华语', '爵士 雨夜', '独立民谣 安静'],
      title: code >= 71 ? '雪落白噪电台' : '雨幕慢放电台',
    };
  }
  if (code >= 2) {
    return {
      condition: '多云',
      name: '松弛与漫游',
      queries: ['indie pop 漫游', '城市 慢摇', '华语 治愈'],
      title: '云层漫游电台',
    };
  }
  if (night) {
    return {
      condition: '晴夜',
      name: '清澈与夜航',
      queries: ['夜晚 星河', 'city pop 夜景', '氛围电子 夜航'],
      title: '晴夜星河电台',
    };
  }
  return {
    condition: '晴朗',
    name: '明亮与轻快',
    queries: ['晴天 华语', '轻快 流行', '阳光 indie pop'],
    title: '晴日散步电台',
  };
}
