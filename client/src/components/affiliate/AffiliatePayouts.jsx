import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { affiliateAPI } from '../../services/affiliateAPI';

const AffiliatePayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openDialog, setOpenDialog] = useState(false);
  const [balance, setBalance] = useState(0);
  const [payoutRequest, setPayoutRequest] = useState({
    amount: '',
    method: 'paypal',
    payoutDetails: {
      email: '',
      accountNumber: '',
      notes: ''
    }
  });

  useEffect(() => {
    fetchPayouts();
    fetchBalance();
  }, [page, rowsPerPage]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await affiliateAPI.getPayouts({
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      setPayouts(data.payouts);
      setTotal(data.total);
    } catch (err) {
      setError('Не удалось загрузить выплаты');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const dashboard = await affiliateAPI.getDashboard();
      setBalance(dashboard.affiliate?.pendingPayouts || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const amount = parseFloat(payoutRequest.amount);
      
      if (amount < 50) {
        setError('Минимальная сумма для выплаты: $50');
        return;
      }
      
      if (amount > balance) {
        setError('Недостаточно средств для выплаты');
        return;
      }
      
      const result = await affiliateAPI.requestPayout({
        amount,
        method: payoutRequest.method,
        payoutDetails: payoutRequest.payoutDetails
      });
      
      setSuccess('Запрос на выплату успешно создан');
      setOpenDialog(false);
      setPayoutRequest({
        amount: '',
        method: 'paypal',
        payoutDetails: {
          email: '',
          accountNumber: '',
          notes: ''
        }
      });
      
      // Обновляем список и баланс
      fetchPayouts();
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при создании запроса на выплату');
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
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'completed': return 'Выплачено';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'bank': return 'Банковский перевод';
      case 'paypal': return 'PayPal';
      case 'wise': return 'Wise';
      case 'crypto': return 'Криптовалюта';
      default: return method;
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
          Выплаты
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={balance < 50}
        >
          Запросить выплату
        </Button>
      </Box>

      {/* Баланс */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Доступно для выплаты
              </Typography>
              <Typography variant="h4">
                {formatCurrency(balance)}
              </Typography>
              {balance < 50 && (
                <Typography variant="caption" color="warning.main">
                  Минимальная сумма для выплаты: $50
                </Typography>
              )}
            </Box>
            <PaymentIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
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
                  <TableCell>Дата запроса</TableCell>
                  <TableCell align="right">Сумма</TableCell>
                  <TableCell>Метод</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell>Транзакция</TableCell>
                  <TableCell>Дата выплаты</TableCell>
                  <TableCell>Примечания</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {formatDate(payout.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatCurrency(payout.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getMethodLabel(payout.method)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(payout.status)}
                        color={getStatusColor(payout.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {payout.transactionId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDate(payout.completedAt)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {payout.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {payouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Нет выплат
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

      {/* Диалог запроса выплаты */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Запросить выплату
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Доступно для выплаты: {formatCurrency(balance)}
            </Typography>
            <Typography variant="caption">
              Минимальная сумма: $50
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Сумма ($)"
            type="number"
            value={payoutRequest.amount}
            onChange={(e) => setPayoutRequest({ 
              ...payoutRequest, 
              amount: e.target.value 
            })}
            margin="normal"
            inputProps={{ min: 50, max: balance, step: 0.01 }}
            helperText={`Введите сумму от $50 до ${formatCurrency(balance)}`}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Метод выплаты</InputLabel>
            <Select
              value={payoutRequest.method}
              label="Метод выплаты"
              onChange={(e) => setPayoutRequest({ 
                ...payoutRequest, 
                method: e.target.value 
              })}
            >
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="bank">Банковский перевод</MenuItem>
              <MenuItem value="wise">Wise</MenuItem>
              <MenuItem value="crypto">Криптовалюта</MenuItem>
            </Select>
          </FormControl>
          
          {payoutRequest.method === 'paypal' && (
            <TextField
              fullWidth
              label="PayPal Email"
              type="email"
              value={payoutRequest.payoutDetails.email}
              onChange={(e) => setPayoutRequest({ 
                ...payoutRequest,
                payoutDetails: {
                  ...payoutRequest.payoutDetails,
                  email: e.target.value
                }
              })}
              margin="normal"
            />
          )}
          
          {payoutRequest.method === 'bank' && (
            <TextField
              fullWidth
              label="Номер счета / IBAN"
              value={payoutRequest.payoutDetails.accountNumber}
              onChange={(e) => setPayoutRequest({ 
                ...payoutRequest,
                payoutDetails: {
                  ...payoutRequest.payoutDetails,
                  accountNumber: e.target.value
                }
              })}
              margin="normal"
            />
          )}
          
          <TextField
            fullWidth
            label="Примечания (опционально)"
            multiline
            rows={2}
            value={payoutRequest.payoutDetails.notes}
            onChange={(e) => setPayoutRequest({ 
              ...payoutRequest,
              payoutDetails: {
                ...payoutRequest.payoutDetails,
                notes: e.target.value
              }
            })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleRequestPayout} 
            variant="contained"
            disabled={!payoutRequest.amount || parseFloat(payoutRequest.amount) < 50}
          >
            Запросить выплату
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AffiliatePayouts;