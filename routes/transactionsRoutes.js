import express from 'express';

import authenticateUser from '../middlewares/authenticateuser.js';
import { createCategory, createTransaction, deleteTransaction, getAnalytics, getCategories, getTransactions, updateTransaction } from '../controllers/transactionsController.js';

const router = express.Router();

// Category
router.post('/categories', authenticateUser, createCategory);
router.get('/categories', authenticateUser, getCategories);

// Transaction
router.post('/transactions', authenticateUser, createTransaction);
router.get('/transactions', authenticateUser, getTransactions);
router.put('/transactions/:id', authenticateUser, updateTransaction);
router.delete('/transactions/:id', authenticateUser, deleteTransaction);

// Analytics
router.get('/analytics', authenticateUser, getAnalytics);


export default router;
