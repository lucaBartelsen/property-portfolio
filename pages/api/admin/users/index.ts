// pages/api/admin/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import crypto from 'crypto';
import { sendPasswordInitEmail } from '../../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin status
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Verify that the user is an admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  });
  
  if (!user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }

  // GET - List all users
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          // Don't include password
          _count: {
            select: {
              customers: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
  
  // POST - Create a new user
  if (req.method === 'POST') {
    const { name, email, isAdmin = false } = req.body;
    
    // Validate inputs
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      
      // Generate a random temporary password and a reset token
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 24 hours
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create user with temporary password and reset token
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          isAdmin: Boolean(isAdmin),
          password: tempPassword, // This is a placeholder, user will set their own password
          resetToken,
          resetTokenExpiry
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Send password initialization email
      await sendPasswordInitEmail(email, name, resetToken);
      
      return res.status(201).json({
        ...newUser,
        message: 'User created successfully. An email has been sent to set a password.'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}