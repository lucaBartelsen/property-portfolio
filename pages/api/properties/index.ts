// pages/api/properties/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import { TaxInfo } from '../../../lib/types';
import { PropertyCreateDto } from '../../../lib/dto/PropertyDto';
import { CustomerMapper } from '../../../lib/dto/CustomerDto';
import { DataValidator } from '../../../lib/utils/validation';
import { CalculationService } from '../../../services/calculationService';

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
// Replace POST handler with:
  if (req.method === 'POST') {
    const propertyDto = req.body as PropertyCreateDto;
    
    // Basic validation
    if (!propertyDto.name || !propertyDto.portfolioId || !propertyDto.defaults) {
      return res.status(400).json({ message: 'Name, portfolio ID, and defaults are required' });
    }
    
    try {
      // Normalize and validate property defaults
      const normalizedDefaults = DataValidator.normalizePropertyDefaults(propertyDto.defaults);
      
      // Verify portfolio exists and belongs to user
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: propertyDto.portfolioId,
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

      // Convert database tax info to application TaxInfo type
      const taxInfo = CustomerMapper.mapTaxInfo(dbTaxInfo);

      // Create a property object for calculations
      const propertyForCalculation = {
        id: 'temp-id',
        name: propertyDto.name,
        defaults: normalizedDefaults,
        purchaseData: null,
        ongoingData: null,
        calculationResults: null,
        yearlyData: null
      };

      if (!taxInfo) {
        return res.status(400).json({ 
          message: 'Tax info not found for this customer. Please add tax information first.' 
        });
      }

      // Use calculation service for consistent calculations
      const { purchaseData, ongoingData, results: calculationResults, yearlyData } = 
        CalculationService.calculatePropertyData(propertyForCalculation, taxInfo);
      
      // Save the property with calculated data
      const savedProperty = await prisma.property.create({
        data: {
          name: propertyDto.name,
          portfolioId: propertyDto.portfolioId,
          defaults: normalizedDefaults as any,
          purchaseData: purchaseData as any,
          ongoingData: ongoingData as any,
          calculationResults: calculationResults as any,
          yearlyData: yearlyData as any
        }
      });
      
      return res.status(201).json(savedProperty);
    } catch (error: any) {
      console.error('Error creating property:', error);
      return res.status(500).json({ 
        message: 'Failed to create property', 
        error: error?.message || 'Unknown error'
      });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

