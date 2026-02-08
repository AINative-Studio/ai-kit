/**
 * Beta Testing Program Types
 * Built by AINative
 */

export interface BetaSignup {
  email: string;
  name: string;
  signupDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  id: string;
}

export interface BetaFeedback {
  userId: string;
  email: string;
  rating: number; // 1-5
  feedback: string;
  feature?: string;
  timestamp: Date;
  id: string;
}

export interface BetaStatus {
  email: string;
  hasAccess: boolean;
  signupDate?: Date;
  approvalDate?: Date;
}

export interface RateLimitInfo {
  key: string;
  count: number;
  resetTime: Date;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
