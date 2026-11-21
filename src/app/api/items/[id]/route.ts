import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import { getAdminSession } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { itno, itemName, availableQty, unitPrice, costPrice, reason, minAlertQty } = body;

    await connectToDatabase();

    const item = await Item.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if updating ITNO causes duplicate
    if (itno) {
      const cleanItno = String(itno).trim().toUpperCase();
      if (cleanItno !== item.itno) {
        const existing = await Item.findOne({ itno: cleanItno, _id: { $ne: id } });
        if (existing) {
          return NextResponse.json(
            { error: `Another item already has ITNO "${cleanItno}"` },
            { status: 400 }
          );
        }
        item.itno = cleanItno;
      }
    }

    if (itemName !== undefined) item.itemName = String(itemName).trim();
    if (availableQty !== undefined) item.availableQty = Math.max(0, Number(availableQty));
    if (unitPrice !== undefined) item.unitPrice = Math.max(0, Number(unitPrice));
    if (costPrice !== undefined) item.costPrice = Math.max(0, Number(costPrice));
    if (reason !== undefined) item.reason = String(reason).trim();
    if (minAlertQty !== undefined) item.minAlertQty = Math.max(0, Number(minAlertQty));

    await item.save();

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      item,
    });
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Item "${deletedItem.itemName}" (${deletedItem.itno}) deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
