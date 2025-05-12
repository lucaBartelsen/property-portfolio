// pages/api/properties/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import { calculatePurchase } from '../../../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../../../lib/calculators/ongoingCalculator';
import { calculateCashflow } from '../../../lib/calculators/cashflowCalculator';
import { TaxInfo } from '../../../lib/types';

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

  // GET - List all properties for a portfolio
  if (req.method === 'GET') {
    const { portfolioId } = req.query;
    
    if (!portfolioId || typeof portfolioId !== 'string') {
      return res.status(400).json({ message: 'Portfolio ID is required' });
    }
    
    try {
      // First verify that the portfolio belongs to the user
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          customer: {
            userId
          }
        }
      });
      
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      const properties = await prisma.property.findMany({
        where: { portfolioId },
        orderBy: { name: 'asc' }
      });
      
      return res.status(200).json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      return res.status(500).json({ message: 'Failed to fetch properties' });
    }
  }
  
  // POST - Create a new property
  if (req.method === 'POST') {
    const { name, portfolioId, defaults } = req.body;
    
    if (!name || !portfolioId || !defaults) {
      return res.status(400).json({ message: 'Name, portfolio ID, and defaults are required' });
    }
    
    try {
      // First verify that the portfolio belongs to the user and get the customer
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          customer: {
            userId
          }
        },
        include: {
          customer: {
            include: {
              taxInfo: true
            }
          }
        }
      });
      
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // Get tax info from the customer
      const dbTaxInfo = portfolio.customer.taxInfo;

        if (!dbTaxInfo) {
        return res.status(404).json({ 
            message: 'Tax info not found for this customer. Please add tax information first.' 
        });
        }

        // Convert database tax info to your application's TaxInfo type
        const taxInfo: TaxInfo = {
        annualIncome: dbTaxInfo.annualIncome,
        taxStatus: dbTaxInfo.taxStatus as 'single' | 'married',  // Use type assertion here
        hasChurchTax: dbTaxInfo.hasChurchTax,
        churchTaxRate: dbTaxInfo.churchTaxRate,
        taxRate: dbTaxInfo.taxRate
        };

        // Perform calculations
        const property = {
        id: 'temp-id',
        name,
        defaults,
        purchaseData: null,
        ongoingData: null,
        calculationResults: null,
        yearlyData: null
        };

        const purchaseData = calculatePurchase(property);
        const ongoingData = calculateOngoing(property);
        const { results: calculationResults, yearlyData } = calculateCashflow(
        { ...property, purchaseData, ongoingData },
        taxInfo,  // Now this is properly typed
        10
        );
      
      // Save the property with calculated data
      const savedProperty = await prisma.property.create({
        data: {
          name,
          portfolioId,
          defaults: defaults as any,
          purchaseData: purchaseData as any,
          ongoingData: ongoingData as any,
          calculationResults: calculationResults as any,
          yearlyData: yearlyData as any
        }
      });
      
      return res.status(201).json(savedProperty);
    } catch (error) {
      console.error('Error creating property:', error);
      return res.status(500).json({ message: 'Failed to create property' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}