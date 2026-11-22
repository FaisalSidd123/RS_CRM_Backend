export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface IngestedLead {
  id: string;
  name: string;
  phone: string;
  rawPhone: string;
  source: 'WhatsApp' | 'Zameen' | 'Facebook' | 'Instagram' | 'Phone' | 'Walk-in' | 'Referral';
  status: 'New' | 'Contacted' | 'Qualified' | 'Visit Scheduled' | 'Visit Done' | 'Negotiation' | 'Won' | 'Lost';
  temperature: 'Hot' | 'Warm' | 'Cold';
  interest: 'Buy' | 'Rent' | 'Sell' | 'Invest';
  propertyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations?: string[];
  notes: string;
  assignedAgentId?: string; // undefined means unassigned
  createdAt: string;
  updatedAt: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}
