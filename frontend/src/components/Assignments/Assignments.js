import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    Tabs,
    Tab,
    Tooltip,
} from '@mui/material';
import { Add as AddIcon, KeyboardReturn as ReturnIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import CreateAssignment from './CreateAssignment';
import RecordExpenditure from './RecordExpenditure';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const Assignments = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [tabIndex, setTabIndex] = useState(0);
    const [isCreateAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
    const [isRecordExpenditureModalOpen, setRecordExpenditureModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { user } = useAuth();

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
        setPage(0);
    };

    const { data: assignmentsData, isLoading, error } = useQuery({
        queryKey: ['assignments', page, rowsPerPage, tabIndex],
        queryFn: async () => {
            const response = await api.get('/assignments', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                    status: tabIndex === 0 ? 'active' : 'completed'
                }
            });
            return response.data;
        },
    });

    const handleShowSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const canPerformActions = user?.role === 'admin' || user?.role === 'base_commander';

    if (error) {
        return (
            <Alert severity="error">
                Error loading assignments: {error.message}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Assignments & Expenditures</Typography>
            <Paper>
                <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Active Assignments" />
                    <Tab label="Completed Assignments" />
                </Tabs>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    {tabIndex === 0 && canPerformActions && (
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => setCreateAssignmentModalOpen(true)}
                        >
                            New Assignment
                        </Button>
                    )}
                    {tabIndex === 1 && canPerformActions && (
                        <Button 
                            variant="contained" 
                            startIcon={<ReceiptIcon />} 
                            onClick={() => setRecordExpenditureModalOpen(true)}
                        >
                            Record Expenditure
                        </Button>
                    )}
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Asset</TableCell>
                                <TableCell>Serial Number</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell>Assigned By</TableCell>
                                <TableCell>Assignment Date</TableCell>
                                <TableCell>Expected Return</TableCell>
                                <TableCell>Status</TableCell>
                                {canPerformActions && <TableCell>Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : assignmentsData?.assignments?.length > 0 ? (
                                assignmentsData.assignments.map((assignment) => (
                                    <TableRow key={assignment._id}>
                                        <TableCell>
                                            {assignment.asset?.equipmentType?.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.asset?.serialNumber || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.assignedTo || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.assignedBy?.username || 'System'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(assignment.assignmentDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.expectedReturnDate 
                                                ? new Date(assignment.expectedReturnDate).toLocaleDateString() 
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.status}
                                        </TableCell>
                                        {canPerformActions && (
                                            <TableCell>
                                                {assignment.status === 'active' && (
                                                    <Tooltip title="Return Assignment">
                                                        <IconButton size="small">
                                                            <ReturnIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No assignments found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {assignmentsData && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={assignmentsData.totalAssignments || 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                )}
            </Paper>

            <CreateAssignment
                open={isCreateAssignmentModalOpen}
                onClose={() => setCreateAssignmentModalOpen(false)}
                onSuccess={handleShowSnackbar}
            />

            <RecordExpenditure
                open={isRecordExpenditureModalOpen}
                onClose={() => setRecordExpenditureModalOpen(false)}
                onSuccess={handleShowSnackbar}
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
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Assignments;