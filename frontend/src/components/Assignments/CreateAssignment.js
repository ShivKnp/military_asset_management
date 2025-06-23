import React, { useState, useEffect } from 'react';
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

const CreateAssignment = ({ open, onClose, onSuccess }) => {
    const { handleSubmit, control, watch, formState: { errors }, setValue, reset } = useForm({
        defaultValues: {
            baseId: '',
            assetId: '',
            quantity: '',
            assignedTo: '',
            assignmentDate: null,
            expectedReturnDate: null,
            notes: ''
        }
    });
    
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [selectedBase, setSelectedBase] = useState('');

    const { data: bases } = useQuery({
        queryKey: ['bases'],
        queryFn: () => api.get('/bases').then(res => res.data?.bases || []),
    });

    const { data: assetsData, isLoading: assetsLoading } = useQuery({
        queryKey: ['assets', selectedBase],
        queryFn: () => api.get(`/assets/base/${selectedBase}`).then(res => res.data),
        enabled: !!selectedBase,
    });

    const mutation = useMutation({
        mutationFn: (newAssignment) => api.post('/assignments', newAssignment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            onSuccess('Assignment created successfully!');
            handleClose();
        },
    });

    const onSubmit = (data) => {
        mutation.mutate({
            ...data,
            quantity: parseInt(data.quantity, 10),
        });
    };

    const selectedAssetId = watch('assetId');
    const selectedAsset = assetsData?.find(a => a._id === selectedAssetId);

    const handleClose = () => {
        reset();
        setSelectedBase('');
        onClose();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Assignment</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        {mutation.isError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {mutation.error.response?.data?.error || 'Failed to create assignment'}
                            </Alert>
                        )}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.baseId}>
                                    <InputLabel>Base *</InputLabel>
                                    <Controller
                                        name="baseId"
                                        control={control}
                                        rules={{ required: 'Base is required' }}
                                        render={({ field }) => (
                                            <Select 
                                                {...field}
                                                label="Base *"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setSelectedBase(e.target.value);
                                                    setValue('assetId', '');
                                                }}
                                            >
                                                <MenuItem value="" disabled>Select a base</MenuItem>
                                                {bases?.map((base) => (
                                                    <MenuItem key={base._id} value={base._id}>
                                                        {base.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.assetId} disabled={!selectedBase || assetsLoading}>
                                    <InputLabel>Asset *</InputLabel>
                                    <Controller
                                        name="assetId"
                                        control={control}
                                        rules={{ required: 'Asset is required' }}
                                        render={({ field }) => (
                                            <Select 
                                                {...field}
                                                label="Asset *"
                                                value={field.value || ''}
                                            >
                                                <MenuItem value="" disabled>Select an asset</MenuItem>
                                                {assetsLoading ? (
                                                    <MenuItem value="">Loading assets...</MenuItem>
                                                ) : (
                                                    assetsData?.map((asset) => (
                                                        <MenuItem key={asset._id} value={asset._id}>
                                                            {asset.equipmentType?.name || 'Unknown'} ({asset.serialNumber || 'N/A'})
                                                        </MenuItem>
                                                    ))
                                                )}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                                {selectedAsset && (
                                    <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <strong>Available Quantity:</strong> {selectedAsset.quantity || 0}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Type:</strong> {selectedAsset.equipmentType?.name || 'Unknown'}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12}>
                                <Controller
                                    name="quantity"
                                    control={control}
                                    rules={{
                                        required: 'Quantity is required',
                                        min: { value: 1, message: 'Quantity must be at least 1' },
                                        max: { 
                                            value: selectedAsset?.quantity, 
                                            message: `Quantity cannot exceed available stock (${selectedAsset?.quantity || 0})` 
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
                            </Grid>

                            {/* Rest of your form fields... */}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={mutation.isLoading}>
                            {mutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
};

export default CreateAssignment;