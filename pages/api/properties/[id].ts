// pages/api/properties/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import { TaxInfo } from '../../../lib/types';
import { PropertyUpdateDto } from '../../../lib/dto/PropertyDto';
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
                customer: {
                include: {
                    taxInfo: true // Include tax info here
                }
                }
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
    const propertyDto = req.body as PropertyUpdateDto;
    
    if (!propertyDto.name || !propertyDto.defaults) {
      return res.status(400).json({ message: 'Name and defaults are required' });
    }
    
    try {
      // Normalize property defaults
      const normalizedDefaults = DataValidator.normalizePropertyDefaults(propertyDto.defaults);
      
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
      
      // Get tax info from customer
      const dbTaxInfo = existingProperty.portfolio.customer.taxInfo;
      if (!dbTaxInfo) {
        return res.status(400).json({ 
          message: 'Tax info not found for this customer. Please add tax information first.' 
        });
      }
      
      // Convert to application TaxInfo type
      const taxInfo = CustomerMapper.mapTaxInfo(dbTaxInfo);
      
      // Create a property object for calculations
      const propertyForCalculation = {
        id: propertyId,
        name: propertyDto.name,
        defaults: normalizedDefaults,
        purchaseData: null,
        ongoingData: null,
        calculationResults: null,
        yearlyData: null
      };
      
      // Use calculation service for consistent calculations
      const { purchaseData, ongoingData, results: calculationResults, yearlyData } = 
        CalculationService.calculatePropertyData(propertyForCalculation, taxInfo);
      
      // Update the property
      const updatedProperty = await prisma.property.update({
        where: {
          id: propertyId
        },
        data: {
          name: propertyDto.name,
          defaults: normalizedDefaults as any,
          purchaseData: purchaseData as any,
          ongoingData: ongoingData as any,
          calculationResults: calculationResults as any,
          yearlyData: yearlyData as any
        }
      });
      
      return res.status(200).json(updatedProperty);
    } catch (error: any) {
      console.error('Error updating property:', error);
      return res.status(500).json({ 
        message: 'Failed to update property', 
        error: error?.message || 'Unknown error'
      });
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