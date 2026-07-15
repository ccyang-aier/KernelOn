'use client';

import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from 'react';

import { AppFrame, type AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleApi } from './api';
import type {
  ActionItem,
  AssessmentRound,
  LifecycleCaseDetail,
  LifecycleCaseSummary,
  LifecycleContext,
  LifecycleDashboard,
  LifecycleTask,
  LifecycleTemplate,
  LifecycleView,
  MentorProfile,
  RiskLevel,
} from './types';
import { useKernelOnRuntimeConfig } from '../../runtime-config';

const navigation = [
  { Icon: LayoutDashboard, id: 'dashboard', label: '负责人工作台' },
  { Icon: UserRoundCheck, id: 'operations', label: '新员工运作' },
  { Icon: Handshake, id: 'mentor', label: '导师管理' },
  { Icon: GraduationCap, id: 'growth', label: '成长档案' },
  { Icon: ClipboardCheck, id: 'assessment', label: '考核评估' },
] satisfies Array<{ Icon: typeof LayoutDashboard; id: LifecycleView; label: string }>;

const statusLabels: Record<string, string> = {
  active: '培养中',
  cancelled: '已取消',
  completed: '已转正',
  draft: '待启动',
  suspended: '已暂停',
  terminated: '已终止',
};

const riskLabels: Record<RiskLevel, string> = {
  attention: '需关注',
  high: '高风险',
  normal: '正常',
};

const taskStatusLabels: Record<LifecycleTask['status'], string> = {
  cancelled: '已取消',
  completed: '已完成',
  in_progress: '进行中',
  not_started: '未开始',
  pending_review: '待验收',
};

const assessmentKindLabels: Record<AssessmentRound['kind'], string> = {
  extension: '延期复评',
  midterm: '中期评估',
  probation: '转正评估',
};

const metricToneClasses = {
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
} as const;

export function LifecycleWorkspace({
  initialView,
  windowProps,
}: Readonly<{ initialView: LifecycleView; windowProps: AppWindowSurfaceProps }>) {
  void windowProps;
  const runtime = useKernelOnRuntimeConfig();
  const api = useMemo(() => new LifecycleApi(runtime), [runtime]);
  const [activeView, setActiveView] = useState(initialView);
  const [context, setContext] = useState<LifecycleContext | null>(null);
  const [dashboard, setDashboard] = useState<LifecycleDashboard | null>(null);
  const [cases, setCases] = useState<LifecycleCaseSummary[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [templates, setTemplates] = useState<LifecycleTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LifecycleCaseDetail | null>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextContext, nextDashboard, nextCases, nextMentors, nextTemplates] = await Promise.all(
        [api.context(), api.dashboard(), api.cases(deferredQuery), api.mentors(), api.templates()],
      );
      setContext(nextContext);
      setDashboard(nextDashboard);
      setCases(nextCases);
      setMentors(nextMentors);
      setTemplates(nextTemplates);
      setSelectedId((current) =>
        current && nextCases.some((item) => item.id === current)
          ? current
          : (nextCases[0]?.id ?? null),
      );
    } catch (loadError) {
      setError(toMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [api, deferredQuery]);

  const refreshDetail = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    try {
      setDetail(await api.caseDetail(selectedId));
    } catch (loadError) {
      setError(toMessage(loadError));
    }
  }, [api, selectedId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refreshOverview(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshOverview]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refreshDetail(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshDetail]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setSaving(true);
      setError('');
      try {
        await operation();
        await Promise.all([refreshOverview(), refreshDetail()]);
      } catch (mutationError) {
        setError(toMessage(mutationError));
      } finally {
        setSaving(false);
      }
    },
    [refreshDetail, refreshOverview],
  );

  const canManageOnboarding = context?.permissions.includes('onboarding.manage') ?? false;
  const canManageAssessment = context?.permissions.includes('assessment.manage') ?? false;
  const canManageMentors = context?.permissions.includes('mentorship.manage') ?? false;

  return (
    <AppFrame className="bg-[#eef5fb]" contentClassName="!bg-[#eef5fb]" scroll="hidden">
      <div
        className="grid h-full min-h-0 grid-cols-[236px_minmax(0,1fr)] overflow-hidden bg-[radial-gradient(circle_at_76%_8%,rgba(124,183,255,0.24),transparent_32%),linear-gradient(135deg,#f7fbff,#eaf3fb_52%,#e4eef8)] text-[#17243a]"
        data-testid="lifecycle-workspace"
      >
        <aside className="flex min-h-0 flex-col border-r border-white/70 bg-white/48 p-4 shadow-[inset_-1px_0_0_rgba(116,145,178,0.08)] backdrop-blur-2xl">
          <div className="mb-5 flex items-center gap-3 px-2 py-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,#5f9fff,#3a72e8)] text-white shadow-[0_10px_24px_rgba(50,103,207,0.3)]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-[17px] font-bold tracking-[-0.02em]">KernelOn</p>
              <p className="text-xs text-[#71819a]">新员工生命周期</p>
            </div>
          </div>
          <nav aria-label="生命周期管理导航" className="space-y-1.5">
            {navigation.map(({ Icon, id, label }) => {
              const active = activeView === id;
              return (
                <button
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-white text-[#2868d7] shadow-[0_8px_24px_rgba(54,90,130,0.11)]'
                      : 'text-[#68778c] hover:bg-white/56 hover:text-[#273c57]'
                  }`}
                  key={id}
                  onClick={() => setActiveView(id)}
                  type="button"
                >
                  <Icon className="size-[18px]" />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/80 bg-white/46 p-3 text-xs leading-5 text-[#74839a]">
            <p className="font-semibold text-[#41536d]">当前视图</p>
            <p>{context?.roleKeys.join(' · ') || '正在识别权限…'}</p>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden">
          <header className="flex min-h-[78px] items-center justify-between border-b border-white/70 px-7">
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.025em]">
                {navigation.find((item) => item.id === activeView)?.label}
              </h1>
              <p className="mt-1 text-xs text-[#728299]">
                把计划、沟通、行动与转正结论放在同一条成长时间线上
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="刷新数据"
                className="grid size-10 place-items-center rounded-xl border border-white/80 bg-white/58 text-[#57708f] transition hover:bg-white"
                onClick={() => void refreshOverview()}
                type="button"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {canManageOnboarding ? (
                <button
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#2869dc] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(40,105,220,0.25)] transition hover:bg-[#1f5fcf]"
                  onClick={() => setShowCreate(true)}
                  type="button"
                >
                  <Plus className="size-4" /> 新建培养档案
                </button>
              ) : null}
            </div>
          </header>

          {error ? (
            <div className="mx-7 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="size-4 shrink-0" /> {error}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto p-7">
            {loading && !dashboard ? (
              <LoadingState />
            ) : activeView === 'dashboard' ? (
              <DashboardView
                dashboard={dashboard}
                onSelect={(id) => {
                  setSelectedId(id);
                  setActiveView('operations');
                }}
              />
            ) : activeView === 'mentor' ? (
              <MentorView
                canManage={canManageMentors}
                cases={cases}
                mentors={mentors}
                onOpenCase={(id) => {
                  setSelectedId(id);
                  setActiveView('growth');
                }}
                onSave={(values) => mutate(() => api.upsertMentor(values))}
                saving={saving}
              />
            ) : (
              <CaseWorkspace
                activeView={activeView}
                canManageAssessment={canManageAssessment}
                canManageMentors={canManageMentors}
                canManageOnboarding={canManageOnboarding}
                cases={cases}
                context={context}
                detail={detail}
                mentors={mentors}
                onAssignMentor={(mentor) =>
                  detail ? mutate(() => api.assignMentor(detail.id, mentor)) : Promise.resolve()
                }
                onCreateAssessment={(values) =>
                  detail ? mutate(() => api.createAssessment(detail.id, values)) : Promise.resolve()
                }
                onCreateCheckin={(values) =>
                  detail
                    ? mutate(async () => {
                        await api.createCheckin(detail.id, values);
                        setShowCheckin(false);
                      })
                    : Promise.resolve()
                }
                onDecideAssessment={(roundId, values) =>
                  detail
                    ? mutate(() => api.decideAssessment(detail.id, roundId, values))
                    : Promise.resolve()
                }
                onSelect={setSelectedId}
                onResolveRisk={(riskId) =>
                  detail
                    ? mutate(() =>
                        api.resolveRisk(detail.id, riskId, {
                          resolution: '负责人已确认并完成处理。',
                          status: 'closed',
                        }),
                      )
                    : Promise.resolve()
                }
                onSubmitAssessment={(roundId, values) =>
                  detail
                    ? mutate(() => api.submitAssessment(detail.id, roundId, values))
                    : Promise.resolve()
                }
                onTransition={(target) =>
                  detail ? mutate(() => api.transitionCase(detail.id, target)) : Promise.resolve()
                }
                onUpdateAction={(actionId, status) =>
                  detail
                    ? mutate(() => api.updateAction(detail.id, actionId, status))
                    : Promise.resolve()
                }
                onUpdateTask={(taskId, status) =>
                  detail
                    ? mutate(() => api.updateTask(detail.id, taskId, status))
                    : Promise.resolve()
                }
                query={query}
                saving={saving}
                selectedId={selectedId}
                setQuery={setQuery}
                showCheckin={showCheckin}
                toggleCheckin={() => setShowCheckin((current) => !current)}
              />
            )}
          </div>
        </main>
      </div>

      {showCreate ? (
        <Modal title="新建培养档案" onClose={() => setShowCreate(false)}>
          <CreateCaseForm
            onSubmit={(values) =>
              mutate(async () => {
                const created = await api.createCase(values);
                setSelectedId(created.id);
                setShowCreate(false);
                setActiveView('operations');
              })
            }
            saving={saving}
            templates={templates}
          />
        </Modal>
      ) : null}
    </AppFrame>
  );
}

function DashboardView({
  dashboard,
  onSelect,
}: Readonly<{
  dashboard: LifecycleDashboard | null;
  onSelect(id: string): void;
}>) {
  if (!dashboard) return <EmptyState title="暂无可展示的运营数据" />;
  const metrics = [
    { Icon: UsersRound, label: '在管新人', tone: 'blue', value: dashboard.activeCount },
    { Icon: CalendarClock, label: '30 天内转正', tone: 'violet', value: dashboard.dueSoonCount },
    { Icon: AlertTriangle, label: '逾期任务', tone: 'amber', value: dashboard.overdueTaskCount },
    { Icon: ShieldAlert, label: '未关闭风险', tone: 'red', value: dashboard.openRiskCount },
  ] as const;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ Icon, label, tone, value }) => (
          <section
            className="rounded-[22px] border border-white/85 bg-white/66 p-5 shadow-[0_12px_36px_rgba(54,79,109,0.08)]"
            key={label}
          >
            <div
              className={`mb-5 grid size-10 place-items-center rounded-xl ${metricToneClasses[tone]}`}
            >
              <Icon className="size-5" />
            </div>
            <p className="text-3xl font-bold tracking-[-0.04em]">{value}</p>
            <p className="mt-1 text-sm text-[#73839a]">{label}</p>
          </section>
        ))}
      </div>
      <section className="rounded-[24px] border border-white/85 bg-white/66 p-5 shadow-[0_12px_36px_rgba(54,79,109,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold">优先关注</h2>
            <p className="mt-1 text-xs text-[#7d8ba0]">综合风险等级与试用期截止时间排序</p>
          </div>
          <BarChart3 className="size-5 text-[#5b7aa5]" />
        </div>
        <div className="space-y-2">
          {dashboard.priorityCases.length ? (
            dashboard.priorityCases.map((item) => (
              <CaseRow item={item} key={item.id} onSelect={onSelect} />
            ))
          ) : (
            <EmptyState title="当前没有在管新员工" />
          )}
        </div>
      </section>
    </div>
  );
}

function CaseWorkspace({
  activeView,
  canManageAssessment,
  canManageMentors,
  canManageOnboarding,
  cases,
  context,
  detail,
  mentors,
  onAssignMentor,
  onCreateAssessment,
  onCreateCheckin,
  onDecideAssessment,
  onResolveRisk,
  onSelect,
  onSubmitAssessment,
  onTransition,
  onUpdateAction,
  onUpdateTask,
  query,
  saving,
  selectedId,
  setQuery,
  showCheckin,
  toggleCheckin,
}: Readonly<{
  activeView: LifecycleView;
  canManageAssessment: boolean;
  canManageMentors: boolean;
  canManageOnboarding: boolean;
  cases: LifecycleCaseSummary[];
  context: LifecycleContext | null;
  detail: LifecycleCaseDetail | null;
  mentors: MentorProfile[];
  onAssignMentor(mentor: MentorProfile): Promise<void>;
  onCreateAssessment(values: Record<string, unknown>): Promise<void>;
  onCreateCheckin(values: Record<string, unknown>): Promise<void>;
  onDecideAssessment(roundId: string, values: Record<string, unknown>): Promise<void>;
  onResolveRisk(riskId: string): Promise<void>;
  onSelect(id: string): void;
  onSubmitAssessment(roundId: string, values: Record<string, unknown>): Promise<void>;
  onTransition(target: string): Promise<void>;
  onUpdateAction(actionId: string, status: ActionItem['status']): Promise<void>;
  onUpdateTask(taskId: string, status: LifecycleTask['status']): Promise<void>;
  query: string;
  saving: boolean;
  selectedId: string | null;
  setQuery(value: string): void;
  showCheckin: boolean;
  toggleCheckin(): void;
}>) {
  return (
    <div className="grid min-h-full grid-cols-[minmax(300px,0.74fr)_minmax(520px,1.35fr)] gap-5">
      <section className="min-h-[560px] rounded-[24px] border border-white/85 bg-white/62 p-4 shadow-[0_12px_36px_rgba(54,79,109,0.08)]">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-[#dce7f2] bg-white/80 px-3 text-sm text-[#708197]">
          <Search className="size-4" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[#27384f] outline-none placeholder:text-[#98a6b7]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、工号或岗位"
            value={query}
          />
        </label>
        <div className="mt-4 space-y-2">
          {cases.length ? (
            cases.map((item) => (
              <CaseRow
                active={selectedId === item.id}
                item={item}
                key={item.id}
                onSelect={onSelect}
              />
            ))
          ) : (
            <EmptyState title="没有匹配的新员工" />
          )}
        </div>
      </section>
      <section className="min-h-[560px] rounded-[24px] border border-white/85 bg-white/70 p-5 shadow-[0_12px_36px_rgba(54,79,109,0.08)]">
        {detail ? (
          <CaseDetail
            activeView={activeView}
            canManageAssessment={canManageAssessment}
            canManageMentors={canManageMentors}
            canManageOnboarding={canManageOnboarding}
            context={context}
            detail={detail}
            mentors={mentors}
            onAssignMentor={onAssignMentor}
            onCreateAssessment={onCreateAssessment}
            onCreateCheckin={onCreateCheckin}
            onDecideAssessment={onDecideAssessment}
            onSubmitAssessment={onSubmitAssessment}
            onTransition={onTransition}
            onResolveRisk={onResolveRisk}
            onUpdateAction={onUpdateAction}
            onUpdateTask={onUpdateTask}
            saving={saving}
            showCheckin={showCheckin}
            toggleCheckin={toggleCheckin}
          />
        ) : (
          <EmptyState title="选择一名新员工查看完整培养档案" />
        )}
      </section>
    </div>
  );
}

function CaseRow({
  active = false,
  item,
  onSelect,
}: Readonly<{
  active?: boolean;
  item: LifecycleCaseSummary;
  onSelect(id: string): void;
}>) {
  return (
    <button
      className={`w-full rounded-2xl border p-3.5 text-left transition ${
        active
          ? 'border-[#afcfff] bg-[#edf5ff] shadow-[0_8px_20px_rgba(62,109,170,0.09)]'
          : 'border-transparent bg-white/45 hover:border-white hover:bg-white/88'
      }`}
      onClick={() => onSelect(item.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#dcecff,#bcd6fa)] font-bold text-[#3569a6]">
            {item.employeeName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.employeeName}</p>
            <p className="mt-0.5 truncate text-xs text-[#7a899d]">
              {item.employeeNo} · {item.jobTitle}
            </p>
          </div>
        </div>
        <RiskBadge level={item.riskLevel} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#7b899d]">
        <span>{statusLabels[item.status]}</span>
        <span>{item.taskProgress.percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#dfe8f2]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#4a8df5,#6fc4f4)]"
          style={{ width: `${item.taskProgress.percent}%` }}
        />
      </div>
    </button>
  );
}

function CaseDetail({
  activeView,
  canManageAssessment,
  canManageMentors,
  canManageOnboarding,
  context,
  detail,
  mentors,
  onAssignMentor,
  onCreateAssessment,
  onCreateCheckin,
  onDecideAssessment,
  onSubmitAssessment,
  onTransition,
  onResolveRisk,
  onUpdateAction,
  onUpdateTask,
  saving,
  showCheckin,
  toggleCheckin,
}: Readonly<{
  activeView: LifecycleView;
  canManageAssessment: boolean;
  canManageMentors: boolean;
  canManageOnboarding: boolean;
  context: LifecycleContext | null;
  detail: LifecycleCaseDetail;
  mentors: MentorProfile[];
  onAssignMentor(mentor: MentorProfile): Promise<void>;
  onCreateAssessment(values: Record<string, unknown>): Promise<void>;
  onCreateCheckin(values: Record<string, unknown>): Promise<void>;
  onDecideAssessment(roundId: string, values: Record<string, unknown>): Promise<void>;
  onSubmitAssessment(roundId: string, values: Record<string, unknown>): Promise<void>;
  onTransition(target: string): Promise<void>;
  onResolveRisk(riskId: string): Promise<void>;
  onUpdateAction(actionId: string, status: ActionItem['status']): Promise<void>;
  onUpdateTask(taskId: string, status: LifecycleTask['status']): Promise<void>;
  saving: boolean;
  showCheckin: boolean;
  toggleCheckin(): void;
}>) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-[-0.025em]">{detail.employeeName}</h2>
            <StatusBadge status={detail.status} />
            <RiskBadge level={detail.riskLevel} />
          </div>
          <p className="mt-1 text-sm text-[#708097]">
            {detail.employeeNo} · {detail.department || '未设置团队'} · {detail.jobTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageOnboarding && detail.status === 'draft' ? (
            <PrimaryButton disabled={saving} onClick={() => void onTransition('active')}>
              启动培养
            </PrimaryButton>
          ) : null}
          {canManageOnboarding && detail.status === 'active' ? (
            <SecondaryButton disabled={saving} onClick={() => void onTransition('suspended')}>
              暂停
            </SecondaryButton>
          ) : null}
          {canManageOnboarding && detail.status === 'suspended' ? (
            <PrimaryButton disabled={saving} onClick={() => void onTransition('active')}>
              恢复
            </PrimaryButton>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <InfoCard label="入职日期" value={formatDate(detail.joinedOn)} />
        <InfoCard label="试用期截止" value={formatDate(detail.probationEndOn)} />
        <InfoCard label="当前导师" value={detail.mentor?.mentorName || '待分配'} />
        <InfoCard
          label="培养进度"
          value={`${detail.taskProgress.completed}/${detail.taskProgress.total}`}
        />
      </div>

      {detail.risks.some((risk) => risk.status === 'open' || risk.status === 'in_progress') ? (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/68 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-900">
            <ShieldAlert className="size-4" />
            <h3 className="font-bold">当前风险</h3>
          </div>
          <div className="space-y-2">
            {detail.risks
              .filter((risk) => risk.status === 'open' || risk.status === 'in_progress')
              .map((risk) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/64 p-3"
                  key={risk.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#5f4920]">{risk.summary}</p>
                    <p className="mt-1 text-xs text-[#8a754e]">
                      {risk.evidence || '等待负责人处理'}
                    </p>
                  </div>
                  {canManageOnboarding ? (
                    <SecondaryButton disabled={saving} onClick={() => void onResolveRisk(risk.id)}>
                      标记已处理
                    </SecondaryButton>
                  ) : null}
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {activeView === 'assessment' ? (
        <AssessmentPanel
          canManage={canManageAssessment}
          context={context}
          detail={detail}
          onCreate={onCreateAssessment}
          onDecide={onDecideAssessment}
          onSubmit={onSubmitAssessment}
          saving={saving}
        />
      ) : activeView === 'growth' ? (
        <GrowthPanel detail={detail} onUpdateAction={onUpdateAction} saving={saving} />
      ) : (
        <>
          {canManageMentors ? (
            <MentorAssignmentPanel
              current={detail.mentor}
              mentors={mentors}
              onAssign={onAssignMentor}
              saving={saving}
            />
          ) : null}
          <TaskPanel detail={detail} onUpdate={onUpdateTask} saving={saving} />
          <section className="rounded-2xl border border-[#e4edf6] bg-white/65 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold">沟通与行动</h3>
                <p className="mt-1 text-xs text-[#7d8ca0]">
                  记录共识，并让行动项在下次沟通中持续出现
                </p>
              </div>
              <SecondaryButton disabled={saving} onClick={toggleCheckin}>
                <MessageSquareText className="size-4" /> 新增沟通
              </SecondaryButton>
            </div>
            {showCheckin ? <CheckinForm onSubmit={onCreateCheckin} saving={saving} /> : null}
            <GrowthPanel compact detail={detail} onUpdateAction={onUpdateAction} saving={saving} />
          </section>
        </>
      )}
    </div>
  );
}

function TaskPanel({
  detail,
  onUpdate,
  saving,
}: Readonly<{
  detail: LifecycleCaseDetail;
  onUpdate(taskId: string, status: LifecycleTask['status']): Promise<void>;
  saving: boolean;
}>) {
  return (
    <section className="rounded-2xl border border-[#e4edf6] bg-white/65 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold">培养计划</h3>
          <p className="mt-1 text-xs text-[#7d8ca0]">按模板生成，可独立推进和验收</p>
        </div>
        <span className="text-xs font-semibold text-[#4a73a8]">{detail.taskProgress.percent}%</span>
      </div>
      <div className="space-y-2">
        {detail.tasks.length ? (
          detail.tasks.map((task) => (
            <div className="flex items-center gap-3 rounded-xl bg-[#f6f9fc] p-3" key={task.id}>
              <CheckCircle2
                className={`size-5 shrink-0 ${task.status === 'completed' ? 'text-emerald-500' : 'text-[#a9b7c8]'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-[#7d8ca0]">
                  {task.phase} · 截止 {formatDate(task.dueOn)}
                </p>
              </div>
              <select
                aria-label={`${task.title}状态`}
                className="rounded-lg border border-[#dbe6f0] bg-white px-2 py-1.5 text-xs outline-none"
                disabled={saving}
                onChange={(event) =>
                  void onUpdate(task.id, event.target.value as LifecycleTask['status'])
                }
                value={task.status}
              >
                {Object.entries(taskStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ))
        ) : (
          <EmptyState
            title={detail.status === 'draft' ? '启动培养后生成计划任务' : '暂无培养任务'}
          />
        )}
      </div>
    </section>
  );
}

function GrowthPanel({
  compact = false,
  detail,
  onUpdateAction,
  saving,
}: Readonly<{
  compact?: boolean;
  detail: LifecycleCaseDetail;
  onUpdateAction(actionId: string, status: ActionItem['status']): Promise<void>;
  saving: boolean;
}>) {
  return (
    <div className={compact ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
      <section className={compact ? '' : 'rounded-2xl border border-[#e4edf6] bg-white/65 p-4'}>
        {!compact ? <h3 className="mb-3 font-bold">沟通时间线</h3> : null}
        <div className="space-y-3">
          {detail.checkins.length ? (
            detail.checkins.map((checkin) => (
              <article className="relative rounded-xl bg-[#f6f9fc] p-3 pl-4" key={checkin.id}>
                <div className="absolute inset-y-3 left-0 w-1 rounded-full bg-[#6ca7f5]" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{checkin.topic}</p>
                  <time className="text-[11px] text-[#8795a8]">{formatDate(checkin.heldAt)}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#596a80]">
                  {checkin.sharedNotes || checkin.employeeReflection || '已提交沟通记录'}
                </p>
                {checkin.supportNeeded ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                    需要支持：{checkin.supportNeeded}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="还没有正式沟通记录" />
          )}
        </div>
      </section>
      <section className={compact ? '' : 'rounded-2xl border border-[#e4edf6] bg-white/65 p-4'}>
        {!compact ? <h3 className="mb-3 font-bold">行动项</h3> : null}
        <div className="space-y-2">
          {detail.actions.length ? (
            detail.actions.map((action) => (
              <div className="flex items-center gap-3 rounded-xl bg-[#f6f9fc] p-3" key={action.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{action.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#7d8ca0]">
                    {action.assigneeName} · {formatDate(action.dueOn)}
                  </p>
                </div>
                <select
                  aria-label={`${action.title}状态`}
                  className="rounded-lg border border-[#dbe6f0] bg-white px-2 py-1.5 text-xs outline-none"
                  disabled={saving}
                  onChange={(event) =>
                    void onUpdateAction(action.id, event.target.value as ActionItem['status'])
                  }
                  value={action.status}
                >
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            ))
          ) : (
            <EmptyState title="暂无行动项" />
          )}
        </div>
      </section>
      {!compact ? (
        <section className="col-span-2 rounded-2xl border border-[#e4edf6] bg-white/65 p-4">
          <h3 className="mb-3 font-bold">关键变更记录</h3>
          <div className="grid grid-cols-2 gap-2">
            {detail.auditTrail.slice(0, 8).map((event) => (
              <div
                className="flex items-center justify-between rounded-xl bg-[#f6f9fc] px-3 py-2"
                key={event.id}
              >
                <span className="text-xs font-semibold text-[#52667f]">
                  {auditEventLabel(event.eventType)}
                </span>
                <time className="text-[11px] text-[#8a98aa]">{formatDate(event.createdAt)}</time>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AssessmentPanel({
  canManage,
  context,
  detail,
  onCreate,
  onDecide,
  onSubmit,
  saving,
}: Readonly<{
  canManage: boolean;
  context: LifecycleContext | null;
  detail: LifecycleCaseDetail;
  onCreate(values: Record<string, unknown>): Promise<void>;
  onDecide(roundId: string, values: Record<string, unknown>): Promise<void>;
  onSubmit(roundId: string, values: Record<string, unknown>): Promise<void>;
  saving: boolean;
}>) {
  return (
    <div className="space-y-4">
      {canManage ? <AssessmentCreateForm onSubmit={onCreate} saving={saving} /> : null}
      {detail.assessments.length ? (
        detail.assessments.map((round) => (
          <section className="rounded-2xl border border-[#e4edf6] bg-white/65 p-4" key={round.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">{assessmentKindLabels[round.kind]}</h3>
                <p className="mt-1 text-xs text-[#7d8ca0]">
                  截止 {formatDate(round.deadlineOn)} · {round.status}
                </p>
              </div>
              {round.decision ? (
                <span className="rounded-full bg-[#e8f5ec] px-3 py-1 text-xs font-semibold text-[#28734a]">
                  {round.decision === 'passed'
                    ? '通过'
                    : round.decision === 'extended'
                      ? '延期'
                      : '未通过'}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {round.requiredRoles.map((role) => {
                const submitted = round.submissions.some((item) => item.role === role);
                return (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${submitted ? 'bg-emerald-50 text-emerald-700' : 'bg-[#edf1f6] text-[#6d7d92]'}`}
                    key={role}
                  >
                    {role} · {submitted ? '已提交' : '待提交'}
                  </span>
                );
              })}
            </div>
            {!round.decision && round.requiredRoles.length ? (
              <AssessmentSubmitForm
                defaultRole={roleForContext(context, detail)}
                onSubmit={(values) => onSubmit(round.id, values)}
                requiredRoles={round.requiredRoles}
                saving={saving}
              />
            ) : null}
            {canManage && round.status === 'decision_pending' ? (
              <DecisionForm onSubmit={(values) => onDecide(round.id, values)} saving={saving} />
            ) : null}
            {round.decisionNotes ? (
              <p className="mt-3 rounded-xl bg-[#f5f8fb] p-3 text-sm leading-6 text-[#52647b]">
                {round.decisionNotes}
              </p>
            ) : null}
          </section>
        ))
      ) : (
        <EmptyState title="尚未发起评估轮次" />
      )}
    </div>
  );
}

function MentorView({
  canManage,
  cases,
  mentors,
  onOpenCase,
  onSave,
  saving,
}: Readonly<{
  canManage: boolean;
  cases: LifecycleCaseSummary[];
  mentors: MentorProfile[];
  onOpenCase(id: string): void;
  onSave(values: Record<string, unknown>): Promise<void>;
  saving: boolean;
}>) {
  const activeCases = cases.filter(
    (item) => item.status === 'active' || item.status === 'suspended',
  );
  return (
    <div className="space-y-5">
      {canManage ? <MentorForm onSubmit={onSave} saving={saving} /> : null}
      <section className="rounded-[22px] border border-white/85 bg-white/66 p-4 shadow-[0_12px_36px_rgba(54,79,109,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">当前带教对象</h2>
            <p className="mt-1 text-xs text-[#7c8a9d]">点击进入成长档案，继续沟通与行动跟踪</p>
          </div>
          <UsersRound className="size-5 text-[#6380a5]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activeCases.length ? (
            activeCases.map((item) => <CaseRow item={item} key={item.id} onSelect={onOpenCase} />)
          ) : (
            <div className="col-span-2">
              <EmptyState title="当前没有有效带教对象" />
            </div>
          )}
        </div>
      </section>
      <div className="grid grid-cols-3 gap-4">
        {mentors.length ? (
          mentors.map((mentor) => (
            <article
              className="rounded-[22px] border border-white/85 bg-white/66 p-5 shadow-[0_12px_36px_rgba(54,79,109,0.08)]"
              key={mentor.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[#e8f1ff] font-bold text-[#356fbd]">
                  {mentor.displayName.slice(0, 1)}
                </div>
                <span className="rounded-full bg-[#eef4fa] px-2.5 py-1 text-[11px] text-[#5f7188]">
                  {mentor.status === 'available'
                    ? '可带教'
                    : mentor.status === 'busy'
                      ? '忙碌'
                      : '不可用'}
                </span>
              </div>
              <h3 className="mt-4 font-bold">{mentor.displayName}</h3>
              <p className="mt-1 text-xs text-[#7c8a9d]">{mentor.jobTitle || '导师'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {mentor.skills.map((skill) => (
                  <span
                    className="rounded-lg bg-[#edf4fb] px-2 py-1 text-[11px] text-[#58718f]"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="text-[#7a899d]">当前负载</span>
                <span
                  className={
                    mentor.currentLoad >= mentor.capacity
                      ? 'font-bold text-amber-600'
                      : 'font-bold text-[#326ec2]'
                  }
                >
                  {mentor.currentLoad} / {mentor.capacity}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-3">
            <EmptyState title="导师库尚未建立" />
          </div>
        )}
      </div>
    </div>
  );
}

function CreateCaseForm({
  onSubmit,
  saving,
  templates,
}: Readonly<{
  onSubmit(values: Record<string, unknown>): Promise<void>;
  saving: boolean;
  templates: LifecycleTemplate[];
}>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSubmit({
      batchName: optional(data, 'batchName'),
      department: optional(data, 'department'),
      employeeName: required(data, 'employeeName'),
      employeeNo: required(data, 'employeeNo'),
      jobTitle: required(data, 'jobTitle'),
      joinedOn: required(data, 'joinedOn'),
      probationEndOn: required(data, 'probationEndOn'),
      templateId: optional(data, 'templateId'),
    });
  };
  return (
    <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
      <Field label="姓名">
        <input name="employeeName" required />
      </Field>
      <Field label="工号">
        <input name="employeeNo" required />
      </Field>
      <Field label="岗位">
        <input name="jobTitle" required />
      </Field>
      <Field label="团队">
        <input name="department" />
      </Field>
      <Field label="入职日期">
        <input name="joinedOn" required type="date" />
      </Field>
      <Field label="试用期截止">
        <input name="probationEndOn" required type="date" />
      </Field>
      <Field label="培养批次">
        <input name="batchName" />
      </Field>
      <Field label="培养模板">
        <select name="templateId">
          <option value="">使用系统默认模板</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} v{template.version}
            </option>
          ))}
        </select>
      </Field>
      <div className="col-span-2 flex justify-end">
        <PrimaryButton disabled={saving} type="submit">
          {saving ? '正在创建…' : '创建档案'}
        </PrimaryButton>
      </div>
    </form>
  );
}

function MentorForm({
  onSubmit,
  saving,
}: Readonly<{ onSubmit(values: Record<string, unknown>): Promise<void>; saving: boolean }>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSubmit({
      capacity: Number(required(data, 'capacity')),
      displayName: required(data, 'displayName'),
      jobTitle: optional(data, 'jobTitle'),
      memberId: optional(data, 'memberId'),
      skills: required(data, 'skills')
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean),
      status: required(data, 'status'),
    });
  };
  return (
    <form
      className="grid grid-cols-[1fr_1fr_1.5fr_110px_120px_auto] items-end gap-3 rounded-[22px] border border-white/85 bg-white/66 p-4"
      onSubmit={handleSubmit}
    >
      <Field label="导师姓名">
        <input name="displayName" required />
      </Field>
      <Field label="成员 ID（本人可留空）">
        <input name="memberId" />
      </Field>
      <Field label="技能标签">
        <input name="skills" placeholder="React, 业务设计" required />
      </Field>
      <Field label="容量">
        <input defaultValue="3" min="1" name="capacity" required type="number" />
      </Field>
      <Field label="状态">
        <select name="status">
          <option value="available">可带教</option>
          <option value="busy">忙碌</option>
          <option value="unavailable">不可用</option>
        </select>
      </Field>
      <PrimaryButton disabled={saving} type="submit">
        保存导师
      </PrimaryButton>
    </form>
  );
}

function MentorAssignmentPanel({
  current,
  mentors,
  onAssign,
  saving,
}: Readonly<{
  current: LifecycleCaseDetail['mentor'];
  mentors: MentorProfile[];
  onAssign(mentor: MentorProfile): Promise<void>;
  saving: boolean;
}>) {
  return (
    <section className="flex items-center justify-between rounded-2xl border border-[#e4edf6] bg-white/65 p-4">
      <div>
        <h3 className="font-bold">导师分配</h3>
        <p className="mt-1 text-xs text-[#7d8ca0]">当前：{current?.mentorName || '尚未分配'}</p>
      </div>
      <select
        className="rounded-xl border border-[#dbe6f0] bg-white px-3 py-2 text-sm outline-none"
        defaultValue=""
        disabled={saving}
        onChange={(event) => {
          const mentor = mentors.find((item) => item.id === event.target.value);
          if (mentor) void onAssign(mentor);
        }}
      >
        <option value="">选择导师…</option>
        {mentors.map((mentor) => (
          <option key={mentor.id} value={mentor.id}>
            {mentor.displayName}（{mentor.currentLoad}/{mentor.capacity}）
          </option>
        ))}
      </select>
    </section>
  );
}

function CheckinForm({
  onSubmit,
  saving,
}: Readonly<{ onSubmit(values: Record<string, unknown>): Promise<void>; saving: boolean }>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const actionTitle = optional(data, 'actionTitle');
    void onSubmit({
      actions: actionTitle ? [{ dueOn: required(data, 'actionDueOn'), title: actionTitle }] : [],
      heldAt: new Date(required(data, 'heldAt')).toISOString(),
      mentorNotes: optional(data, 'mentorNotes'),
      nextCheckinOn: optional(data, 'nextCheckinOn'),
      sharedNotes: optional(data, 'sharedNotes'),
      supportNeeded: optional(data, 'supportNeeded'),
      topic: required(data, 'topic'),
    });
  };
  return (
    <form
      className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f3f7fb] p-3"
      onSubmit={handleSubmit}
    >
      <Field label="主题">
        <input name="topic" required />
      </Field>
      <Field label="沟通时间">
        <input name="heldAt" required type="datetime-local" />
      </Field>
      <Field className="col-span-2" label="共享纪要">
        <textarea name="sharedNotes" required rows={3} />
      </Field>
      <Field label="需要支持">
        <input name="supportNeeded" />
      </Field>
      <Field label="下次沟通">
        <input name="nextCheckinOn" type="date" />
      </Field>
      <Field label="行动项">
        <input name="actionTitle" />
      </Field>
      <Field label="行动项截止">
        <input name="actionDueOn" type="date" />
      </Field>
      <Field className="col-span-2" label="导师管理意见（新人不可见）">
        <textarea name="mentorNotes" rows={2} />
      </Field>
      <div className="col-span-2 flex justify-end">
        <PrimaryButton disabled={saving} type="submit">
          提交沟通记录
        </PrimaryButton>
      </div>
    </form>
  );
}

function AssessmentCreateForm({
  onSubmit,
  saving,
}: Readonly<{ onSubmit(values: Record<string, unknown>): Promise<void>; saving: boolean }>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSubmit({
      deadlineOn: required(data, 'deadlineOn'),
      kind: required(data, 'kind'),
      plannedOn: required(data, 'plannedOn'),
      requiredRoles: ['newcomer', 'mentor', 'manager'],
    });
  };
  return (
    <form
      className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 rounded-2xl border border-[#dce8f4] bg-white/70 p-4"
      onSubmit={handleSubmit}
    >
      <Field label="评估类型">
        <select name="kind">
          <option value="midterm">中期评估</option>
          <option value="probation">转正评估</option>
          <option value="extension">延期复评</option>
        </select>
      </Field>
      <Field label="计划日期">
        <input name="plannedOn" required type="date" />
      </Field>
      <Field label="提交截止">
        <input name="deadlineOn" required type="date" />
      </Field>
      <PrimaryButton disabled={saving} type="submit">
        发起评估
      </PrimaryButton>
    </form>
  );
}

function AssessmentSubmitForm({
  defaultRole,
  onSubmit,
  requiredRoles,
  saving,
}: Readonly<{
  defaultRole: string;
  onSubmit(values: Record<string, unknown>): Promise<void>;
  requiredRoles: string[];
  saving: boolean;
}>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSubmit({
      content: { summary: required(data, 'summary') },
      role: required(data, 'role'),
      score: Number(required(data, 'score')),
    });
  };
  return (
    <form
      className="mt-4 grid grid-cols-[130px_1fr_90px_auto] items-end gap-2 rounded-xl bg-[#f5f8fb] p-3"
      onSubmit={handleSubmit}
    >
      <Field label="评价身份">
        <select defaultValue={defaultRole} name="role">
          {requiredRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>
      <Field label="评价摘要">
        <input name="summary" required />
      </Field>
      <Field label="评分">
        <input defaultValue="80" max="100" min="0" name="score" required type="number" />
      </Field>
      <SecondaryButton disabled={saving} type="submit">
        提交评价
      </SecondaryButton>
    </form>
  );
}

function DecisionForm({
  onSubmit,
  saving,
}: Readonly<{ onSubmit(values: Record<string, unknown>): Promise<void>; saving: boolean }>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSubmit({
      decision: required(data, 'decision'),
      decisionNotes: required(data, 'decisionNotes'),
      extensionEndOn: optional(data, 'extensionEndOn'),
    });
  };
  return (
    <form
      className="mt-3 grid grid-cols-[120px_1fr_150px_auto] items-end gap-2 rounded-xl border border-[#dce8f4] p-3"
      onSubmit={handleSubmit}
    >
      <Field label="正式结论">
        <select name="decision">
          <option value="passed">通过</option>
          <option value="extended">延期</option>
          <option value="failed">不通过</option>
        </select>
      </Field>
      <Field label="决定说明">
        <input name="decisionNotes" required />
      </Field>
      <Field label="延期截止">
        <input name="extensionEndOn" type="date" />
      </Field>
      <PrimaryButton disabled={saving} type="submit">
        发布结论
      </PrimaryButton>
    </form>
  );
}

function Modal({
  children,
  onClose,
  title,
}: Readonly<{ children: ReactNode; onClose(): void; title: string }>) {
  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-[#14243c]/30 p-6 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="w-full max-w-2xl rounded-[26px] border border-white/80 bg-[#f7fbff] p-5 shadow-[0_30px_90px_rgba(26,50,82,0.28)]"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            aria-label="关闭"
            className="rounded-lg px-3 py-1.5 text-sm text-[#6d7d91] hover:bg-[#edf3f8]"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  children,
  className = '',
  label,
}: Readonly<{ children: ReactNode; className?: string; label: string }>) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#65758b] [&_input]:h-10 [&_input]:rounded-xl [&_input]:border [&_input]:border-[#d8e4ef] [&_input]:bg-white [&_input]:px-3 [&_input]:font-normal [&_input]:text-[#27384f] [&_input]:outline-none [&_select]:h-10 [&_select]:rounded-xl [&_select]:border [&_select]:border-[#d8e4ef] [&_select]:bg-white [&_select]:px-3 [&_select]:font-normal [&_select]:text-[#27384f] [&_select]:outline-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[#d8e4ef] [&_textarea]:bg-white [&_textarea]:p-3 [&_textarea]:font-normal [&_textarea]:text-[#27384f] [&_textarea]:outline-none ${className}`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl bg-[#f3f7fb] p-3">
      <p className="text-[11px] text-[#8492a5]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function RiskBadge({ level }: Readonly<{ level: RiskLevel }>) {
  const className =
    level === 'high'
      ? 'bg-red-50 text-red-700'
      : level === 'attention'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {riskLabels[level]}
    </span>
  );
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span className="rounded-full bg-[#e9f1fb] px-2.5 py-1 text-[10px] font-bold text-[#4c6e99]">
      {statusLabels[status] || status}
    </span>
  );
}

function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#2869dc] px-3.5 text-xs font-semibold text-white transition hover:bg-[#1f5fcf] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e3ef] bg-white px-3.5 text-xs font-semibold text-[#4e6684] transition hover:bg-[#f6f9fc] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[420px] place-items-center text-[#6f8096]">
      <div className="flex items-center gap-3">
        <LoaderCircle className="size-5 animate-spin" />
        正在加载生命周期数据…
      </div>
    </div>
  );
}

function EmptyState({ title }: Readonly<{ title: string }>) {
  return (
    <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-[#d9e4ef] bg-white/36 px-4 text-center text-sm text-[#8492a5]">
      {title}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function roleForContext(context: LifecycleContext | null, detail: LifecycleCaseDetail): string {
  if (!context) return 'newcomer';
  if (context.membershipId === detail.memberId) return 'newcomer';
  if (context.membershipId === detail.managerMemberId) return 'manager';
  if (detail.mentor?.mentorMemberId === context.membershipId) return 'mentor';
  return context.roleKeys.includes('operations') ? 'hr' : 'mentor';
}

function auditEventLabel(value: string): string {
  return (
    {
      'action.updated': '行动项状态更新',
      'assessment.created': '发起评估',
      'assessment.decided': '发布评估结论',
      'assessment.submitted': '提交评估意见',
      'case.created': '创建培养档案',
      'case.transitioned': '培养状态变更',
      'checkin.submitted': '提交沟通记录',
      'mentor.assigned': '调整导师',
      'risk.updated': '处理风险',
      'task.updated': '更新培养任务',
    }[value] || value
  );
}

function required(data: FormData, name: string): string {
  return String(data.get(name) || '').trim();
}

function optional(data: FormData, name: string): string | null {
  return required(data, name) || null;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作未能完成，请稍后重试。';
}
