// pages/api/portfolios/[id].ts
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
  const portfolioId = req.query.id as string;
  
  // GET - Get a single portfolio
  if (req.method === 'GET') {
    try {
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          customer: {
            userId
          }
        },
        include: {
          customer: true
        }
      });
      
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      return res.status(200).json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
  }
  
  // PUT - Update a portfolio
  if (req.method === 'PUT') {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    try {
      // Verify that the portfolio belongs to the user
      const existingPortfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          customer: {
            userId
          }
        }
      });
      
      if (!existingPortfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      const updatedPortfolio = await prisma.portfolio.update({
        where: {
          id: portfolioId
        },
        data: {
          name
        }
      });
      
      return res.status(200).json(updatedPortfolio);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      return res.status(500).json({ message: 'Failed to update portfolio' });
    }
  }
  
  // DELETE - Delete a portfolio
  if (req.method === 'DELETE') {
    try {
      // Verify that the portfolio belongs to the user
      const existingPortfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          customer: {
            userId
          }
        }
      });
      
      if (!existingPortfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // With cascade delete in the schema, this will delete all properties too
      await prisma.portfolio.delete({
        where: {
          id: portfolioId
        }
      });
      
      return res.status(200).json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      return res.status(500).json({ message: 'Failed to delete portfolio' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}