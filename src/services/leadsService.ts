import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IngestedLead } from '../types/whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with JSON
let leadsCache: IngestedLead[] = [];

// Load existing leads from JSON on startup
try {
  if (fs.existsSync(LEADS_FILE)) {
    const data = fs.readFileSync(LEADS_FILE, 'utf-8');
    leadsCache = JSON.parse(data);
  }
} catch (error) {
  console.error('Error reading leads.json:', error);
  leadsCache = [];
}

function saveLeads() {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leadsCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving leads to file:', error);
  }
}

/**
 * Standardize Pakistani phone number:
 * "923001234567" -> "0300-1234567"
 * "+923001234567" -> "0300-1234567"
 */
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

/**
 * Basic NLP parser to extract intent, locations & budget hints from WhatsApp text
 */
function parseMessageContent(text: string) {
  const lower = text.toLowerCase();

  // Interest detection
  let interest: IngestedLead['interest'] = 'Buy';
  if (lower.includes('rent') || lower.includes('kiraya')) interest = 'Rent';
  else if (lower.includes('sell') || lower.includes('bechna')) interest = 'Sell';
  else if (lower.includes('invest')) interest = 'Invest';

  // Property type detection
  let propertyType = 'Plot';
  if (lower.includes('house') || lower.includes('makan') || lower.includes('bangla') || lower.includes('bungalow')) {
    propertyType = 'House';
  } else if (lower.includes('flat') || lower.includes('apartment')) {
    propertyType = 'Apartment';
  } else if (lower.includes('shop') || lower.includes('office') || lower.includes('commercial')) {
    propertyType = 'Commercial Shop';
  }

  // Location hints
  const preferredLocations: string[] = [];
  const knownLocations = [
    'DHA Phase 5',
    'DHA Phase 6',
    'DHA Phase 8',
    'Bahria Town',
    'Clifton',
    'Gulberg',
    'F-7',
    'F-8',
    'F-10',
    'F-11',
    'DHA',
  ];
  for (const loc of knownLocations) {
    if (lower.includes(loc.toLowerCase())) {
      preferredLocations.push(loc);
      break;
    }
  }

  return { interest, propertyType, preferredLocations };
}

export function getAllLeads(): IngestedLead[] {
  return leadsCache;
}

export function processIncomingWhatsAppMessage(
  fromRaw: string,
  senderName: string,
  messageText: string
): { lead: IngestedLead; isDuplicate: boolean } {
  const formattedPhone = formatPakistaniPhone(fromRaw);

  // Check duplicate phone
  const existingLead = leadsCache.find(
    (l) => l.rawPhone === fromRaw || l.phone === formattedPhone
  );

  const parsed = parseMessageContent(messageText);
  const now = new Date().toISOString();

  const newLead: IngestedLead = {
    id: `lead-wa-${Date.now()}`,
    name: senderName || 'WhatsApp Inquiry',
    phone: formattedPhone,
    rawPhone: fromRaw,
    source: 'WhatsApp',
    status: 'New',
    temperature: 'Hot', // Fresh WhatsApp inbound leads are high intent
    interest: parsed.interest,
    propertyType: parsed.propertyType,
    preferredLocations: parsed.preferredLocations.length > 0 ? parsed.preferredLocations : ['DHA Phase 6'],
    notes: `[Inbound WhatsApp]: "${messageText}"`,
    assignedAgentId: undefined, // Enters Unassigned Pool for Owner/Manager to allocate
    createdAt: now,
    updatedAt: now,
    isDuplicate: !!existingLead,
    duplicateOfId: existingLead ? existingLead.id : undefined,
  };

  leadsCache.unshift(newLead);
  saveLeads();

  return { lead: newLead, isDuplicate: !!existingLead };
}
