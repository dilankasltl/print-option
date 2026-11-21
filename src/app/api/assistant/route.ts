import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const cleanMsg = message.trim().toLowerCase();
    await connectToDatabase();

    // 1. Fetch live stock items to provide real-time intelligence
    const allItems = await Item.find({}).lean();

    // 2. Check if user is asking about specific stock or item price
    const matchedItems = allItems.filter(
      (it) =>
        cleanMsg.includes(it.itno.toLowerCase()) ||
        cleanMsg.includes(it.itemName.toLowerCase()) ||
        it.itemName.toLowerCase().split(' ').some((word: string) => word.length > 2 && cleanMsg.includes(word))
    );

    let reply = '';

    // Condition A: User asking about stock, availability, or prices of items
    if (matchedItems.length > 0) {
      const itemsListText = matchedItems
        .slice(0, 4)
        .map(
          (it) =>
            `• **${it.itemName}** (${it.itno}): \n  - තොගයේ ඇත: **${it.availableQty} units** \n  - විකිණෙන මිල: **Rs. ${it.unitPrice.toFixed(2)}** ${
              it.actualPrice && it.actualPrice > it.unitPrice
                ? `(කපපු මිල: ~~Rs. ${it.actualPrice.toFixed(2)}~~)`
                : ''
            }`
        )
        .join('\n\n');

      reply = `ඔව්, ඔබ ඇසූ භාණ්ඩ පිළිබඳ සජීවී තොරතුරු මෙන්න:\n\n${itemsListText}\n\nතව මොනවද දැනගන්න ඕන?`;
    }
    // Condition B: Asking about contact / phone / whatsapp
    else if (
      cleanMsg.includes('contact') ||
      cleanMsg.includes('phone') ||
      cleanMsg.includes('call') ||
      cleanMsg.includes('whatsapp') ||
      cleanMsg.includes('number') ||
      cleanMsg.includes('hotline') ||
      cleanMsg.includes('number eka')
    ) {
      reply = `📞 **PRINT OPTION සම්බන්ධතා තොරතුරු:**\n\n• **දුරකථන / Hotline:** +94 71 723 7290\n• **WhatsApp Chat:** [Click here to chat](https://wa.me/94717237290)\n• **සේවාවන්:** Printing, Photocopy, Sublimation, T-Shirts, Stationery Solutions\n\nඕනෑම වේලාවක අප අමතන්න! 😊`;
    }
    // Condition C: How to mark OUT / POS / Bill
    else if (
      cleanMsg.includes('out') ||
      cleanMsg.includes('mark out') ||
      cleanMsg.includes('bill') ||
      cleanMsg.includes('pos') ||
      cleanMsg.includes('sell') ||
      cleanMsg.includes('checkout')
    ) {
      reply = `🛍️ **Stock OUT / බිලක් දමන ආකාරය:**\n\n1. **Dashboard එකෙන් කෙලින්ම:** Stock ලිස්ට් එකේ ඇති ඕනෑම Item එකක් ඉදිරියෙන් ඇති **"OUT"** බටනය ක්ලික් කරන්න.\n2. **Mark OUT / POS ටැබ් එකෙන්:** තෝරාගත් බඩු Cart එකට දමා එක බිලක් ලෙස සකස් කරගත හැක.\n3. විකුණන ලද ප්‍රමාණය (Qty) සහ Payment method (Cash/Card) තෝරා **"Confirm OUT & Print Bill"** ක්ලික් කරන්න.\n4. ක්ෂණිකව බඩු තොගයෙන් අඩුවී Print කළ හැකි බිලක් (80mm POS Receipt) Generate වේ!`;
    }
    // Condition D: How does Cash Balance work
    else if (
      cleanMsg.includes('cash') ||
      cleanMsg.includes('balance') ||
      cleanMsg.includes('drawer') ||
      cleanMsg.includes('mudhal')
    ) {
      reply = `💰 **Daily Cash Balance කරන ආකාරය:**\n\n1. **Opening Cash:** උදෑසන Drawer එකේ තබන ආරම්භක මුදල ඇතුළත් කරන්න.\n2. **Cash Sales:** දවසේ විකිණුනු Cash මුදල ස්වයංක්‍රීයව මෙතනට එකතු වේ.\n3. **Expenses:** දවසේ ගිය වියදම් (තේ, කෑම, ප්‍රවාහන) එකතු කරන්න.\n4. **Expected Cash:** ලාච්චුවේ තිබිය යුතු නියමිත මුදල පෙන්වයි.\n5. **Actual Count:** දවස අවසානයේ අතැති මුදල් ගණන් කර ඇතුළත් කළ විට මුදල් වැඩිද (Surplus) හෝ අඩුවක් (Shortage) තිබේදැයි පැහැදිලිව පෙන්වයි!`;
    }
    // Condition E: How to add or upload items / Excel
    else if (
      cleanMsg.includes('add') ||
      cleanMsg.includes('excel') ||
      cleanMsg.includes('upload') ||
      cleanMsg.includes('edit') ||
      cleanMsg.includes('delete')
    ) {
      reply = `📦 **Items ඇතුළත් කිරීම සහ Excel Upload:**\n\n• **Admin Login අවශ්‍යයි:** ඉහළ දකුණු කෙළවරේ ඇති **Admin Login** ක්ලික් කර ලොග් වන්න.\n• **Single Item:** "Add Single Item" ක්ලික් කර ITNO, නම, Qty, මිල ඇතුළත් කරන්න.\n• **Excel Upload:** "Upload Excel" ක්ලික් කර Sample Template එක Download කරගෙන භාණ්ඩ රැසක් එකවර Upload කළ හැක.\n• Admin ට ඕනෑම Item එකක් Edit හෝ Delete කළ හැක.`;
    }
    // Condition F: Greetings
    else if (
      cleanMsg.includes('hi') ||
      cleanMsg.includes('hello') ||
      cleanMsg.includes('ado') ||
      cleanMsg.includes('kohomada') ||
      cleanMsg.includes('help') ||
      cleanMsg.includes('start')
    ) {
      reply = `👋 **ආයුබෝවන්! මම PRINT OPTION AI Assistant.**\n\nමගෙන් ඔබට:\n• භාණ්ඩවල Stock ප්‍රමාණයන් සහ මිල ගණන්\n• බිල්පත් සහ Stock OUT කරන ආකාරය\n• දෛනික Cash Balance කරන ආකාරය\n• Hotline & WhatsApp (+94 71 723 7290)\nපිළිබඳ ඕනෑම දෙයක් අසන්න පුළුවන්. ඔබට උදව් කරන්නේ කෙසේද?`;
    }
    // Default helpful fallback
    else {
      const topFew = allItems.slice(0, 3).map((it) => it.itemName).join(', ');
      reply = `ස්තූතියි ඔබේ පණිවිඩයට! PRINT OPTION මෘදුකාංගය පිළිබඳ ඕනෑම දෙයක් මට පැහැදිලි කළ හැක.\n\n• අප සතුව දැනට **${allItems.length}** කට අධික භාණ්ඩ වර්ග ප්‍රමාණයක් ඇත (${topFew} ආදී).\n• හදිසි ඕනෑම විමසීමකට අපගේ Hotline **+94 71 723 7290** අමතන්න හෝ WhatsApp මඟින් සම්බන්ධ වන්න.\n\nඔබට අවශ්‍ය වෙනත් තොරතුරක් ඇත්නම් මෙහි Type කරන්න! 😊`;
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json(
      { error: error.message || 'Assistant failed to respond' },
      { status: 500 }
    );
  }
}
