// lib/dto/PortfolioDto.ts

// Type for creating a portfolio
export interface PortfolioCreateDto {
  name: string;
  customerId: string;
}

// Type for updating a portfolio
export interface PortfolioUpdateDto {
  name: string;
}

// Type for portfolio response from server
export interface PortfolioResponseDto {
  id: string;
  name: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    userId: string;
  };
}

// Mapper for portfolio DTOs
export class PortfolioMapper {
  // Convert to response DTO
  static toResponseDto(portfolio: any): PortfolioResponseDto {
    return {
      id: portfolio.id,
      name: portfolio.name,
      customerId: portfolio.customerId,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      customer: portfolio.customer ? {
        id: portfolio.customer.id,
        name: portfolio.customer.name,
        userId: portfolio.customer.userId
      } : undefined
    };
  }
}