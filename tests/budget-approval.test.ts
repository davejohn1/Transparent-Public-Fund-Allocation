import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract calls
const mockContractCalls = {
  setBudget: vi.fn(),
  getBudget: vi.fn(),
  updateBudget: vi.fn(),
};

// Mock the tx-sender
let mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Treasury principal

// Setup mock functions
beforeEach(() => {
  // Reset mocks
  mockContractCalls.setBudget.mockReset();
  mockContractCalls.getBudget.mockReset();
  mockContractCalls.updateBudget.mockReset();
  
  // Setup default behavior
  mockContractCalls.setBudget.mockImplementation((department, year, amount) => {
    if (mockTxSender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { type: 'err', value: 100 }; // ERR-UNAUTHORIZED
    }
    if (amount <= 0) {
      return { type: 'err', value: 101 }; // ERR-INVALID-AMOUNT
    }
    return { type: 'ok', value: true };
  });
  
  mockContractCalls.getBudget.mockImplementation((department, year) => {
    // Simulate some stored budgets
    if (department === 'Education' && year === 2023) {
      return 1000000;
    }
    if (department === 'Healthcare' && year === 2023) {
      return 2000000;
    }
    return 0; // Default to 0 if not found
  });
  
  mockContractCalls.updateBudget.mockImplementation((department, year, newAmount) => {
    if (mockTxSender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { type: 'err', value: 100 }; // ERR-UNAUTHORIZED
    }
    if (newAmount <= 0) {
      return { type: 'err', value: 101 }; // ERR-INVALID-AMOUNT
    }
    // Check if budget exists
    const existingBudget = mockContractCalls.getBudget(department, year);
    if (existingBudget === 0) {
      return { type: 'err', value: 102 }; // Budget not found
    }
    return { type: 'ok', value: true };
  });
});

describe('Budget Approval Contract', () => {
  it('should set budget when called by authorized principal', () => {
    mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Treasury principal
    const result = mockContractCalls.setBudget('Education', 2024, 1500000);
    expect(result).toEqual({ type: 'ok', value: true });
  });
  
  it('should reject budget setting when called by unauthorized principal', () => {
    mockTxSender = 'ST2REHHS5J3CERCRBEPMGH7NIV22XCFT54M7NZGAZ'; // Unauthorized principal
    const result = mockContractCalls.setBudget('Education', 2024, 1500000);
    expect(result).toEqual({ type: 'err', value: 100 }); // ERR-UNAUTHORIZED
  });
  
  it('should reject budget setting with invalid amount', () => {
    mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Treasury principal
    const result = mockContractCalls.setBudget('Education', 2024, 0);
    expect(result).toEqual({ type: 'err', value: 101 }); // ERR-INVALID-AMOUNT
  });
  
  it('should retrieve correct budget for a department', () => {
    const educationBudget = mockContractCalls.getBudget('Education', 2023);
    expect(educationBudget).toBe(1000000);
    
    const healthcareBudget = mockContractCalls.getBudget('Healthcare', 2023);
    expect(healthcareBudget).toBe(2000000);
    
    const nonExistentBudget = mockContractCalls.getBudget('NonExistent', 2023);
    expect(nonExistentBudget).toBe(0);
  });
  
  it('should update budget when called by authorized principal', () => {
    mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Treasury principal
    const result = mockContractCalls.updateBudget('Education', 2023, 1800000);
    expect(result).toEqual({ type: 'ok', value: true });
  });
  
  it('should reject budget update for non-existent budget', () => {
    mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Treasury principal
    const result = mockContractCalls.updateBudget('NonExistent', 2023, 1000000);
    expect(result).toEqual({ type: 'err', value: 102 }); // Budget not found
  });
});
