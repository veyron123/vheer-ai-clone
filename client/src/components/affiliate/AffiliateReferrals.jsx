import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { affiliateAPI } from '../../services/affiliateAPI';

const AffiliateReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, [page, rowsPerPage, statusFilter]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await affiliateAPI.getReferrals({
        status: statusFilter || undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      setReferrals(data.referrals);
      setTotal(data.total);
    } catch (err) {
      setError('Не удалось загрузить рефералов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signup': return 'default';
      case 'trial': return 'info';
      case 'customer': return 'success';
      case 'churned': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'signup': return 'Регистрация';
      case 'trial': return 'Пробный';
      case 'customer': return 'Клиент';
      case 'churned': return 'Отток';
      default: return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Рефералы
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={statusFilter}
            label="Статус"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="signup">Регистрация</MenuItem>
            <MenuItem value="trial">Пробный</MenuItem>
            <MenuItem value="customer">Клиент</MenuItem>
            <MenuItem value="churned">Отток</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell align="center">Дата регистрации</TableCell>
                  <TableCell align="center">Первый платеж</TableCell>
                  <TableCell align="center">Последний платеж</TableCell>
                  <TableCell align="right">LTV</TableCell>
                  <TableCell>Источник</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {referral.user?.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {referral.user?.fullName || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(referral.status)}
                        color={getStatusColor(referral.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(referral.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(referral.firstPaymentDate)}
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(referral.lastPaymentDate)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(referral.lifetimeValue)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {referral.link?.alias || 'Прямая ссылка'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {referrals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Нет рефералов
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
          />
        </>
      )}

      {/* Статистика */}
      <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="subtitle2" gutterBottom>
          Статистика рефералов:
        </Typography>
        <Box display="flex" gap={3}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Всего рефералов
            </Typography>
            <Typography variant="h6">
              {total}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Активных клиентов
            </Typography>
            <Typography variant="h6">
              {referrals.filter(r => r.status === 'customer').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Конверсия в клиенты
            </Typography>
            <Typography variant="h6">
              {total > 0 
                ? `${((referrals.filter(r => r.status === 'customer').length / total) * 100).toFixed(1)}%`
                : '0%'
              }
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default AffiliateReferrals;