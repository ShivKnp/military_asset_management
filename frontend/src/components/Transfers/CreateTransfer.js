import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    CircularProgress,
    Alert,
    Box,
    Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CreateTransfer = ({ open, onClose, onSuccess }) => {
    const { handleSubmit, control, watch, formState: { errors }, reset } = useForm();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [fromBaseId, setFromBaseId] = useState('');
    const [toBaseId, setToBaseId] = useState('');

    const { data: bases } = useQuery({
        queryKey: ['bases'],
        queryFn: () => api.get('/bases').then(res => res.data?.bases || []),
    });

    const { data: equipmentTypes } = useQuery({
        queryKey: ['equipmentTypes'],
        queryFn: () => api.get('/assets/categories').then(res => res.data),
    });

    const { data: assetsData, isLoading: assetsLoading } = useQuery({
        queryKey: ['assets', fromBaseId],
        queryFn: () => api.get(`/assets/base/${fromBaseId}`).then(res => res.data),
        enabled: !!fromBaseId,
    });

    const createTransferMutation = useMutation({
        mutationFn: (newTransfer) => api.post('/transfers/request', newTransfer),
        onSuccess: () => {
            queryClient.invalidateQueries(['transfers']);
            queryClient.invalidateQueries(['dashboard-metrics']);
            onSuccess('Transfer request created successfully!');
            reset();
        },
    });

    const onSubmit = (data) => {
        createTransferMutation.mutate({
            ...data,
            fromBaseId,
            toBaseId,
        });
    };

    const handleClose = () => {
        reset();
        setFromBaseId('');
        setToBaseId('');
        onClose();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Transfer Request</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        {createTransferMutation.isError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {createTransferMutation.error.response?.data?.error || 'Failed to create transfer'}
                            </Alert>
                        )}
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>From Base *</InputLabel>
                                    <Select
                                        value={fromBaseId}
                                        label="From Base *"
                                        onChange={(e) => setFromBaseId(e.target.value)}
                                        required
                                    >
                                        {bases?.map((base) => (
                                            <MenuItem key={base._id} value={base._id}>
                                                {base.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>To Base *</InputLabel>
                                    <Select
                                        value={toBaseId}
                                        label="To Base *"
                                        onChange={(e) => setToBaseId(e.target.value)}
                                        required
                                        disabled={!fromBaseId}
                                    >
                                        {bases?.filter(b => b._id !== fromBaseId).map((base) => (
                                            <MenuItem key={base._id} value={base._id}>
                                                {base.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.equipmentTypeId}>
                                    <InputLabel>Equipment Type *</InputLabel>
                                    <Controller
                                        name="equipmentTypeId"
                                        control={control}
                                        rules={{ required: 'Equipment type is required' }}
                                        render={({ field }) => (
                                            <Select {...field} label="Equipment Type *" disabled={!fromBaseId}>
                                                {equipmentTypes?.map((type) => (
                                                    <MenuItem key={type._id} value={type._id}>
                                                        {type.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Controller
                                    name="quantity"
                                    control={control}
                                    rules={{
                                        required: 'Quantity is required',
                                        min: { value: 1, message: 'Quantity must be at least 1' },
                                        validate: (value) => {
                                            const selectedAsset = assetsData?.find(
                                                a => a.equipment_type_id === watch('equipmentTypeId')
                                            );
                                            if (selectedAsset && value > selectedAsset.quantity) {
                                                return 'Quantity exceeds available stock';
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Quantity *"
                                            type="number"
                                            fullWidth
                                            error={!!errors.quantity}
                                            helperText={errors.quantity?.message}
                                        />
                                    )}
                                />
                                {watch('equipmentTypeId') && (
                                    <Typography variant="caption" color="text.secondary">
                                        Available: {
                                            assetsData?.find(a => a.equipment_type_id === watch('equipmentTypeId'))?.quantity || 0
                                        }
                                    </Typography>
                                )}
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Controller
                                    name="transferDate"
                                    control={control}
                                    rules={{ required: 'Transfer date is required' }}
                                    render={({ field }) => (
                                        <DatePicker
                                            {...field}
                                            label="Transfer Date *"
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    error={!!errors.transferDate}
                                                    helperText={errors.transferDate?.message}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Notes"
                                            multiline
                                            rows={3}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createTransferMutation.isLoading}
                        >
                            {createTransferMutation.isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Create Transfer'
                            )}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
};

export default CreateTransfer;