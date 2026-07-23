import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Switch,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useSnackbar } from 'notistack';
import { useProducts, useDeleteProduct, useToggleProductVisibility, useToggleProductEnabled } from './useProducts';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Product } from '@/types/firestore';

export default function ProductsListPage() {
  const { data: products = [], isLoading, isError } = useProducts();
  const deleteMutation = useDeleteProduct();
  const visibilityMutation = useToggleProductVisibility();
  const enabledMutation = useToggleProductEnabled();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.material.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [products, search]);

  const minPrice = (p: Product) => (p.sizes?.length ? Math.min(...p.sizes.map((s) => s.pricePerPiece)) : 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      enqueueSnackbar(`Deleted "${deleteTarget.name}"`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to delete product', { variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}>
          Add Product
        </Button>
      </Box>

      {isError && <Alert severity="error">Failed to load products.</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products by name, material, or id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price From</TableCell>
                <TableCell>MOQ</TableCell>
                <TableCell align="center">In Stock</TableCell>
                <TableCell align="center">Visible</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar variant="rounded" src={p.imageUrl} sx={{ width: 44, height: 44 }}>
                        {p.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{p.categoryId ? <Chip label={p.categoryId} size="small" /> : '—'}</TableCell>
                  <TableCell>₹{minPrice(p).toFixed(2)}</TableCell>
                  <TableCell>{p.moq}</TableCell>
                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={p.inStock}
                      onChange={(e) => enabledMutation.mutate({ id: p.id, inStock: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={p.visible === false ? 'Hidden from Buyer App' : 'Visible in Buyer App'}>
                      <IconButton
                        size="small"
                        onClick={() => visibilityMutation.mutate({ id: p.id, visible: p.visible === false })}
                      >
                        {p.visible === false ? (
                          <VisibilityOffIcon fontSize="small" color="disabled" />
                        ) : (
                          <VisibilityIcon fontSize="small" color="primary" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuProduct(p);
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            if (menuProduct) navigate(`/products/${menuProduct.id}`);
            setMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menuProduct);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={`This will permanently delete "${deleteTarget?.name}" and remove it from the Buyer App catalog. This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
