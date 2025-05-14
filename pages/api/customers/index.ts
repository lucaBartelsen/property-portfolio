// pages/api/customers/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import { CustomerCreateDto } from '../../../lib/dto/CustomerDto';
import { DataValidator } from '../../../lib/utils/validation';

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
  const customerDto = req.body as CustomerCreateDto;
  
  if (!customerDto.name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  // Validate tax status if provided
  if (customerDto.taxInfo && customerDto.taxInfo.taxStatus) {
    if (customerDto.taxInfo.taxStatus !== 'single' && customerDto.taxInfo.taxStatus !== 'married') {
      return res.status(400).json({ 
        message: 'Tax status must be either "single" or "married"' 
      });
    }
  }
  
  try {
    // Normalize tax info if provided
    let taxInfo = null;
    if (customerDto.taxInfo) {
      taxInfo = DataValidator.normalizeTaxInfo(customerDto.taxInfo);
    }
    
    // Prepare customer data
    const customerData: any = {
      name: customerDto.name,
      email: customerDto.email || null,
      phone: customerDto.phone || null,
      notes: customerDto.notes || null,
      userId
    };
    
    // If tax info was provided, add it to the create operation
    if (taxInfo) {
      customerData.taxInfo = {
        create: {
          annualIncome: taxInfo.annualIncome,
          taxStatus: taxInfo.taxStatus,
          hasChurchTax: taxInfo.hasChurchTax,
          churchTaxRate: taxInfo.churchTaxRate,
          taxRate: taxInfo.taxRate
        }
      };
    }
    
    // Create the customer
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