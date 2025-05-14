// services/apiService.ts
import { PropertyCreateDto, PropertyUpdateDto, PropertyResponseDto, PropertyMapper } from '../lib/dto/PropertyDto';
import { CustomerCreateDto, CustomerUpdateDto, CustomerResponseDto, CustomerMapper, TaxInfoDto } from '../lib/dto/CustomerDto';
import { PortfolioCreateDto, PortfolioUpdateDto, PortfolioResponseDto, PortfolioMapper } from '../lib/dto/PortfolioDto';
import { Property, TaxInfo } from '../lib/types';

// Base API service with common functionality
class BaseApiService {
  protected static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json() as T;
  }
}

// Property API service
export class PropertyApiService extends BaseApiService {
  // Fetch a property by ID
  static async getProperty(id: string): Promise<Property> {
    const response = await fetch(`/api/properties/${id}`);
    const dto = await this.handleResponse<PropertyResponseDto>(response);
    return PropertyMapper.toDomain(dto);
  }
  
  // Fetch properties for a portfolio
  static async getPropertiesByPortfolio(portfolioId: string): Promise<Property[]> {
    const response = await fetch(`/api/properties?portfolioId=${portfolioId}`);
    const dtos = await this.handleResponse<PropertyResponseDto[]>(response);
    return dtos.map(dto => PropertyMapper.toDomain(dto));
  }
  
  // Create a new property
  static async createProperty(property: Property, portfolioId: string): Promise<Property> {
    const dto = PropertyMapper.toCreateDto(property, portfolioId);
    
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    const responseDto = await this.handleResponse<PropertyResponseDto>(response);
    return PropertyMapper.toDomain(responseDto);
  }
  
  // Update a property
  static async updateProperty(property: Property): Promise<Property> {
    const dto = PropertyMapper.toUpdateDto(property);
    
    const response = await fetch(`/api/properties/${property.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    
    const responseDto = await this.handleResponse<PropertyResponseDto>(response);
    return PropertyMapper.toDomain(responseDto);
  }
  
  // Delete a property
  static async deleteProperty(id: string): Promise<void> {
    const response = await fetch(`/api/properties/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete property');
    }
  }
}

// Customer API service
export class CustomerApiService extends BaseApiService {
  // Fetch all customers
  static async getCustomers(): Promise<CustomerResponseDto[]> {
    const response = await fetch('/api/customers');
    return await this.handleResponse<CustomerResponseDto[]>(response);
  }
  
  // Fetch a customer by ID
  static async getCustomer(id: string): Promise<CustomerResponseDto> {
    const response = await fetch(`/api/customers/${id}`);
    return await this.handleResponse<CustomerResponseDto>(response);
  }
  
  // Create a new customer
  static async createCustomer(data: CustomerCreateDto): Promise<CustomerResponseDto> {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await this.handleResponse<CustomerResponseDto>(response);
  }
  
  // Update a customer
  static async updateCustomer(id: string, data: CustomerUpdateDto): Promise<CustomerResponseDto> {
    const response = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await this.handleResponse<CustomerResponseDto>(response);
  }
  
  // Delete a customer
  static async deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete customer');
    }
  }
  
  // Get tax info for a customer
  static async getTaxInfo(customerId: string): Promise<TaxInfo | null> {
    const response = await fetch(`/api/customers/${customerId}/tax-info`);
    
    if (response.status === 404) {
      return null;
    }
    
    const taxInfoDto = await this.handleResponse<TaxInfoDto>(response);
    return CustomerMapper.mapTaxInfo(taxInfoDto);
  }
  
  // Update tax info for a customer
  static async updateTaxInfo(customerId: string, taxInfo: TaxInfo): Promise<TaxInfo | null> {
    const response = await fetch(`/api/customers/${customerId}/tax-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taxInfo),
    });
    
    const taxInfoDto = await this.handleResponse<TaxInfoDto>(response);
    return CustomerMapper.mapTaxInfo(taxInfoDto);
  }
}

// Portfolio API service
export class PortfolioApiService extends BaseApiService {
  // Get portfolios for a customer
  static async getPortfoliosByCustomer(customerId: string): Promise<PortfolioResponseDto[]> {
    const response = await fetch(`/api/portfolios?customerId=${customerId}`);
    return await this.handleResponse<PortfolioResponseDto[]>(response);
  }
  
  // Get a portfolio by ID
  static async getPortfolio(id: string): Promise<PortfolioResponseDto> {
    const response = await fetch(`/api/portfolios/${id}`);
    return await this.handleResponse<PortfolioResponseDto>(response);
  }
  
  // Create a new portfolio
  static async createPortfolio(data: PortfolioCreateDto): Promise<PortfolioResponseDto> {
    const response = await fetch('/api/portfolios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await this.handleResponse<PortfolioResponseDto>(response);
  }
  
  // Update a portfolio
  static async updatePortfolio(id: string, data: PortfolioUpdateDto): Promise<PortfolioResponseDto> {
    const response = await fetch(`/api/portfolios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await this.handleResponse<PortfolioResponseDto>(response);
  }
  
  // Delete a portfolio
  static async deletePortfolio(id: string): Promise<void> {
    const response = await fetch(`/api/portfolios/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete portfolio');
    }
  }
}