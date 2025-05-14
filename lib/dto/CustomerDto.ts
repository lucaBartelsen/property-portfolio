// lib/dto/CustomerDto.ts
import { TaxInfo } from '../types';

// Type for tax info in DTOs
export interface TaxInfoDto {
  annualIncome: number;
  taxStatus: 'single' | 'married';
  hasChurchTax: boolean;
  churchTaxRate: number;
  taxRate: number;
}

// Type for creating a customer
export interface CustomerCreateDto {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  taxInfo?: TaxInfoDto;
}

// Type for updating a customer
export interface CustomerUpdateDto {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// Type for customer response from server
export interface CustomerResponseDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  taxInfo?: {
    id: string;
    annualIncome: number;
    taxStatus: 'single' | 'married';
    hasChurchTax: boolean;
    churchTaxRate: number;
    taxRate: number;
  };
}

// Mapper for customer DTOs
export class CustomerMapper {
  // Convert to response DTO
  static toResponseDto(customer: any): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      userId: customer.userId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      taxInfo: customer.taxInfo
    };
  }

  // Convert tax info from DB to application type
  static mapTaxInfo(dbTaxInfo: any): TaxInfo | null {
    if (!dbTaxInfo) return null;
    
    return {
      annualIncome: dbTaxInfo.annualIncome,
      taxStatus: dbTaxInfo.taxStatus as 'single' | 'married',
      hasChurchTax: dbTaxInfo.hasChurchTax,
      churchTaxRate: dbTaxInfo.churchTaxRate,
      taxRate: dbTaxInfo.taxRate
    };
  }
}