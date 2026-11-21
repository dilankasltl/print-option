import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedUsername = username.trim().toLowerCase();
    let adminUser = await User.findOne({ username: normalizedUsername });

    // Seed default admin if no user exists in DB
    if (!adminUser) {
      const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
      const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

      if (normalizedUsername === defaultUser.toLowerCase()) {
        const hashedPassword = await bcrypt.hash(defaultPass, 10);
        adminUser = await User.create({
          username: defaultUser.toLowerCase(),
          password: hashedPassword,
          role: 'admin',
          name: 'PRINT OPTION Admin',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid admin credentials' },
          { status: 401 }
        );
      }
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid admin username or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      username: adminUser.username,
      role: adminUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        username: adminUser.username,
        role: adminUser.role,
        name: adminUser.name,
      },
    });

    response.cookies.set('print_option_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
