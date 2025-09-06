import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Image as ImageIcon,
  Description as TextIcon,
  Code as CodeIcon,
  VideoLibrary as VideoIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const AffiliateAssets = () => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Можно добавить уведомление о копировании
  };

  const banners = [
    {
      id: 1,
      title: 'Баннер 728x90',
      type: 'Лидерборд',
      size: '728x90',
      image: '/affiliate/banner-728x90.png'
    },
    {
      id: 2,
      title: 'Баннер 300x250',
      type: 'Средний прямоугольник',
      size: '300x250',
      image: '/affiliate/banner-300x250.png'
    },
    {
      id: 3,
      title: 'Баннер 160x600',
      type: 'Широкий небоскреб',
      size: '160x600',
      image: '/affiliate/banner-160x600.png'
    },
    {
      id: 4,
      title: 'Баннер 320x50',
      type: 'Мобильный',
      size: '320x50',
      image: '/affiliate/banner-320x50.png'
    }
  ];

  const textTemplates = [
    {
      id: 1,
      title: 'Для блога',
      text: 'Создавайте потрясающие AI-изображения с помощью Simplified! Используйте передовые модели искусственного интеллекта для генерации логотипов, иллюстраций, фото и многого другого. Попробуйте бесплатно!'
    },
    {
      id: 2,
      title: 'Для соцсетей',
      text: '🎨 Хотите создавать крутые изображения с помощью AI? Simplified - ваш идеальный помощник! Генерация логотипов, фото и арта за секунды. Попробуйте бесплатно ➜'
    },
    {
      id: 3,
      title: 'Email рассылка',
      text: 'Откройте для себя мощь AI в создании визуального контента. С Simplified вы можете генерировать уникальные изображения, логотипы и иллюстрации за считанные секунды.'
    }
  ];

  const benefits = [
    '20% комиссии с каждого платежа',
    'Cookie-период 30 дней',
    'Регулярные выплаты',
    'Рекламные материалы',
    'Детальная статистика',
    'Поддержка партнеров'
  ];

  return (
    <Box>
      {/* Преимущества программы */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Преимущества партнерской программы
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box display="flex" alignItems="center">
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <Typography variant="body1">{benefit}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Баннеры */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Рекламные баннеры
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Используйте готовые баннеры для размещения на своем сайте или в рекламе
        </Alert>
        
        <Grid container spacing={3}>
          {banners.map((banner) => (
            <Grid item xs={12} sm={6} md={3} key={banner.id}>
              <Card>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box textAlign="center">
                    <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                    <Typography variant="caption" display="block" color="textSecondary">
                      {banner.size}
                    </Typography>
                  </Box>
                </CardMedia>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    {banner.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {banner.type}
                  </Typography>
                  <Box mt={2}>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      fullWidth
                      variant="outlined"
                    >
                      Скачать
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Текстовые шаблоны */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Текстовые шаблоны
        </Typography>
        
        <Grid container spacing={3}>
          {textTemplates.map((template) => (
            <Grid item xs={12} md={4} key={template.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Chip
                      icon={<TextIcon />}
                      label={template.title}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={() => copyToClipboard(template.text)}
                    >
                      Копировать
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {template.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* HTML код */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          HTML код для сайта
        </Typography>
        
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Вставьте этот код на свой сайт:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'grey.900',
                color: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            >
              {`<a href="https://simplified.com/?ref=YOUR_CODE" target="_blank">
  <img src="https://simplified.com/banner.jpg" 
       alt="Simplified - AI Image Generator" 
       width="728" height="90" />
</a>`}
            </Box>
            <Box mt={2}>
              <Button
                startIcon={<CopyIcon />}
                variant="contained"
                size="small"
                onClick={() => copyToClipboard(`<a href="https://simplified.com/?ref=YOUR_CODE" target="_blank"><img src="https://simplified.com/banner.jpg" alt="Simplified - AI Image Generator" width="728" height="90" /></a>`)}
              >
                Копировать код
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* Советы по продвижению */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Советы по продвижению
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Пишите обзоры"
              secondary="Создавайте подробные обзоры сервиса с примерами работ и кейсами использования"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Используйте соцсети"
              secondary="Делитесь примерами созданных изображений в Instagram, Pinterest, Twitter"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Создавайте видео"
              secondary="Записывайте туториалы и обзоры для YouTube и TikTok"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Email рассылки"
              secondary="Добавляйте партнерские ссылки в свои email рассылки"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="SEO оптимизация"
              secondary="Оптимизируйте статьи под поисковые запросы связанные с AI генерацией"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default AffiliateAssets;