import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import { getAdminSession } from '@/lib/auth';

interface RawRow {
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { rows, updateExisting = true } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows provided in upload payload' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row: RawRow = rows[i];

      // Smart column matching to handle variations in Excel headers:
      // ITNO, itno, Item Number, Item Code
      const itnoKey = Object.keys(row).find((k) =>
        /^(itno|item[\s_-]?no|item[\s_-]?code|code)$/i.test(k.trim())
      );
      // ITEM NAME, item name, item, name, description
      const nameKey = Object.keys(row).find((k) =>
        /^(item[\s_-]?name|name|item|product[\s_-]?name)$/i.test(k.trim())
      );
      // AVAILABLE QTY, available qty, qty, quantity, stock
      const qtyKey = Object.keys(row).find((k) =>
        /^(available[\s_-]?qty|qty|quantity|available|stock)$/i.test(k.trim())
      );
      // ONE PIECE PRICE, one pieace price, unit price, price, rate
      const priceKey = Object.keys(row).find((k) =>
        /^(one[\s_-]?pie?ce[\s_-]?price|unit[\s_-]?price|price|rate)$/i.test(k.trim())
      );
      // REASON, reason, category, notes, note
      const reasonKey = Object.keys(row).find((k) =>
        /^(reason|category|notes?|remarks?)$/i.test(k.trim())
      );

      const itno = itnoKey ? String(row[itnoKey] || '').trim().toUpperCase() : '';
      const itemName = nameKey ? String(row[nameKey] || '').trim() : '';
      const availableQty = qtyKey ? Number(row[qtyKey]) || 0 : 0;
      const unitPrice = priceKey ? Number(row[priceKey]) || 0 : 0;
      const reason = reasonKey ? String(row[reasonKey] || '').trim() : 'Stock In';

      if (!itno || !itemName) {
        errors.push(`Row ${i + 1}: Skipped (Missing ITNO or ITEM NAME)`);
        continue;
      }

      const existingItem = await Item.findOne({ itno });

      if (existingItem) {
        if (updateExisting) {
          existingItem.itemName = itemName;
          existingItem.availableQty = Math.max(0, availableQty);
          existingItem.unitPrice = Math.max(0, unitPrice);
          if (reason) existingItem.reason = reason;
          await existingItem.save();
          updatedCount++;
        } else {
          errors.push(`Row ${i + 1}: Skipped (${itno} already exists)`);
        }
      } else {
        await Item.create({
          itno,
          itemName,
          availableQty: Math.max(0, availableQty),
          unitPrice: Math.max(0, unitPrice),
          reason: reason || 'Stock In',
          minAlertQty: 5,
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows successfully`,
      createdCount,
      updatedCount,
      skippedCount: errors.length,
      errors: errors.slice(0, 10), // return first 10 notices if any
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}
