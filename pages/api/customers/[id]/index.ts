// pages/api/customers/[id]/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const userId = session.user.id;
  const customerId = req.query.id as string;

  // GET - Get a single customer
  if (req.method === 'GET') {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          userId
        },
        include: {
          taxInfo: true
        }
      });
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      return res.status(200).json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      return res.status(500).json({ message: 'Failed to fetch customer' });
    }
  }
  
  // PUT - Update a customer
  if (req.method === 'PUT') {
    const { name, email, phone, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    try {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id: customerId
        },
        data: {
          name,
          email,
          phone,
          notes
        },
        include: {
          taxInfo: true
        }
      });
      
      return res.status(200).json(updatedCustomer);
    } catch (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({ message: 'Failed to update customer' });
    }
  }
  
  // DELETE - Delete a customer
  if (req.method === 'DELETE') {
    try {
      // First verify the customer belongs to the user
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          userId
        }
      });
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Delete the customer
      // Note: You'll need cascade delete in your schema or handle related records separately
      await prisma.customer.delete({
        where: {
          id: customerId
        }
      });
      
      return res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({ message: 'Failed to delete customer' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}