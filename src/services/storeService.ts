import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  Lead,
  FollowUp,
  Property,
  SiteVisit,
  Deal,
  ActivityLog,
  WhatsAppMessage,
} from '../types/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'crm_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function formatPakistaniPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    const local = '0' + digits.slice(2);
    return `${local.slice(0, 4)}-${local.slice(4)}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return raw;
}

// Default Seed Users (3 Portals)
const initialUsers: User[] = [
  // 1. Owners / Admins
  {
    id: 'usr-owner-1',
    name: 'Imran Qureshi',
    email: 'imran@propertyos.pk',
    phone: '0300-8219482',
    role: 'owner',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-2',
    name: 'Tariq Mehmood',
    email: 'tariq@propertyos.pk',
    phone: '0300-9988112',
    role: 'owner',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  // 2. Branch & Team Managers
  {
    id: 'usr-mgr-1',
    name: 'Sana Malik',
    email: 'sana@propertyos.pk',
    phone: '0321-4455667',
    role: 'manager',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-mgr-2',
    name: 'Farhan Siddiqui',
    email: 'farhan@propertyos.pk',
    phone: '0333-9988776',
    role: 'manager',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-mgr-3',
    name: 'Zainab Raza',
    email: 'zainab@propertyos.pk',
    phone: '0322-1122445',
    role: 'manager',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  // 3. Field Agents
  {
    id: 'usr-agent-1',
    name: 'Bilal Ahmed',
    email: 'bilal@propertyos.pk',
    phone: '0300-1122334',
    role: 'agent',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-agent-2',
    name: 'Ayesha Khan',
    email: 'ayesha@propertyos.pk',
    phone: '0345-5544332',
    role: 'agent',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-agent-3',
    name: 'Usman Ghani',
    email: 'usman@propertyos.pk',
    phone: '0331-7788990',
    role: 'agent',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-agent-4',
    name: 'Hamza Ali',
    email: 'hamza@propertyos.pk',
    phone: '0315-6677889',
    role: 'agent',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Default Properties (Clean slate for real agency listings)
const initialProperties: Property[] = [];

class StoreService {
  users: User[] = initialUsers;
  leads: Lead[] = [];
  followUps: FollowUp[] = [];
  properties: Property[] = initialProperties;
  siteVisits: SiteVisit[] = [];
  deals: Deal[] = [];
  whatsappMessages: WhatsAppMessage[] = [];
  activityLogs: ActivityLog[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private saveToDisk() {
    try {
      const payload = {
        users: this.users,
        leads: this.leads,
        followUps: this.followUps,
        properties: this.properties,
        siteVisits: this.siteVisits,
        deals: this.deals,
        whatsappMessages: this.whatsappMessages,
        activityLogs: this.activityLogs,
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving store to disk:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users?.length) this.users = data.users;
        if (data.leads) this.leads = data.leads;
        if (data.followUps) this.followUps = data.followUps;
        if (data.properties?.length) this.properties = data.properties;
        if (data.siteVisits) this.siteVisits = data.siteVisits;
        if (data.deals) this.deals = data.deals;
        if (data.whatsappMessages) this.whatsappMessages = data.whatsappMessages;
        if (data.activityLogs) this.activityLogs = data.activityLogs;
      }
    } catch (err) {
      console.error('Error reading store from disk:', err);
    }
  }

  logActivity(leadId: string | undefined, userId: string | undefined, actionType: string, description: string, metadata?: any) {
    const act: ActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId,
      userId,
      actionType,
      description,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.activityLogs.unshift(act);
    this.saveToDisk();
    return act;
  }

  addUser(user: User): User {
    this.users.push(user);
    this.logActivity(undefined, user.id, 'user_registered', `New staff member added: ${user.name} (${user.role})`);
    this.saveToDisk();
    return user;
  }

  // ==========================================================================
  // WHATSAPP INGESTION & LEADS
  // ==========================================================================
  ingestWhatsAppLead(fromRaw: string, senderName: string, messageBody: string, metaMessageId?: string): { lead: Lead; isDuplicate: boolean } {
    const formattedPhone = formatPakistaniPhone(fromRaw);
    const existing = this.leads.find((l) => l.rawPhone === fromRaw || l.phone === formattedPhone);

    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead-wa-${Date.now()}`,
      fullName: senderName || 'WhatsApp Lead',
      rawPhone: fromRaw,
      phone: formattedPhone,
      source: 'whatsapp',
      status: 'new',
      temperature: 'hot',
      interest: 'Buy',
      propertyType: 'Plot',
      preferredLocations: ['DHA Phase 6'],
      inquiryNotes: messageBody,
      isLocked: false,
      claimedByManagerId: undefined,
      lockedAt: undefined,
      assignedAgentId: undefined,
      isDuplicate: !!existing,
      duplicateOfId: existing ? existing.id : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.leads.unshift(lead);

    // Save message log
    this.whatsappMessages.unshift({
      id: `wa-msg-${Date.now()}`,
      leadId: lead.id,
      metaMessageId,
      direction: 'inbound',
      senderPhone: fromRaw,
      recipientPhone: 'Agency WABA',
      messageBody,
      timestamp: now,
    });

    this.logActivity(lead.id, undefined, 'whatsapp_lead_ingested', `Incoming WhatsApp inquiry from ${lead.fullName} (${lead.phone})`);
    this.saveToDisk();

    return { lead, isDuplicate: !!existing };
  }

  getLeads(filter?: { status?: string; managerId?: string; agentId?: string; unassigned?: boolean }) {
    return this.leads.filter((l) => {
      if (filter?.unassigned && l.claimedByManagerId) return false;
      if (filter?.managerId && l.claimedByManagerId !== filter.managerId) return false;
      if (filter?.agentId && l.assignedAgentId !== filter.agentId) return false;
      if (filter?.status && l.status !== filter.status) return false;
      return true;
    });
  }

  getLeadById(id: string) {
    return this.leads.find((l) => l.id === id);
  }

  // ==========================================================================
  // MANAGER CONCURRENCY LOCK ENGINE
  // ==========================================================================
  claimLead(leadId: string, managerId: string): { success: boolean; lead?: Lead; lockedBy?: User; message: string } {
    const lead = this.getLeadById(leadId);
    if (!lead) {
      return { success: false, message: 'Lead not found' };
    }

    const manager = this.users.find((u) => u.id === managerId);
    if (!manager) {
      return { success: false, message: 'Manager user not found' };
    }

    // Check if locked by ANOTHER manager
    if (lead.isLocked && lead.claimedByManagerId && lead.claimedByManagerId !== managerId) {
      const currentHolder = this.users.find((u) => u.id === lead.claimedByManagerId);
      return {
        success: false,
        lead,
        lockedBy: currentHolder,
        message: `Lead is currently locked by Manager ${currentHolder?.name || 'Another Manager'}`,
      };
    }

    // Acquire Lock
    lead.isLocked = true;
    lead.claimedByManagerId = managerId;
    lead.lockedAt = new Date().toISOString();
    if (lead.status === 'new') {
      lead.status = 'contacted';
    }
    lead.updatedAt = new Date().toISOString();

    this.logActivity(
      lead.id,
      managerId,
      'lead_claimed_and_locked',
      `Lead claimed and locked by Manager ${manager.name}`
    );
    this.saveToDisk();

    return { success: true, lead, message: `Lead successfully locked by ${manager.name}` };
  }

  releaseLeadLock(leadId: string, userId: string): { success: boolean; lead?: Lead; message: string } {
    const lead = this.getLeadById(leadId);
    if (!lead) return { success: false, message: 'Lead not found' };

    const user = this.users.find((u) => u.id === userId);
    // Only owner or current manager can unlock
    if (user?.role !== 'owner' && lead.claimedByManagerId !== userId) {
      return { success: false, message: 'You do not have permission to unlock this lead' };
    }

    lead.isLocked = false;
    lead.claimedByManagerId = undefined;
    lead.lockedAt = undefined;
    lead.updatedAt = new Date().toISOString();

    this.logActivity(lead.id, userId, 'lead_lock_released', `Lead lock released by ${user?.name || 'Staff'}`);
    this.saveToDisk();

    return { success: true, lead, message: 'Lead unlocked successfully' };
  }

  updateLead(leadId: string, updates: Partial<Lead>, userId?: string): Lead | null {
    const lead = this.getLeadById(leadId);
    if (!lead) return null;

    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    this.logActivity(lead.id, userId, 'lead_updated', `Lead updated: ${Object.keys(updates).join(', ')}`);
    this.saveToDisk();
    return lead;
  }

  // ==========================================================================
  // FOLLOW-UP REMINDER ENGINE
  // ==========================================================================
  createFollowUp(data: {
    leadId: string;
    createdByUserId: string;
    assignedToUserId: string;
    scheduledAt: string;
    actionType: 'call' | 'whatsapp' | 'meeting';
    reminderNote: string;
    priority?: 'high' | 'medium' | 'low';
  }): FollowUp {
    const followUp: FollowUp = {
      id: `flw-${Date.now()}`,
      leadId: data.leadId,
      createdByUserId: data.createdByUserId,
      assignedToUserId: data.assignedToUserId,
      scheduledAt: data.scheduledAt,
      actionType: data.actionType,
      reminderNote: data.reminderNote,
      priority: data.priority || 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.followUps.unshift(followUp);

    // Update lead's nextFollowUpAt
    const lead = this.getLeadById(data.leadId);
    if (lead) {
      lead.nextFollowUpAt = data.scheduledAt;
      lead.updatedAt = new Date().toISOString();
    }

    this.logActivity(
      data.leadId,
      data.createdByUserId,
      'follow_up_scheduled',
      `Follow-up scheduled for ${new Date(data.scheduledAt).toLocaleString()}: ${data.reminderNote}`
    );
    this.saveToDisk();
    return followUp;
  }

  completeFollowUp(followUpId: string, outcomeNotes: string, userId: string): FollowUp | null {
    const flw = this.followUps.find((f) => f.id === followUpId);
    if (!flw) return null;

    flw.status = 'completed';
    flw.completedAt = new Date().toISOString();
    flw.outcomeNotes = outcomeNotes;
    flw.updatedAt = new Date().toISOString();

    this.logActivity(flw.leadId, userId, 'follow_up_completed', `Follow-up completed: ${outcomeNotes}`);
    this.saveToDisk();
    return flw;
  }

  getFollowUps(userId?: string, filter?: 'pending' | 'overdue' | 'all') {
    const now = new Date().toISOString();
    return this.followUps.filter((f) => {
      if (userId && f.assignedToUserId !== userId) return false;
      if (filter === 'pending' && f.status !== 'pending') return false;
      if (filter === 'overdue' && (f.status !== 'pending' || f.scheduledAt >= now)) return false;
      return true;
    });
  }

  // ==========================================================================
  // SITE VISITS & AGENT HANDOFF
  // ==========================================================================
  scheduleSiteVisit(data: {
    leadId: string;
    propertyId: string;
    assignedAgentId: string;
    scheduledByManagerId: string;
    scheduledTime: string;
    agentInternalNotes?: string;
  }): { visit: SiteVisit; lead: Lead } {
    const visit: SiteVisit = {
      id: `vst-${Date.now()}`,
      leadId: data.leadId,
      propertyId: data.propertyId,
      assignedAgentId: data.assignedAgentId,
      scheduledByManagerId: data.scheduledByManagerId,
      scheduledTime: data.scheduledTime,
      status: 'scheduled',
      agentInternalNotes: data.agentInternalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.siteVisits.unshift(visit);

    // Update lead status and assign agent
    const lead = this.getLeadById(data.leadId)!;
    lead.assignedAgentId = data.assignedAgentId;
    lead.assignedAt = new Date().toISOString();
    lead.status = 'visit_scheduled';
    lead.updatedAt = new Date().toISOString();

    const agent = this.users.find((u) => u.id === data.assignedAgentId);
    const prop = this.properties.find((p) => p.id === data.propertyId);

    this.logActivity(
      lead.id,
      data.scheduledByManagerId,
      'site_visit_scheduled',
      `Site visit scheduled for property ${prop?.propertyCode || ''} with Agent ${agent?.name || ''}`
    );
    this.saveToDisk();

    return { visit, lead };
  }

  completeSiteVisit(visitId: string, clientFeedback: string, agentId: string): SiteVisit | null {
    const visit = this.siteVisits.find((v) => v.id === visitId);
    if (!visit) return null;

    visit.status = 'completed';
    visit.completedTime = new Date().toISOString();
    visit.clientFeedback = clientFeedback;
    visit.updatedAt = new Date().toISOString();

    const lead = this.getLeadById(visit.leadId);
    if (lead) {
      lead.status = 'visit_done';
      lead.updatedAt = new Date().toISOString();
    }

    this.logActivity(visit.leadId, agentId, 'site_visit_completed', `Site visit completed. Feedback: ${clientFeedback}`);
    this.saveToDisk();
    return visit;
  }

  getSiteVisits(agentId?: string) {
    if (agentId) {
      return this.siteVisits.filter((v) => v.assignedAgentId === agentId);
    }
    return this.siteVisits;
  }

  // ==========================================================================
  // DEALS PIPELINE (Agent Closing)
  // ==========================================================================
  createDeal(data: {
    dealTitle: string;
    leadId: string;
    propertyId: string;
    agentId: string;
    managerId?: string;
    agreedPrice: number;
    tokenAmount: number;
    tokenDate?: string;
    agencyCommissionPct?: number;
    targetClosingDate?: string;
  }): Deal {
    const pct = data.agencyCommissionPct || 1.0;
    const totalCommission = Math.round((data.agreedPrice * pct) / 100);

    const deal: Deal = {
      id: `deal-${Date.now()}`,
      dealTitle: data.dealTitle,
      leadId: data.leadId,
      propertyId: data.propertyId,
      agentId: data.agentId,
      managerId: data.managerId,
      stage: 'token_received',
      agreedPrice: data.agreedPrice,
      tokenAmount: data.tokenAmount,
      tokenDate: data.tokenDate || new Date().toISOString().split('T')[0],
      agencyCommissionPct: pct,
      totalCommission,
      targetClosingDate: data.targetClosingDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.deals.unshift(deal);

    // Update lead status to negotiation/won
    const lead = this.getLeadById(data.leadId);
    if (lead) {
      lead.status = 'negotiation';
      lead.updatedAt = new Date().toISOString();
    }

    this.logActivity(data.leadId, data.agentId, 'deal_created', `Deal "${deal.dealTitle}" created at Token stage`);
    this.saveToDisk();
    return deal;
  }

  updateDealStage(dealId: string, stage: Deal['stage'], userId: string): Deal | null {
    const deal = this.deals.find((d) => d.id === dealId);
    if (!deal) return null;

    deal.stage = stage;
    deal.updatedAt = new Date().toISOString();
    if (stage === 'closed_won') {
      deal.actualClosingDate = new Date().toISOString().split('T')[0];
      const lead = this.getLeadById(deal.leadId);
      if (lead) {
        lead.status = 'won';
        lead.updatedAt = new Date().toISOString();
      }
      const prop = this.properties.find((p) => p.id === deal.propertyId);
      if (prop) {
        prop.status = 'sold';
      }
    }

    this.logActivity(deal.leadId, userId, 'deal_stage_changed', `Deal moved to stage: ${stage}`);
    this.saveToDisk();
    return deal;
  }

  getDeals(agentId?: string) {
    if (agentId) {
      return this.deals.filter((d) => d.agentId === agentId);
    }
    return this.deals;
  }
}

export const store = new StoreService();
