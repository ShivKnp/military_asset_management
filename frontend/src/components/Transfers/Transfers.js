import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Chip from '@mui/material/Chip';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Check as ApproveIcon, Close as RejectIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import CreateTransfer from './CreateTransfer';

const Transfers = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('transferDate');
    const [order, setOrder] = useState('desc');
    const [statusFilter, setStatusFilter] = useState('');
    const [baseFilter, setBaseFilter] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { user } = useAuth();

     const queryClient = useQueryClient();

    const approveTransferMutation = useMutation({
        mutationFn: (transferId) => api.put(`/transfers/${transferId}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries(['transfers']);
            handleShowSnackbar('Transfer approved successfully!');
        },
        onError: (error) => {
            handleShowSnackbar(error.response?.data?.error || 'Failed to approve transfer', 'error');
        }
    });

    const rejectTransferMutation = useMutation({
        mutationFn: (transferId) => api.put(`/transfers/${transferId}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries(['transfers']);
            handleShowSnackbar('Transfer rejected successfully!');
        },
        onError: (error) => {
            handleShowSnackbar(error.response?.data?.error || 'Failed to reject transfer', 'error');
        }
    });

    const handleApprove = (transferId) => {
        approveTransferMutation.mutate(transferId);
    };

    const handleReject = (transferId) => {
        rejectTransferMutation.mutate(transferId);
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['transfers', page, rowsPerPage, sortBy, order, statusFilter, baseFilter],
        queryFn: () => api.get(`/transfers?page=${page + 1}&limit=${rowsPerPage}&sortBy=${sortBy}&order=${order}&status=${statusFilter}&baseId=${baseFilter}`)
            .then(res => res.data),
    });

    const { data: basesData } = useQuery({
        queryKey: ['bases'],
        queryFn: () => api.get('/bases').then(res => res.data?.bases || []),
    });

    const handleShowSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSort = (property) => {
        const isAsc = sortBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setSortBy(property);
    };

    if (error) {
        return <Alert severity="error">Error loading transfers: {error.message}</Alert>;
    }

    

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Asset Transfers</Typography>
            <Typography variant="body1" gutterBottom>
                Track and manage asset transfers between bases
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Base</InputLabel>
                            <Select
                                value={baseFilter}
                                label="Base"
                                onChange={(e) => setBaseFilter(e.target.value)}
                            >
                                <MenuItem value="">All Bases</MenuItem>
                                {basesData?.map((base) => (
                                    <MenuItem key={base._id} value={base._id}>
                                        {base.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateModalOpen(true)}
                            fullWidth
                        >
                            New Transfer
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell onClick={() => handleSort('transferDate')} sx={{ cursor: 'pointer' }}>
                                Transfer Date
                            </TableCell>
                            <TableCell>From Base</TableCell>
                            <TableCell>To Base</TableCell>
                            <TableCell>Equipment Type</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : data?.transfers?.map((transfer) => (
                            <TableRow key={transfer._id}>
                                <TableCell>
                                    {new Date(transfer.transferDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{transfer.fromBase?.name}</TableCell>
                                <TableCell>{transfer.toBase?.name}</TableCell>
                                <TableCell>{transfer.equipmentType?.name}</TableCell>
                                <TableCell>{transfer.quantity}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={transfer.status}
                                        color={
                                            transfer.status === 'approved' ? 'success' :
                                            transfer.status === 'rejected' ? 'error' :
                                            transfer.status === 'completed' ? 'primary' : 'warning'
                                        }
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {transfer.status === 'pending' && (
        <>
            <Tooltip title="Approve">
                <IconButton 
                    size="small"
                    onClick={() => handleApprove(transfer._id)}
                    disabled={approveTransferMutation.isLoading}
                >
                    <ApproveIcon color="success" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Reject">
                <IconButton 
                    size="small"
                    onClick={() => handleReject(transfer._id)}
                    disabled={rejectTransferMutation.isLoading}
                >
                    <RejectIcon color="error" />
                </IconButton>
            </Tooltip>
        </>
    )}
                                    <Tooltip title="View Details">
                                        <IconButton size="small">
                                            <EditIcon color="primary" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {data && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data.totalTransfers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            )}

            <CreateTransfer
                open={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={(message) => {
                    handleShowSnackbar(message);
                    setCreateModalOpen(false);
                }}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Transfers;