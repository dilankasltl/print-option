import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IItem extends Document {
  itno: string;
  itemName: string;
  availableQty: number;
  unitPrice: number;
  costPrice?: number;
  reason: string;
  minAlertQty: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    itno: {
      type: String,
      required: [true, 'ITNO is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item Name is required'],
      trim: true,
      index: true,
    },
    availableQty: {
      type: Number,
      required: [true, 'Available Quantity is required'],
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'One Piece Price is required'],
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    reason: {
      type: String,
      default: 'Stock In',
      trim: true,
    },
    minAlertQty: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose model recompilation error in Next.js hot reload
const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);

export default Item;
