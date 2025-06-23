import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Box
} from '@mui/material';

const DetailItem = ({ title, value }) => (
    <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="body1">{value || 'N/A'}</Typography>
    </Grid>
);

const ViewAsset = ({ open, onClose, asset }) => {
    if (!asset) return null;

    // Safely access nested properties with optional chaining
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <DetailItem title="Asset ID" value={asset._id || asset.id} />
                        <DetailItem title="Name" value={asset.name} />
                        <DetailItem title="Serial Number" value={asset.serial_number || asset.serialNumber} />
                        <DetailItem title="Equipment Type" value={asset.equipmentType?.name || asset.equipment_type?.name} />
                        <DetailItem title="Base" value={asset.base?.name || asset.base_id} />
                        <DetailItem title="Status" value={asset.status?.replace('_', ' ') || 'N/A'} />
                        <DetailItem title="Created At" value={asset.createdAt ? new Date(asset.createdAt).toLocaleString() : 'N/A'} />
                        <DetailItem title="Last Updated" value={asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : 'N/A'} />
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewAsset;