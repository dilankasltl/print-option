import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  time: string;
}

export interface ICashBalance extends Document {
  dateString: string; // YYYY-MM-DD
  openingCash: number;
  cashSales: number;
  expenses: IExpense[];
  totalExpenses: number;
  expectedClosingCash: number;
  actualClosingCash?: number;
  difference?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'General' },
    time: { type: String },
  },
  { _id: false }
);

const CashBalanceSchema = new Schema<ICashBalance>(
  {
    dateString: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    openingCash: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashSales: {
      type: Number,
      default: 0,
    },
    expenses: [ExpenseSchema],
    totalExpenses: {
      type: Number,
      default: 0,
    },
    expectedClosingCash: {
      type: Number,
      default: 0,
    },
    actualClosingCash: {
      type: Number,
    },
    difference: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const CashBalance: Model<ICashBalance> =
  mongoose.models.CashBalance || mongoose.model<ICashBalance>('CashBalance', CashBalanceSchema);

export default CashBalance;
