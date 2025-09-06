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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { affiliateAPI } from '../../services/affiliateAPI';

const AffiliateLinks = ({ affiliate }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    alias: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const linksData = await affiliateAPI.getLinks();
      setLinks(linksData);
    } catch (err) {
      setError('Failed to load links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        alias: link.alias || '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: ''
      });
    } else {
      setEditingLink(null);
      setFormData({
        alias: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLink(null);
    setFormData({
      alias: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingLink) {
        // Обновление ссылки
        const updatedLink = await affiliateAPI.updateLink(editingLink.id, {
          alias: formData.alias,
          isActive: true
        });
        setLinks(links.map(link => link.id === editingLink.id ? updatedLink : link));
        setSnackbar({ open: true, message: 'Ссылка обновлена', severity: 'success' });
      } else {
        // Создание новой ссылки
        const newLink = await affiliateAPI.createLink(formData);
        setLinks([newLink, ...links]);
        setSnackbar({ open: true, message: 'Ссылка создана', severity: 'success' });
      }
      handleCloseDialog();
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Ошибка при сохранении ссылки', 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (linkId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту ссылку?')) {
      try {
        await affiliateAPI.deleteLink(linkId);
        setLinks(links.filter(link => link.id !== linkId));
        setSnackbar({ open: true, message: 'Ссылка удалена', severity: 'success' });
      } catch (err) {
        setSnackbar({ 
          open: true, 
          message: 'Ошибка при удалении ссылки', 
          severity: 'error' 
        });
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Ссылка скопирована', severity: 'success' });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num || 0);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Партнерские ссылки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={links.length >= 10}
        >
          Создать ссылку
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {links.length >= 10 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Достигнут максимум ссылок (10). Удалите неиспользуемые ссылки для создания новых.
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Алиас / URL</TableCell>
              <TableCell align="center">Клики</TableCell>
              <TableCell align="center">Регистрации</TableCell>
              <TableCell align="center">Конверсия</TableCell>
              <TableCell align="center">Статус</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {links.map((link) => {
              const conversionRate = link.clickCount > 0 
                ? ((link.conversionCount / link.clickCount) * 100).toFixed(2)
                : 0;

              return (
                <TableRow key={link.id}>
                  <TableCell>
                    <Box>
                      {link.alias && (
                        <Typography variant="subtitle2" fontWeight="bold">
                          {link.alias}
                        </Typography>
                      )}
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        maxWidth: 400, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {link.url}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(link.clickCount)}
                  </TableCell>
                  <TableCell align="center">
                    {formatNumber(link.conversionCount)}
                  </TableCell>
                  <TableCell align="center">
                    {conversionRate}%
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={link.isActive ? 'Активна' : 'Неактивна'}
                      color={link.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {link.isDefault && (
                      <Chip
                        label="По умолчанию"
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Скопировать ссылку">
                      <IconButton onClick={() => copyToClipboard(link.url)} size="small">
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="QR код">
                      <IconButton size="small">
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>
                    {!link.isDefault && (
                      <>
                        <Tooltip title="Редактировать">
                          <IconButton onClick={() => handleOpenDialog(link)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton onClick={() => handleDelete(link.id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {links.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    У вас пока нет партнерских ссылок
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог создания/редактирования ссылки */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLink ? 'Редактировать ссылку' : 'Создать новую ссылку'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Алиас (например: ai-logo-maker)"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="my-custom-link"
              helperText="Будет использоваться в URL: simplified.com/?fp=your-alias"
              margin="normal"
              inputProps={{
                pattern: '^[a-zA-Z0-9-_]+$'
              }}
            />
            
            {!editingLink && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  UTM параметры (опционально)
                </Typography>
                
                <TextField
                  fullWidth
                  label="UTM Source"
                  value={formData.utmSource}
                  onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                  placeholder="instagram"
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="UTM Medium"
                  value={formData.utmMedium}
                  onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                  placeholder="social"
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="UTM Campaign"
                  value={formData.utmCampaign}
                  onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  placeholder="summer-promo"
                  margin="normal"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLink ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AffiliateLinks;