// pages/api/properties/[id].ts
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
  const propertyId = req.query.id as string;
  
  // GET - Get a single property
  if (req.method === 'GET') {
    try {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          portfolio: {
            customer: {
              userId
            }
          }
        },
        include: {
          portfolio: {
            include: {
              customer: true
            }
          }
        }
      });
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      return res.status(200).json(property);
    } catch (error) {
      console.error('Error fetching property:', error);
      return res.status(500).json({ message: 'Failed to fetch property' });
    }
  }
  
  // PUT - Update a property
  if (req.method === 'PUT') {
    const { name, defaults } = req.body;
    
    if (!name || !defaults) {
      return res.status(400).json({ message: 'Name and defaults are required' });
    }
    
    try {
      // Verify that the property belongs to the user
      const existingProperty = await prisma.property.findFirst({
        where: {
          id: propertyId,
          portfolio: {
            customer: {
              userId
            }
          }
        },
        include: {
          portfolio: {
            include: {
              customer: {
                include: {
                  taxInfo: true
                }
              }
            }
          }
        }
      });
      
      if (!existingProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      // Get tax info from the customer
      const dbTaxInfo = existingProperty.portfolio.customer.taxInfo;
      
      if (!dbTaxInfo) {
        return res.status(400).json({ 
          message: 'Tax info not found for this customer. Please add tax information first.' 
        });
      }
      
      // Convert to application's TaxInfo type
      const taxInfo: TaxInfo = {
        annualIncome: dbTaxInfo.annualIncome,
        taxStatus: dbTaxInfo.taxStatus as 'single' | 'married',
        hasChurchTax: dbTaxInfo.hasChurchTax,
        churchTaxRate: dbTaxInfo.churchTaxRate,
        taxRate: dbTaxInfo.taxRate
      };
      
      // Perform calculations
      const property = {
        id: propertyId,
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
        taxInfo,
        10
      );
      
      // Update the property with calculated data
      const updatedProperty = await prisma.property.update({
        where: {
          id: propertyId
        },
        data: {
          name,
          defaults: defaults as any,
          purchaseData: purchaseData as any,
          ongoingData: ongoingData as any,
          calculationResults: calculationResults as any,
          yearlyData: yearlyData as any
        }
      });
      
      return res.status(200).json(updatedProperty);
    } catch (error) {
      console.error('Error updating property:', error);
      return res.status(500).json({ message: 'Failed to update property' });
    }
  }
  
  // DELETE - Delete a property
  if (req.method === 'DELETE') {
    try {
      // Verify that the property belongs to the user
      const existingProperty = await prisma.property.findFirst({
        where: {
          id: propertyId,
          portfolio: {
            customer: {
              userId
            }
          }
        }
      });
      
      if (!existingProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      await prisma.property.delete({
        where: {
          id: propertyId
        }
      });
      
      return res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      return res.status(500).json({ message: 'Failed to delete property' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}