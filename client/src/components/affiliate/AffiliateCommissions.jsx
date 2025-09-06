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
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { affiliateAPI } from '../../services/affiliateAPI';

const AffiliateCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0
  });

  useEffect(() => {
    fetchCommissions();
  }, [page, rowsPerPage, statusFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await affiliateAPI.getCommissions({
        status: statusFilter || undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      setCommissions(data.commissions);
      setTotal(data.total);
      
      // Подсчет статистики
      const pendingAmount = data.commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);
      const approvedAmount = data.commissions
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + c.amount, 0);
      const paidAmount = data.commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);
      
      setStats({
        totalEarned: pendingAmount + approvedAmount + paidAmount,
        pendingAmount,
        approvedAmount,
        paidAmount
      });
    } catch (err) {
      setError('Не удалось загрузить комиссии');
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
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'approved': return <ApprovedIcon fontSize="small" />;
      case 'paid': return <MoneyIcon fontSize="small" />;
      case 'cancelled': return <CancelledIcon fontSize="small" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрено';
      case 'paid': return 'Выплачено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sale': return 'Продажа';
      case 'recurring': return 'Повторная';
      case 'bonus': return 'Бонус';
      default: return type;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
          Комиссии
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
            <MenuItem value="pending">Ожидает</MenuItem>
            <MenuItem value="approved">Одобрено</MenuItem>
            <MenuItem value="paid">Выплачено</MenuItem>
            <MenuItem value="cancelled">Отменено</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Карточки со статистикой */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Всего заработано
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalEarned)}
                  </Typography>
                </Box>
                <MoneyIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Ожидает
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.pendingAmount)}
                  </Typography>
                </Box>
                <PendingIcon color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Одобрено
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.approvedAmount)}
                  </Typography>
                </Box>
                <ApprovedIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    Выплачено
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.paidAmount)}
                  </Typography>
                </Box>
                <MoneyIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
                  <TableCell>Дата</TableCell>
                  <TableCell>Клиент</TableCell>
                  <TableCell align="center">Тип</TableCell>
                  <TableCell align="right">Сумма заказа</TableCell>
                  <TableCell align="center">Ставка</TableCell>
                  <TableCell align="right">Комиссия</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell>Примечания</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {formatDate(commission.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {commission.referral?.user?.email || '-'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {commission.referral?.user?.fullName || ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getTypeLabel(commission.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(commission.baseAmount)}
                    </TableCell>
                    <TableCell align="center">
                      {commission.commissionRate}%
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatCurrency(commission.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStatusIcon(commission.status)}
                        label={getStatusLabel(commission.status)}
                        color={getStatusColor(commission.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {commission.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {commissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Нет комиссий
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
    </Paper>
  );
};

export default AffiliateCommissions;