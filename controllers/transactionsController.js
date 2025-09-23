import mongoose from 'mongoose';
import Category from '../models/Categories.js';
import Transaction from '../models/Transactions.js';

/* ----------------------------- CATEGORY ----------------------------- */

// Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'name and type are required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name: name.trim(), type, description });
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get All Categories (optionally filter by type)
export const getCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ message: 'Categories fetched successfully', categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/* ---------------------------- TRANSACTION CRUD --------------------------- */

// Create Transaction
export const createTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    if (!type || !category || !amount) {
      return res.status(400).json({ message: 'type, category and amount are required' });
    }

    // Optional: ensure category belongs to same type
    const cat = await Category.findById(category);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    if (cat.type !== type) {
      return res.status(400).json({ message: 'Category type mismatch with transaction type' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,      // assumes you set req.user in auth middleware
      type,
      category,
      amount,
      description,
      date
    });

    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get All Transactions (filter by type, category, date range, etc.)
export const getTransactions = async (req, res) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category; 
    if (req.query.start && req.query.end) {
      filter.date = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) };
    }

    const transactions = await Transaction.find(filter)
      .populate('category', 'name type')
      .sort({ date: -1 });

    res.json({ message: 'Transactions fetched successfully', transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Update Transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, description, date } = req.body;

    // Optional type/category validation
    if (category) {
      const cat = await Category.findById(category);
      if (!cat) return res.status(404).json({ message: 'Category not found' });
      if (type && cat.type !== type) {
        return res.status(400).json({ message: 'Category type mismatch' });
      }
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { type, category, amount, description, date },
      { new: true, runValidators: true }
    );

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    res.json({ message: 'Transaction updated successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete Transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/* ---------------------------- Analytics --------------------------- */

// Get Analytics of transaction data
export const getAnalytics = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    const userId = req.user._id; 

    const start = new Date(`${year}-01-01`);
    const end = new Date(`${Number(year) + 1}-01-01`);
    let match = {
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: start, $lt: end }
    };

    // Filter by specific month if provided
    let monthIndex = null;
    if (month) {
      monthIndex = new Date(`${month} 1, ${year}`).getMonth(); // 0–11
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 1);
      match.date = { $gte: monthStart, $lt: monthEnd };
    }

    // Fetch all user transactions for the range
    const transactions = await Transaction.find(match).populate('category');

    // Group income and expenses
    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseByCategory = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
        const catName = t.category?.name || 'Other';
        if (!expenseByCategory[catName]) {
          expenseByCategory[catName] = { amount: 0, color: randomColor(catName) };
        }
        expenseByCategory[catName].amount += t.amount;
      }
    });

    // Prepare expense distribution array with percentage values
    const expenseArray = Object.entries(expenseByCategory).map(([name, obj]) => ({
      name,
      amount: obj.amount,
      color: obj.color,
      value: totalExpenses > 0 ? Number(((obj.amount / totalExpenses) * 100).toFixed(1)) : 0
    }));

    // Calculate savings & rate
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0
      ? Math.round((netSavings / totalIncome) * 100)
      : 0;

    // Response payload
    const payload = {
      year: Number(year),
      month: month || null,
      income: totalIncome,
      expenses: expenseArray,
      totalExpenses,
      netSavings,
      savingsRate
    };

    res.json({
      message: 'Analytics fetched successfully',
      analytics: payload
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Simple deterministic color generator so same category keeps same color
function randomColor(key) {
  const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}