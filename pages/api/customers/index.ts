// pages/api/customers/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

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

  // GET - List all customers
  if (req.method === 'GET') {
    try {
      const customers = await prisma.customer.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      });
      
      return res.status(200).json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ message: 'Failed to fetch customers' });
    }
  }
  
  // POST - Create a new customer
  if (req.method === 'POST') {
  const { name, email, phone, notes, taxInfo } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  // Validate tax status if provided
  if (taxInfo && taxInfo.taxStatus) {
    if (taxInfo.taxStatus !== 'single' && taxInfo.taxStatus !== 'married') {
      return res.status(400).json({ 
        message: 'Tax status must be either "single" or "married"' 
      });
    }
  }
  
  try {
    // Create the customer, optionally with tax info
    const customerData: any = {
      name,
      email,
      phone,
      notes,
      userId
    };
    
    // If tax info was provided, add it to the create operation
    if (taxInfo) {
      customerData.taxInfo = {
        create: {
          annualIncome: taxInfo.annualIncome,
          taxStatus: taxInfo.taxStatus as 'single' | 'married',  // Use the enum type here
          hasChurchTax: taxInfo.hasChurchTax || false,
          churchTaxRate: taxInfo.churchTaxRate || 9,
          taxRate: taxInfo.taxRate
        }
      };
    }
    
    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        taxInfo: true
      }
    });
    
    return res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Failed to create customer' });
  }
}
  
  return res.status(405).json({ message: 'Method not allowed' });
}