export type CaseStatus =
  'draft' | 'active' | 'suspended' | 'completed' | 'cancelled' | 'terminated';

export type RiskLevel = 'normal' | 'attention' | 'high';

export interface MentorAssignment {
  endedOn: string | null;
  id: string;
  mentorMemberId: string;
  mentorName: string;
  reason: string | null;
  startedOn: string;
}

export interface TaskProgress {
  completed: number;
  percent: number;
  total: number;
}

export interface LifecycleCaseSummary {
  batchName: string | null;
  department: string | null;
  employeeName: string;
  employeeNo: string;
  id: string;
  joinedOn: string;
  jobTitle: string;
  mentor: MentorAssignment | null;
  probationEndOn: string;
  riskLevel: RiskLevel;
  status: CaseStatus;
  taskProgress: TaskProgress;
}

export interface LifecycleTask {
  assigneeMemberId: string | null;
  assigneeRole: string;
  completedAt: string | null;
  completionNote: string | null;
  description: string | null;
  dueOn: string;
  id: string;
  phase: string;
  status: 'not_started' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
  title: string;
}

export interface Checkin {
  employeeReflection: string | null;
  heldAt: string;
  id: string;
  kind: string;
  mentorNotes: string | null;
  nextCheckinOn: string | null;
  sharedNotes: string | null;
  status: string;
  supportNeeded: string | null;
  topic: string;
}

export interface ActionItem {
  assigneeMemberId: string;
  assigneeName: string;
  checkinId: string | null;
  completedAt: string | null;
  completionNote: string | null;
  dueOn: string;
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
}

export interface AssessmentSubmission {
  content: Record<string, unknown>;
  id: string;
  memberId: string;
  role: string;
  score: number | null;
  status: string;
  submittedAt: string;
}

export interface AssessmentRound {
  deadlineOn: string;
  decidedAt: string | null;
  decision: 'passed' | 'extended' | 'failed' | null;
  decisionNotes: string | null;
  extensionEndOn: string | null;
  id: string;
  kind: 'midterm' | 'probation' | 'extension';
  plannedOn: string;
  requiredRoles: string[];
  status: string;
  submissions: AssessmentSubmission[];
}

export interface LifecycleRisk {
  closedAt: string | null;
  createdAt: string;
  evidence: string | null;
  id: string;
  level: RiskLevel;
  resolution: string | null;
  ruleCode: string | null;
  source: string;
  status: 'open' | 'in_progress' | 'closed' | 'ignored';
  summary: string;
}

export interface LifecycleCaseDetail extends LifecycleCaseSummary {
  actions: ActionItem[];
  assessments: AssessmentRound[];
  auditTrail: Array<{
    actorMemberId: string;
    createdAt: string;
    eventType: string;
    id: string;
    payload: Record<string, unknown>;
  }>;
  checkins: Checkin[];
  managerMemberId: string | null;
  memberId: string | null;
  mentorHistory: MentorAssignment[];
  ownerMemberId: string;
  risks: LifecycleRisk[];
  summary: string | null;
  tasks: LifecycleTask[];
  templateId: string | null;
}

export interface LifecycleDashboard {
  activeCount: number;
  dueSoonCount: number;
  openRiskCount: number;
  overdueTaskCount: number;
  priorityCases: LifecycleCaseSummary[];
  stages: Record<string, number>;
}

export interface LifecycleTemplate {
  assessmentSchema: Record<string, unknown>;
  id: string;
  name: string;
  positionFamily: string | null;
  probationDays: number;
  status: string;
  tasks: Array<Record<string, unknown>>;
  version: number;
}

export interface MentorProfile {
  capacity: number;
  currentLoad: number;
  displayName: string;
  id: string;
  jobTitle: string | null;
  memberId: string;
  skills: string[];
  status: 'available' | 'busy' | 'unavailable';
}

export interface LifecycleContext {
  membershipId: string;
  organizationId: string;
  permissions: string[];
  roleKeys: string[];
}

export type LifecycleView = 'dashboard' | 'operations' | 'mentor' | 'growth' | 'assessment';
