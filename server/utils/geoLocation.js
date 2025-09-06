import axios from 'axios';

// Кэш для хранения результатов IP-геолокации (чтобы не делать повторные запросы)
const geoCache = new Map();

/**
 * Получить информацию о стране по IP адресу
 * Использует бесплатный API ip-api.com (до 1000 запросов в час)
 */
export const getCountryByIP = async (ip) => {
  try {
    // Проверяем локальные IP адреса
    if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: 'Local',
        countryCode: 'LO',
        flag: '🏠',
        city: 'Localhost'
      };
    }

    // Проверяем кэш
    if (geoCache.has(ip)) {
      return geoCache.get(ip);
    }

    // Запрос к IP API
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000,
      params: {
        fields: 'status,country,countryCode,city,query'
      }
    });

    if (response.data.status === 'success') {
      const geoData = {
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'UN',
        city: response.data.city || 'Unknown',
        flag: getCountryFlag(response.data.countryCode),
        ip: response.data.query
      };

      // Сохраняем в кэш на 1 час
      geoCache.set(ip, geoData);
      
      // Очищаем кэш через час
      setTimeout(() => {
        geoCache.delete(ip);
      }, 60 * 60 * 1000);

      return geoData;
    } else {
      console.warn(`Failed to get geo data for IP ${ip}:`, response.data);
      return {
        country: 'Unknown',
        countryCode: 'UN',
        flag: '🌍',
        city: 'Unknown'
      };
    }
  } catch (error) {
    console.error(`Error getting geo data for IP ${ip}:`, error.message);
    return {
      country: 'Unknown',
      countryCode: 'UN',
      flag: '🌍',
      city: 'Unknown'
    };
  }
};

/**
 * Получить флаг страны по коду страны
 */
export const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'LO') return '🏠';
  if (countryCode === 'UN') return '🌍';
  
  // Преобразуем код страны в emoji флага
  const flagMap = {
    'UA': '🇺🇦', // Украина
    'US': '🇺🇸', // США
    'RU': '🇷🇺', // Россия
    'DE': '🇩🇪', // Германия
    'FR': '🇫🇷', // Франция
    'GB': '🇬🇧', // Великобритания
    'IT': '🇮🇹', // Италия
    'ES': '🇪🇸', // Испания
    'CA': '🇨🇦', // Канада
    'AU': '🇦🇺', // Австралия
    'JP': '🇯🇵', // Япония
    'KR': '🇰🇷', // Южная Корея
    'CN': '🇨🇳', // Китай
    'IN': '🇮🇳', // Индия
    'BR': '🇧🇷', // Бразилия
    'MX': '🇲🇽', // Мексика
    'PL': '🇵🇱', // Польша
    'NL': '🇳🇱', // Нидерланды
    'SE': '🇸🇪', // Швеция
    'NO': '🇳🇴', // Норвегия
    'DK': '🇩🇰', // Дания
    'FI': '🇫🇮', // Финляндия
    'CH': '🇨🇭', // Швейцария
    'AT': '🇦🇹', // Австрия
    'BE': '🇧🇪', // Бельгия
    'PT': '🇵🇹', // Португалия
    'GR': '🇬🇷', // Греция
    'TR': '🇹🇷', // Турция
    'IL': '🇮🇱', // Израиль
    'SA': '🇸🇦', // Саудовская Аравия
    'AE': '🇦🇪', // ОАЭ
    'EG': '🇪🇬', // Египет
    'ZA': '🇿🇦', // ЮАР
    'NG': '🇳🇬', // Нигерия
    'KE': '🇰🇪', // Кения
    'TH': '🇹🇭', // Таиланд
    'VN': '🇻🇳', // Вьетнам
    'ID': '🇮🇩', // Индонезия
    'MY': '🇲🇾', // Малайзия
    'SG': '🇸🇬', // Сингапур
    'PH': '🇵🇭', // Филиппины
    'AR': '🇦🇷', // Аргентина
    'CL': '🇨🇱', // Чили
    'CO': '🇨🇴', // Колумбия
    'PE': '🇵🇪', // Перу
    'VE': '🇻🇪', // Венесуэла
  };

  return flagMap[countryCode] || '🌍';
};

/**
 * Пакетная обработка IP адресов для получения геоданных
 */
export const getBulkCountryData = async (ips) => {
  const promises = ips.map(ip => getCountryByIP(ip));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    ip: ips[index],
    geoData: result.status === 'fulfilled' ? result.value : {
      country: 'Unknown',
      countryCode: 'UN',
      flag: '🌍',
      city: 'Unknown'
    }
  }));
};

/**
 * Очистить кэш геолокации
 */
export const clearGeoCache = () => {
  geoCache.clear();
  console.log('Geo cache cleared');
};

/**
 * Получить статистику кэша
 */
export const getGeoCacheStats = () => {
  return {
    size: geoCache.size,
    keys: Array.from(geoCache.keys())
  };
};