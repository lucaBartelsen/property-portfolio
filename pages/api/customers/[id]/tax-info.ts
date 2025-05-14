// pages/api/customers/[id]/tax-info.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import { TaxInfoDto } from '../../../../lib/dto/CustomerDto';
import { DataValidator } from '../../../../lib/utils/validation';

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

  // Verify customer belongs to user
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      userId
    }
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // GET - Get tax info for a customer
  if (req.method === 'GET') {
    try {
      const taxInfo = await prisma.taxInfo.findUnique({
        where: { customerId }
      });
      
      if (!taxInfo) {
        return res.status(404).json({ message: 'Tax info not found' });
      }
      
      return res.status(200).json(taxInfo);
    } catch (error) {
      console.error('Error fetching tax info:', error);
      return res.status(500).json({ message: 'Failed to fetch tax info' });
    }
  }
  
  // POST - Create tax info for a customer
  if (req.method === 'POST') {
    const { annualIncome, taxStatus, hasChurchTax, churchTaxRate, taxRate } = req.body;
    
    if (annualIncome === undefined || !taxStatus || taxRate === undefined) {
      return res.status(400).json({ message: 'Annual income, tax status, and tax rate are required' });
    }
    
    // Validate tax status
    if (taxStatus !== 'single' && taxStatus !== 'married') {
      return res.status(400).json({ 
        message: 'Tax status must be either "single" or "married"' 
      });
    }
    
    try {
      // Check if tax info already exists
      const existingTaxInfo = await prisma.taxInfo.findUnique({
        where: { customerId }
      });
      
      if (existingTaxInfo) {
        return res.status(409).json({ message: 'Tax info already exists for this customer' });
      }
      
      const taxInfo = await prisma.taxInfo.create({
        data: {
          customerId,
          annualIncome,
          taxStatus: taxStatus as 'single' | 'married',
          hasChurchTax: hasChurchTax || false,
          churchTaxRate: churchTaxRate || 9,
          taxRate
        }
      });
      
      return res.status(201).json(taxInfo);
    } catch (error) {
      console.error('Error creating tax info:', error);
      return res.status(500).json({ message: 'Failed to create tax info' });
    }
  }
  
  // PUT - Update tax info for a customer
  if (req.method === 'PUT') {
    const taxInfoData = req.body;
    
    // Validate input
    if (taxInfoData.annualIncome === undefined || !taxInfoData.taxStatus || taxInfoData.taxRate === undefined) {
      return res.status(400).json({ message: 'Annual income, tax status, and tax rate are required' });
    }
    
    // Validate tax status
    if (taxInfoData.taxStatus !== 'single' && taxInfoData.taxStatus !== 'married') {
      return res.status(400).json({ 
        message: 'Tax status must be either "single" or "married"' 
      });
    }
    
    try {
      // Normalize tax info
      const normalizedTaxInfo = DataValidator.normalizeTaxInfo(taxInfoData);
      
      // Update or create tax info (upsert)
      const taxInfo = await prisma.taxInfo.upsert({
        where: { customerId },
        update: {
          annualIncome: normalizedTaxInfo.annualIncome,
          taxStatus: normalizedTaxInfo.taxStatus,
          hasChurchTax: normalizedTaxInfo.hasChurchTax,
          churchTaxRate: normalizedTaxInfo.churchTaxRate,
          taxRate: normalizedTaxInfo.taxRate
        },
        create: {
          customerId,
          annualIncome: normalizedTaxInfo.annualIncome,
          taxStatus: normalizedTaxInfo.taxStatus,
          hasChurchTax: normalizedTaxInfo.hasChurchTax,
          churchTaxRate: normalizedTaxInfo.churchTaxRate,
          taxRate: normalizedTaxInfo.taxRate
        }
      });
      
      return res.status(200).json(taxInfo);
    } catch (error) {
      console.error('Error updating tax info:', error);
      return res.status(500).json({ message: 'Failed to update tax info' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}