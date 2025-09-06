/**
 * Извлечь IP адрес из запроса
 * Учитывает прокси и заголовки
 */
export const getClientIP = (req) => {
  // Список заголовков для поиска реального IP
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded',
    'x-cluster-client-ip',
    'forwarded',
    'cf-connecting-ip', // Cloudflare
    'x-vercel-forwarded-for', // Vercel
    'x-forwarded-proto'
  ];

  // Проверяем заголовки
  for (const header of ipHeaders) {
    const headerValue = req.headers[header];
    if (headerValue) {
      // x-forwarded-for может содержать несколько IP через запятую
      // Берем первый (оригинальный клиентский IP)
      const ip = headerValue.split(',')[0].trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback к стандартным свойствам Express
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};

/**
 * Проверить валидность IP адреса
 */
export const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 регексп
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 регексп (базовая проверка)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Нормализовать IP адрес
 * Конвертирует IPv4-mapped IPv6 в обычный IPv4
 */
export const normalizeIP = (ip) => {
  if (!ip) return ip;
  
  // IPv4-mapped IPv6 (::ffff:192.168.1.1) -> IPv4 (192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  // IPv6 localhost -> IPv4 localhost
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  return ip;
};