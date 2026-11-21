import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockOutItem {
  itemId?: mongoose.Types.ObjectId;
  itno: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface IStockOut extends Document {
  invoiceNo: string;
  date: Date;
  dateString: string; // YYYY-MM-DD for fast date filtering
  items: IStockOutItem[];
  totalQty: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Credit';
  customerName?: string;
  customerPhone?: string;
  reason?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockOutItemSchema = new Schema<IStockOutItem>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
    },
    itno: {
      type: String,
      required: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const StockOutSchema = new Schema<IStockOut>(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    dateString: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    items: {
      type: [StockOutItemSchema],
      required: true,
      validate: [(val: IStockOutItem[]) => val.length > 0, 'At least one item is required'],
    },
    totalQty: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    changeAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Bank Transfer', 'Credit'],
      default: 'Cash',
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: 'Sale',
    },
    recordedBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

const StockOut: Model<IStockOut> =
  mongoose.models.StockOut || mongoose.model<IStockOut>('StockOut', StockOutSchema);

export default StockOut;
