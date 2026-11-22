// ============================================================================
// PropertyOS Pakistan — Core Backend Domain Models
// ============================================================================

export type UserRole = 'owner' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export type LeadSource = 'whatsapp' | 'zameen' | 'facebook' | 'instagram' | 'phone' | 'walk_in' | 'referral';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit_scheduled'
  | 'visit_done'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  fullName: string;
  rawPhone: string;
  phone: string; // Formatted "0300-1234567"
  source: LeadSource;
  status: LeadStatus;
  temperature: LeadTemperature;
  
  // Real Estate Attributes
  interest: 'Buy' | 'Rent' | 'Sell' | 'Invest';
  propertyType: 'House' | 'Apartment' | 'Plot' | 'Commercial Shop' | 'Office' | 'Farmhouse';
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations: string[];
  inquiryNotes: string;
  
  // Manager Concurrency Lock
  isLocked: boolean;
  claimedByManagerId?: string;
  lockedAt?: string;
  
  // Field Agent Assignment
  assignedAgentId?: string;
  assignedAt?: string;
  
  // Zero-Miss Follow-up Tracking
  nextFollowUpAt?: string;
  
  // Duplicate check
  isDuplicate: boolean;
  duplicateOfId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  metaMessageId?: string;
  direction: 'inbound' | 'outbound';
  senderPhone: string;
  recipientPhone: string;
  messageBody: string;
  timestamp: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'rescheduled' | 'overdue' | 'cancelled';
export type FollowUpAction = 'call' | 'whatsapp' | 'meeting';

export interface FollowUp {
  id: string;
  leadId: string;
  createdByUserId: string;
  assignedToUserId: string; // usually the manager or agent
  scheduledAt: string;
  completedAt?: string;
  status: FollowUpStatus;
  priority: 'high' | 'medium' | 'low';
  actionType: FollowUpAction;
  reminderNote: string;
  outcomeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  propertyCode: string; // e.g. "PK-DHA-0142"
  title: string;
  purpose: 'sale' | 'rent';
  type: string;
  city: string;
  areaSociety: string;
  blockPhase?: string;
  price: number;
  size: number;
  sizeUnit: 'sq yd' | 'sq ft' | 'Marla' | 'Kanal';
  bedrooms?: number;
  bathrooms?: number;
  ownerName: string;
  ownerPhone: string;
  status: 'available' | 'under_offer' | 'sold' | 'rented';
  listingAgentId?: string;
  createdAt: string;
}

export type VisitStatus = 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';

export interface SiteVisit {
  id: string;
  leadId: string;
  propertyId: string;
  assignedAgentId: string;
  scheduledByManagerId: string;
  scheduledTime: string;
  completedTime?: string;
  status: VisitStatus;
  clientFeedback?: string;
  agentInternalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | 'token_received'
  | 'documentation_ndc'
  | 'sale_agreement'
  | 'transfer_scheduled'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  dealTitle: string;
  leadId: string;
  propertyId: string;
  agentId: string;
  managerId?: string;
  stage: DealStage;
  agreedPrice: number;
  tokenAmount: number;
  tokenDate?: string;
  agencyCommissionPct: number;
  totalCommission: number; // calculated: (agreedPrice * pct) / 100
  targetClosingDate?: string;
  actualClosingDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  leadId?: string;
  userId?: string;
  actionType: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
