export type Role = 'ADMIN' | 'ENGINEERING' | 'APPROVER' | 'OPERATIONS';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';
export type ECOType = 'PRODUCT' | 'BOM';
export type ECOStage = 'NEW' | 'IN_REVIEW' | 'DONE';
export type ECOStatus = 'NEW' | 'IN_REVIEW' | 'APPROVED' | 'DONE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface ProductVersion {
  version: number;
  salePrice: number;
  costPrice: number;
  status: ProductStatus;
  createdAt: string;
  createdVia?: string;
}

export interface Product {
  id: string;
  name: string;
  currentVersion: number;
  salePrice: number;
  costPrice: number;
  status: ProductStatus;
  createdAt: string;
  versions: ProductVersion[];
}

export interface BOMComponent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface BOMOperation {
  id: string;
  name: string;
  duration: number;
  workCenter: string;
}

export interface BOMVersion {
  version: number;
  status: ProductStatus;
  createdAt: string;
  components: BOMComponent[];
  operations: BOMOperation[];
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  currentVersion: number;
  status: ProductStatus;
  createdAt: string;
  components: BOMComponent[];
  operations: BOMOperation[];
  versions: BOMVersion[];
}

export interface ECOApproval {
  id: string;
  userId: string;
  userName: string;
  action: 'APPROVED' | 'REJECTED';
  comment: string;
  date: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actionType: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'ARCHIVE';
  ecoId?: string;
  ecoTitle?: string;
  userId: string;
  userName: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface ECOProductChange {
  field: string;
  oldValue: number;
  newValue: number;
}

export interface ECOBOMComponentChange {
  componentName: string;
  oldQty: number | null;
  newQty: number | null;
  changeType: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
}

export interface ECO {
  id: string;
  title: string;
  type: ECOType;
  productId: string;
  productName: string;
  bomId?: string;
  assignedTo: string;
  assignedToName: string;
  stage: ECOStage;
  status: ECOStatus;
  effectiveDate: string;
  versionUpdate: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  productChanges?: ECOProductChange[];
  bomComponentChanges?: ECOBOMComponentChange[];
  aiAnalysis?: string;
  aiQualityScore?: string;
  aiComplexityData?: string;
  aiTemplateSuggestion?: string;
  aiPrecedents?: string;
  aiApprovalPrediction?: string;
  aiBomImpactGraph?: string;
  aiSummary?: string;
  aiTags?: string[];
  description?: string;
  approvals: ECOApproval[];
  auditLog: AuditEntry[];
}

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@plmcontrol.com', role: 'ADMIN' },
  { id: 'u2', name: 'Bob Smith', email: 'bob@plmcontrol.com', role: 'ENGINEERING' },
  { id: 'u3', name: 'Carol White', email: 'carol@plmcontrol.com', role: 'APPROVER' },
  { id: 'u4', name: 'David Lee', email: 'david@plmcontrol.com', role: 'OPERATIONS' },
];

export const mockProducts: Product[] = [
  {
    id: 'p1', name: 'iPhone 17', currentVersion: 2, salePrice: 999, costPrice: 420, status: 'ACTIVE', createdAt: '2025-01-15',
    versions: [
      { version: 1, salePrice: 899, costPrice: 380, status: 'ARCHIVED', createdAt: '2024-09-01' },
      { version: 2, salePrice: 999, costPrice: 420, status: 'ACTIVE', createdAt: '2025-01-15', createdVia: 'ECO-002' },
    ]
  },
  {
    id: 'p2', name: 'Wooden Table', currentVersion: 1, salePrice: 299, costPrice: 89, status: 'ACTIVE', createdAt: '2025-02-10',
    versions: [
      { version: 1, salePrice: 299, costPrice: 89, status: 'ACTIVE', createdAt: '2025-02-10' },
    ]
  },
  {
    id: 'p3', name: 'Legacy Speaker', currentVersion: 3, salePrice: 149, costPrice: 45, status: 'ARCHIVED', createdAt: '2024-06-01',
    versions: [
      { version: 1, salePrice: 99, costPrice: 30, status: 'ARCHIVED', createdAt: '2023-01-01' },
      { version: 2, salePrice: 129, costPrice: 38, status: 'ARCHIVED', createdAt: '2023-08-15' },
      { version: 3, salePrice: 149, costPrice: 45, status: 'ARCHIVED', createdAt: '2024-06-01' },
    ]
  },
];

export const mockBOMs: BOM[] = [
  {
    id: 'b1', productId: 'p1', productName: 'iPhone 17', currentVersion: 1, status: 'ACTIVE', createdAt: '2025-01-15',
    components: [
      { id: 'c1', name: 'OLED Display 6.7"', quantity: 1, unit: 'pcs' },
      { id: 'c2', name: 'A19 Bionic Chip', quantity: 1, unit: 'pcs' },
      { id: 'c3', name: 'Battery 4500mAh', quantity: 1, unit: 'pcs' },
      { id: 'c4', name: 'Camera Module', quantity: 3, unit: 'pcs' },
      { id: 'c5', name: 'Titanium Frame', quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { id: 'o1', name: 'PCB Assembly', duration: 45, workCenter: 'SMT Line 1' },
      { id: 'o2', name: 'Display Bonding', duration: 15, workCenter: 'Clean Room A' },
      { id: 'o3', name: 'Final Assembly', duration: 30, workCenter: 'Assembly Line 3' },
      { id: 'o4', name: 'Quality Testing', duration: 20, workCenter: 'QC Station' },
    ],
    versions: [
      { version: 1, status: 'ACTIVE', createdAt: '2025-01-15', components: [], operations: [] },
    ]
  },
  {
    id: 'b2', productId: 'p2', productName: 'Wooden Table', currentVersion: 2, status: 'ACTIVE', createdAt: '2025-03-01',
    components: [
      { id: 'c6', name: 'Oak Wood Plank', quantity: 4, unit: 'pcs' },
      { id: 'c7', name: 'Steel Screws M6', quantity: 16, unit: 'pcs' },
      { id: 'c8', name: 'Wood Varnish', quantity: 500, unit: 'ml' },
      { id: 'c9', name: 'Table Legs (set)', quantity: 1, unit: 'set' },
    ],
    operations: [
      { id: 'o5', name: 'Wood Cutting', duration: 60, workCenter: 'Woodshop' },
      { id: 'o6', name: 'Assembly', duration: 45, workCenter: 'Assembly Bay 2' },
      { id: 'o7', name: 'Sanding & Finishing', duration: 90, workCenter: 'Finishing Room' },
    ],
    versions: [
      { version: 1, status: 'ARCHIVED', createdAt: '2025-02-10', components: [], operations: [] },
      { version: 2, status: 'ACTIVE', createdAt: '2025-03-01', components: [], operations: [] },
    ]
  },
];

export const mockECOs: ECO[] = [
  {
    id: 'eco-001', title: 'Increase screw count for stability', type: 'BOM', productId: 'p2', productName: 'Wooden Table',
    bomId: 'b2', assignedTo: 'u2', assignedToName: 'Bob Smith', stage: 'DONE', status: 'DONE',
    effectiveDate: '2025-03-01', versionUpdate: true, createdBy: 'u2', createdByName: 'Bob Smith', createdAt: '2025-02-20',
    bomComponentChanges: [
      { componentName: 'Steel Screws M6', oldQty: 12, newQty: 16, changeType: 'CHANGED' },
      { componentName: 'Oak Wood Plank', oldQty: 4, newQty: 4, changeType: 'UNCHANGED' },
      { componentName: 'Wood Varnish', oldQty: 500, newQty: 500, changeType: 'UNCHANGED' },
      { componentName: 'Table Legs (set)', oldQty: 1, newQty: 1, changeType: 'UNCHANGED' },
    ],
    approvals: [
      { id: 'a1', userId: 'u3', userName: 'Carol White', action: 'APPROVED', comment: 'Stability improvement approved.', date: '2025-02-22' },
    ],
    auditLog: [
      { id: 'al1', action: 'ECO Created by Bob Smith', actionType: 'CREATE', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-02-20T09:00:00Z' },
      { id: 'al2', action: 'Moved to In Review by Bob Smith', actionType: 'UPDATE', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-02-20T09:30:00Z' },
      { id: 'al3', action: 'Approved by Carol White', actionType: 'APPROVE', userId: 'u3', userName: 'Carol White', timestamp: '2025-02-22T14:00:00Z' },
      { id: 'al4', action: 'ECO Applied – BOM v2 created', actionType: 'UPDATE', userId: 'u1', userName: 'Alice Johnson', timestamp: '2025-03-01T10:00:00Z' },
    ]
  },
  {
    id: 'eco-002', title: 'Update cost price for premium finish', type: 'PRODUCT', productId: 'p1', productName: 'iPhone 17',
    assignedTo: 'u2', assignedToName: 'Bob Smith', stage: 'IN_REVIEW', status: 'IN_REVIEW',
    effectiveDate: '2025-04-01', versionUpdate: true, createdBy: 'u2', createdByName: 'Bob Smith', createdAt: '2025-03-10',
    productChanges: [
      { field: 'Sale Price', oldValue: 999, newValue: 1099 },
      { field: 'Cost Price', oldValue: 420, newValue: 485 },
    ],
    approvals: [],
    auditLog: [
      { id: 'al5', action: 'ECO Created by Bob Smith', actionType: 'CREATE', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-10T11:00:00Z' },
      { id: 'al6', action: 'Moved to In Review by Bob Smith', actionType: 'UPDATE', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-10T11:15:00Z' },
    ]
  },
  {
    id: 'eco-003', title: 'Add new AMOLED display component', type: 'BOM', productId: 'p1', productName: 'iPhone 17',
    bomId: 'b1', assignedTo: 'u2', assignedToName: 'Bob Smith', stage: 'NEW', status: 'NEW',
    effectiveDate: '2025-05-01', versionUpdate: true, createdBy: 'u2', createdByName: 'Bob Smith', createdAt: '2025-03-15',
    bomComponentChanges: [
      { componentName: 'OLED Display 6.7"', oldQty: 1, newQty: null, changeType: 'REMOVED' },
      { componentName: 'AMOLED Display 6.9"', oldQty: null, newQty: 1, changeType: 'ADDED' },
      { componentName: 'A19 Bionic Chip', oldQty: 1, newQty: 1, changeType: 'UNCHANGED' },
      { componentName: 'Battery 4500mAh', oldQty: 1, newQty: 1, changeType: 'UNCHANGED' },
      { componentName: 'Camera Module', oldQty: 3, newQty: 3, changeType: 'UNCHANGED' },
      { componentName: 'Titanium Frame', oldQty: 1, newQty: 1, changeType: 'UNCHANGED' },
    ],
    approvals: [],
    auditLog: [
      { id: 'al7', action: 'ECO Created by Bob Smith', actionType: 'CREATE', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-15T08:00:00Z' },
    ]
  },
];

export const mockAuditLog: AuditEntry[] = [
  { id: 'g1', action: 'Product Created', actionType: 'CREATE', userId: 'u1', userName: 'Alice Johnson', oldValue: '', newValue: 'iPhone 17', timestamp: '2024-09-01T10:00:00Z' },
  { id: 'g2', action: 'Product Created', actionType: 'CREATE', userId: 'u1', userName: 'Alice Johnson', oldValue: '', newValue: 'Wooden Table', timestamp: '2025-02-10T10:00:00Z' },
  { id: 'g3', action: 'ECO Created', actionType: 'CREATE', ecoId: 'eco-001', ecoTitle: 'Increase screw count', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-02-20T09:00:00Z' },
  { id: 'g4', action: 'ECO Approved', actionType: 'APPROVE', ecoId: 'eco-001', ecoTitle: 'Increase screw count', userId: 'u3', userName: 'Carol White', timestamp: '2025-02-22T14:00:00Z' },
  { id: 'g5', action: 'BOM Archived', actionType: 'ARCHIVE', userId: 'u1', userName: 'Alice Johnson', oldValue: 'v1', newValue: 'v2', timestamp: '2025-03-01T10:00:00Z' },
  { id: 'g6', action: 'ECO Created', actionType: 'CREATE', ecoId: 'eco-002', ecoTitle: 'Update cost price', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-10T11:00:00Z' },
  { id: 'g7', action: 'ECO Submitted for Review', actionType: 'UPDATE', ecoId: 'eco-002', ecoTitle: 'Update cost price', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-10T11:15:00Z' },
  { id: 'g8', action: 'ECO Created', actionType: 'CREATE', ecoId: 'eco-003', ecoTitle: 'Add AMOLED display', userId: 'u2', userName: 'Bob Smith', timestamp: '2025-03-15T08:00:00Z' },
  { id: 'g9', action: 'Product Archived', actionType: 'ARCHIVE', userId: 'u1', userName: 'Alice Johnson', oldValue: 'Legacy Speaker', newValue: 'Archived', timestamp: '2025-03-18T09:00:00Z' },
  { id: 'g10', action: 'ECO Rejected', actionType: 'REJECT', ecoId: 'eco-004', ecoTitle: 'Change battery supplier', userId: 'u3', userName: 'Carol White', oldValue: 'IN_REVIEW', newValue: 'REJECTED', timestamp: '2025-03-19T16:00:00Z' },
];
