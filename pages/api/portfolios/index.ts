// pages/api/portfolios/index.ts (we need to update this file if it already exists)
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

  // GET - List all portfolios for a customer
  if (req.method === 'GET') {
    const { customerId } = req.query;
    
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    try {
      // First verify that the customer belongs to the user
      const customer = await prisma.customer.findFirst({
        where: { 
          id: customerId, 
          userId 
        }
      });
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const portfolios = await prisma.portfolio.findMany({
        where: { customerId },
        orderBy: { name: 'asc' }
      });
      
      return res.status(200).json(portfolios);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      return res.status(500).json({ message: 'Failed to fetch portfolios' });
    }
  }
  
  // POST - Create a new portfolio
  if (req.method === 'POST') {
    const { name, customerId } = req.body;
    
    if (!name || !customerId) {
      return res.status(400).json({ message: 'Name and customer ID are required' });
    }
    
    try {
      // First verify that the customer belongs to the user
      const customer = await prisma.customer.findFirst({
        where: { 
          id: customerId, 
          userId 
        }
      });
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const portfolio = await prisma.portfolio.create({
        data: {
          name,
          customerId
        }
      });
      
      return res.status(201).json(portfolio);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      return res.status(500).json({ message: 'Failed to create portfolio' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}