import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    CircularProgress,
    Alert,
    TextField,
} from '@mui/material';
import api from '../../services/api';

const assetStatusOptions = ['in_storage', 'in_use', 'under_maintenance', 'decommissioned'];

const CreateAsset = ({ open, onClose, onSuccess }) => {
    const { handleSubmit, control, formState: { errors } } = useForm();
    const queryClient = useQueryClient();

    const { data: bases, isLoading: basesLoading } = useQuery({
        queryKey: ['bases'],
        queryFn: async () => {
            const response = await api.get('/api/bases');
            return response.data;
        },
    });

    const { data: equipmentTypes, isLoading: typesLoading } = useQuery({
        queryKey: ['equipmentTypes'],
        queryFn: async () => {
            const response = await api.get('/api/assets/categories');
            return response.data;
        }
    });

    const createAssetMutation = useMutation({
        mutationFn: (newAsset) => api.post('/api/assets', newAsset),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            onSuccess('Asset created successfully!');
            onClose();
        },
    });

    const onSubmit = (data) => {
        createAssetMutation.mutate({
            ...data,
            base_id: data.base_id,
            equipment_type_id: data.type_id
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Asset</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    {createAssetMutation.isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {createAssetMutation.error.response?.data?.error || 'An error occurred.'}
                        </Alert>
                    )}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="name"
                                control={control}
                                defaultValue=""
                                rules={{ required: 'Asset name is required' }}
                                render={({ field }) => <TextField {...field} label="Asset Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="serial_number"
                                control={control}
                                defaultValue=""
                                rules={{ required: 'Serial number is required' }}
                                render={({ field }) => <TextField {...field} label="Serial Number" fullWidth error={!!errors.serial_number} helperText={errors.serial_number?.message} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.type_id}>
                                <InputLabel>Equipment Type</InputLabel>
                                <Controller
                                    name="type_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: 'Type is required' }}
                                    render={({ field }) => (
                                        <Select {...field} label="Equipment Type" disabled={typesLoading}>
                                            {typesLoading && <MenuItem value="">Loading...</MenuItem>}
                                            {equipmentTypes?.map((et) => (
                                                <MenuItem key={et._id || et.id} value={et._id || et.id}>
                                                    {et.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.base_id}>
                                <InputLabel>Base</InputLabel>
                                <Controller
                                    name="base_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: 'Base is required' }}
                                    render={({ field }) => (
                                        <Select {...field} label="Base" disabled={basesLoading}>
                                            {basesLoading && <MenuItem value="">Loading...</MenuItem>}
                                            {bases?.map((base) => (
                                                <MenuItem key={base._id || base.id} value={base._id || base.id}>
                                                    {base.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth error={!!errors.status}>
                                <InputLabel>Status</InputLabel>
                                <Controller
                                    name="status"
                                    control={control}
                                    defaultValue="in_storage"
                                    rules={{ required: 'Status is required' }}
                                    render={({ field }) => (
                                        <Select {...field} label="Status">
                                            {assetStatusOptions.map((status) => (
                                                <MenuItem key={status} value={status}>
                                                    {status.replace('_', ' ')}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={createAssetMutation.isLoading}>
                        {createAssetMutation.isLoading ? <CircularProgress size={24} /> : 'Create Asset'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateAsset;