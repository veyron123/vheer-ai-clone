import express from 'express';

const router = express.Router();

// Generate dynamic sitemap
router.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://vheer.ai';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/anime-generator', changefreq: 'weekly', priority: '0.9' },
    { loc: '/gallery', changefreq: 'daily', priority: '0.8' },
    { loc: '/pricing', changefreq: 'monthly', priority: '0.7' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    { loc: '/login', changefreq: 'yearly', priority: '0.5' },
    { loc: '/register', changefreq: 'yearly', priority: '0.5' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' }
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://vheer.ai';
  
  const robots = `# Vheer AI Robots.txt
# ${baseUrl}

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

Sitemap: ${baseUrl}/sitemap.xml

# Major Search Engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /`;
  
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;