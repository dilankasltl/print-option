import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminSession, signToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const normalizedUsername = (session.username || 'admin').trim().toLowerCase();
    let user = await User.findOne({ username: normalizedUsername });

    const defaultUser = (process.env.ADMIN_DEFAULT_USERNAME || 'admin').toLowerCase();
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    if (!user) {
      // If user document not yet created in DB, check against default password
      if (normalizedUsername === defaultUser && currentPassword === defaultPass) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user = await User.create({
          username: defaultUser,
          password: hashedPassword,
          role: 'admin',
          name: 'PRINT OPTION Admin',
        });
      } else {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    } else {
      // User exists in DB: check if currentPassword matches current DB password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Update with new password hash
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
    }

    // Generate fresh session token
    const newToken = signToken({
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully. Default password is now deactivated.',
      token: newToken,
    });

    response.cookies.set('print_option_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
