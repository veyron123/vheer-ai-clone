import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { affiliateAPI } from '../../services/affiliateAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AffiliateReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30days');
  const [analytics, setAnalytics] = useState({
    summary: {},
    dailyStats: [],
    linkPerformance: [],
    topReferrals: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await affiliateAPI.getAnalytics({ period });
      setAnalytics(data);
    } catch (err) {
      setError('Не удалось загрузить аналитику');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Подготовка данных для графиков
  const chartData = analytics.dailyStats?.map(stat => ({
    date: formatDate(stat.date),
    клики: stat.clicks,
    регистрации: stat.signups,
    клиенты: stat.customers,
    доход: stat.revenue,
    комиссии: stat.commissions
  })) || [];

  const pieData = analytics.linkPerformance?.slice(0, 5).map(link => ({
    name: link.alias || 'Основная',
    value: link.clickCount || 0
  })) || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <Box>
      {/* Фильтр периода */}
      <Box mb={3} display="flex" justifyContent="flex-end">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Период</InputLabel>
          <Select
            value={period}
            label="Период"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7days">7 дней</MenuItem>
            <MenuItem value="30days">30 дней</MenuItem>
            <MenuItem value="90days">90 дней</MenuItem>
            <MenuItem value="year">Год</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Сводка */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2">
                Всего кликов
              </Typography>
              <Typography variant="h5">
                {formatNumber(analytics.summary?.totalClicks)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2">
                Регистрации
              </Typography>
              <Typography variant="h5">
                {formatNumber(analytics.summary?.totalSignups)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2">
                Клиенты
              </Typography>
              <Typography variant="h5">
                {formatNumber(analytics.summary?.totalCustomers)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2">
                Конверсия
              </Typography>
              <Typography variant="h5">
                {analytics.summary?.conversionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2">
                Комиссии
              </Typography>
              <Typography variant="h5">
                {formatCurrency(analytics.summary?.totalCommissions)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* График трафика */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Динамика трафика
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="клики" 
              stackId="1"
              stroke="#8884d8" 
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="регистрации" 
              stackId="1"
              stroke="#82ca9d" 
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="клиенты" 
              stackId="1"
              stroke="#ffc658" 
              fill="#ffc658"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* График доходов */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Доходы и комиссии
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="доход" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="комиссии" 
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Grid container spacing={3}>
        {/* Эффективность ссылок */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Эффективность ссылок
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ссылка</TableCell>
                    <TableCell align="right">Клики</TableCell>
                    <TableCell align="right">Конверсии</TableCell>
                    <TableCell align="right">CTR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.linkPerformance?.slice(0, 5).map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {link.alias || 'Основная'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(link.clickCount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(link.conversionCount)}
                      </TableCell>
                      <TableCell align="right">
                        {link.clickCount > 0
                          ? `${((link.conversionCount / link.clickCount) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Распределение трафика */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Распределение трафика
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Топ рефералы */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Топ рефералы
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Дата регистрации</TableCell>
                    <TableCell align="right">LTV</TableCell>
                    <TableCell align="right">Ваша комиссия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topReferrals?.map((referral) => {
                    const totalCommission = referral.commissions?.reduce(
                      (sum, c) => sum + (c.status !== 'cancelled' ? c.amount : 0), 
                      0
                    ) || 0;
                    
                    return (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {referral.user?.fullName || '-'}
                        </TableCell>
                        <TableCell>
                          {referral.user?.email}
                        </TableCell>
                        <TableCell align="center">
                          {referral.firstPaymentDate
                            ? new Date(referral.firstPaymentDate).toLocaleDateString('ru-RU')
                            : '-'
                          }
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(referral.lifetimeValue)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" fontWeight="bold">
                            {formatCurrency(totalCommission)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AffiliateReports;