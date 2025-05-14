// lib/dto/PropertyDto.ts
import { Property, PropertyDefaults } from '../types';

// Type for data sent from client to server when creating/updating properties
export interface PropertyCreateDto {
  name: string;
  portfolioId: string;
  defaults: PropertyDefaults;
}

// Type for data sent from client to server when updating properties
export interface PropertyUpdateDto {
  name: string;
  defaults: PropertyDefaults;
}

// Type for property data returned from server to client
export interface PropertyResponseDto {
  id: string;
  name: string;
  portfolioId: string;
  defaults: PropertyDefaults;
  purchaseData: any;
  ongoingData: any;
  calculationResults: any;
  yearlyData: any;
  createdAt: string;
  updatedAt: string;
}

// Mapper functions to convert between DTO and domain types
export class PropertyMapper {
  // Convert from domain model to response DTO
  static toResponseDto(property: any): PropertyResponseDto {
    return {
      id: property.id,
      name: property.name,
      portfolioId: property.portfolioId,
      defaults: property.defaults,
      purchaseData: property.purchaseData,
      ongoingData: property.ongoingData,
      calculationResults: property.calculationResults,
      yearlyData: property.yearlyData,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    };
  }

  // Convert from response DTO to domain model
  static toDomain(dto: PropertyResponseDto): Property {
    return {
      id: dto.id,
      name: dto.name,
      defaults: dto.defaults,
      purchaseData: dto.purchaseData,
      ongoingData: dto.ongoingData,
      calculationResults: dto.calculationResults,
      yearlyData: dto.yearlyData,
      // If you have a portfolio relation, you might need to handle it separately 
      // or include it conditionally in the mapper
    };
  }

  // Create a create DTO from a Property object
  static toCreateDto(property: Property, portfolioId: string): PropertyCreateDto {
    return {
      name: property.name,
      portfolioId,
      defaults: property.defaults
    };
  }

  // Create an update DTO from a Property object
  static toUpdateDto(property: Property): PropertyUpdateDto {
    return {
      name: property.name,
      defaults: property.defaults
    };
  }
}