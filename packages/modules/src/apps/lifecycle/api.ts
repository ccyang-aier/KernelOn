import type { KernelOnRuntimeConfig } from '../../runtime-config';
import type {
  ActionItem,
  AssessmentRound,
  AssessmentSubmission,
  Checkin,
  LifecycleCaseDetail,
  LifecycleCaseSummary,
  LifecycleContext,
  LifecycleDashboard,
  LifecycleTask,
  LifecycleTemplate,
  MentorProfile,
} from './types';

export class LifecycleApi {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(runtime: KernelOnRuntimeConfig) {
    this.#baseUrl = `${runtime.apiBaseUrl}/lifecycle`;
    this.#fetch = runtime.apiFetch ?? globalThis.fetch.bind(globalThis);
  }

  context() {
    return this.#json<LifecycleContext>('/context');
  }

  dashboard() {
    return this.#json<LifecycleDashboard>('/dashboard');
  }

  cases(search = '') {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.#json<LifecycleCaseSummary[]>(`/cases${query}`);
  }

  caseDetail(caseId: string) {
    return this.#json<LifecycleCaseDetail>(`/cases/${caseId}`);
  }

  templates() {
    return this.#json<LifecycleTemplate[]>('/templates');
  }

  mentors() {
    return this.#json<MentorProfile[]>('/mentors');
  }

  createCase(values: Record<string, unknown>) {
    return this.#json<LifecycleCaseDetail>('/cases', {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  transitionCase(caseId: string, target: string, reason?: string) {
    return this.#json<LifecycleCaseDetail>(`/cases/${caseId}/transition`, {
      body: JSON.stringify({ target, reason: reason || null }),
      method: 'POST',
    });
  }

  createTemplate(values: Record<string, unknown>) {
    return this.#json<LifecycleTemplate>('/templates', {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  upsertMentor(values: Record<string, unknown>) {
    return this.#json<MentorProfile>('/mentors', {
      body: JSON.stringify(values),
      method: 'PUT',
    });
  }

  assignMentor(caseId: string, mentor: MentorProfile, reason = '') {
    return this.#json<LifecycleCaseDetail>(`/cases/${caseId}/mentor`, {
      body: JSON.stringify({
        mentorMemberId: mentor.memberId,
        mentorName: mentor.displayName,
        reason: reason || null,
      }),
      method: 'POST',
    });
  }

  updateTask(caseId: string, taskId: string, status: LifecycleTask['status']) {
    return this.#json<LifecycleTask>(`/cases/${caseId}/tasks/${taskId}`, {
      body: JSON.stringify({ status }),
      method: 'PATCH',
    });
  }

  createCheckin(caseId: string, values: Record<string, unknown>) {
    return this.#json<Checkin>(`/cases/${caseId}/checkins`, {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  updateAction(caseId: string, actionId: string, status: ActionItem['status']) {
    return this.#json<ActionItem>(`/cases/${caseId}/actions/${actionId}`, {
      body: JSON.stringify({ status }),
      method: 'PATCH',
    });
  }

  createAssessment(caseId: string, values: Record<string, unknown>) {
    return this.#json<AssessmentRound>(`/cases/${caseId}/assessments`, {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  submitAssessment(caseId: string, roundId: string, values: Record<string, unknown>) {
    return this.#json<AssessmentSubmission>(`/cases/${caseId}/assessments/${roundId}/submissions`, {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  decideAssessment(caseId: string, roundId: string, values: Record<string, unknown>) {
    return this.#json<AssessmentRound>(`/cases/${caseId}/assessments/${roundId}/decision`, {
      body: JSON.stringify(values),
      method: 'POST',
    });
  }

  resolveRisk(caseId: string, riskId: string, values: Record<string, unknown>) {
    return this.#json(`/cases/${caseId}/risks/${riskId}`, {
      body: JSON.stringify(values),
      method: 'PATCH',
    });
  }

  async #json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as {
        detail?: string;
        errorCode?: string;
      } | null;
      throw new Error(problem?.detail || `生命周期接口请求失败（${response.status}）`);
    }
    return response.json() as Promise<T>;
  }
}
