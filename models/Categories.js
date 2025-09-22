import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
