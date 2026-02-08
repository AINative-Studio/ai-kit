export interface BetaSignupData {
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface BetaSignupResult {
  success: boolean;
  id: string;
  email: string;
  name: string;
  approved: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface BetaSignupStatus {
  exists: boolean;
  approved?: boolean;
  createdAt?: Date;
}

export interface BetaSignupListOptions {
  limit?: number;
  offset?: number;
  approved?: boolean;
}

export interface BetaSignupListResult {
  items: BetaSignupResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface BetaFeedback {
  email: string;
  rating: number;
  comment: string;
  category: string;
  attachments?: string[];
}

export interface BetaFeedbackResult {
  success: boolean;
  id: string;
  email: string;
  rating: number;
  comment: string;
  category: string;
  attachments?: string[];
  createdAt: Date;
}

export interface BetaFeedbackFilter {
  email?: string;
  category?: string;
  minRating?: number;
}

export interface BetaFeedbackStats {
  total: number;
  averageRating: number;
  byCategory: Record<string, number>;
}
