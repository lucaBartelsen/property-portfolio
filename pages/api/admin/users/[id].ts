// pages/api/admin/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../../../lib/email';

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
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  });
  
  if (!admin?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }

  const userId = req.query.id as string;

  // GET - Get user details
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
        }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Failed to fetch user' });
    }
  }
  
  // PUT - Update user
  if (req.method === 'PUT') {
    const { name, email, isAdmin } = req.body;
    
    // Validate inputs
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if email is being changed and if it's already in use
      if (email !== existingUser.email) {
        const emailInUse = await prisma.user.findUnique({
          where: { email }
        });
        
        if (emailInUse) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          isAdmin: Boolean(isAdmin)
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
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Failed to update user' });
    }
  }
  
  // DELETE - Delete user
  if (req.method === 'DELETE') {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              customers: true
            }
          }
        }
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow deleting current user
      if (userId === session.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      // Warn if user has customers
      if (existingUser._count.customers > 0) {
        return res.status(409).json({ 
          message: 'User has customers. Please reassign or delete them first.',
          customerCount: existingUser._count.customers
        });
      }
      
      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });
      
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  }
  
  // POST - Send password reset
  if (req.method === 'POST' && req.query.action === 'reset-password') {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 24 hours
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Update user with reset token
      await prisma.user.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      
      return res.status(200).json({ 
        message: 'Password reset email sent' 
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      return res.status(500).json({ message: 'Failed to send reset email' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}