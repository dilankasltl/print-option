import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (query) {
      filter.$or = [
        { itno: { $regex: query, $options: 'i' } },
        { itemName: { $regex: query, $options: 'i' } },
        { reason: { $regex: query, $options: 'i' } },
      ];
    }

    if (lowStock) {
      filter.$expr = { $lte: ['$availableQty', '$minAlertQty'] };
    }

    const items = await Item.find(filter)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error: any) {
    console.error('Fetch items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { itno, itemName, availableQty, unitPrice, costPrice, reason, minAlertQty } = body;

    if (!itno || !itemName) {
      return NextResponse.json(
        { error: 'ITNO and Item Name are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check duplicate ITNO
    const cleanItno = String(itno).trim().toUpperCase();
    const existing = await Item.findOne({ itno: cleanItno });
    if (existing) {
      return NextResponse.json(
        { error: `Item with ITNO "${cleanItno}" already exists! Please use a unique ITNO.` },
        { status: 400 }
      );
    }

    const newItem = await Item.create({
      itno: cleanItno,
      itemName: String(itemName).trim(),
      availableQty: Number(availableQty) || 0,
      unitPrice: Number(unitPrice) || 0,
      costPrice: Number(costPrice) || 0,
      reason: reason ? String(reason).trim() : 'Stock In',
      minAlertQty: Number(minAlertQty) || 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Item added successfully',
      item: newItem,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}
