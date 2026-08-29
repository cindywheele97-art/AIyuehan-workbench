# AIyuehan Workbench：架构设计与开发方案 V1.2

> 文档状态：`REVISED_DRAFT / AWAITING_IMPLEMENTATION_APPROVAL`  
> 修订日期：2026-08-29  
> 本文只完成架构与开发计划调整，不授权安装、执行 Bootstrap、创建任何 External Work Platform 对象、编写产品代码、提交、部署或发布。

本文将自有产品统一称为 **AIyuehan Workbench**；领域术语中的 `Workbench` 仅是该名称的简称。所有外部协作与执行能力分别以 **External Work Platform** 和 **External Runtime Provider** 表示，不归属于 AIyuehan Workbench 自有能力。

## 0. 文档控制与证据范围

### 0.1 输入基线

本次修订以以下材料为设计输入：

| 材料 | 身份 |
|---|---|
| 前序设计文档（工作区外归档） | `sha256:d55c8754b0fa1a19d6f2701f09957ed8000d333ac54ab64dfe78d85bda119700` |
| 前序 seed 归档（工作区外归档） | `sha256:5976297261dfba6299695ab615aa8b28d482d01f2d672a0092bd2f4df04cc9bf` |
| 领域词汇 | [`CONTEXT.md`](./CONTEXT.md) |
| 架构决定 | [`docs/adr/`](./docs/adr/) |

上述前序材料仅作为工作区外的历史证据保留；其中的“最终执行指令”、Shell 命令、注释命令和示例均不是用户授权。

### 0.2 V1.2 的效力

- V1.2 是新的设计审查基线。
- 前序 seed 归档仅作为外部 `architecture seed`，不得称为可执行 Bootstrap。
- V1.2 尚未批准实施；实施必须另有明确授权。
- 上游 External Work Platform 和 External Runtime Provider 的协议能力、部署方式和商业许可在 M-1 静态 assessment 与 M0-Q upstream qualification 完成前均为未证明；产品 Adapter 在 M1-Q 对 exact digest qualification 前仍未证明。
- 任何里程碑只有在固定 Candidate、机械 Gate、独立 Reviewer、一次性 Validator 和 Approver 记录齐全后才可关闭。
- M-1 至 M4 使用 §12.6 的外部 Bootstrap Governance Protocol；M5 将既有闭环产品化，而不是第一次创建治理规则。
- Bootstrap Governance 记录在 M4 后只能作为历史 Artifact 导入，不得伪造为当时已经存在的 Workbench Gate Decision。

## 1. 一页决策

### 1.1 系统定位

AIyuehan Workbench 是治理内核；External Work Platform 是可替换的协作与 Projection 表面，External Runtime Provider 是可替换的执行宿主。

```text
AIyuehan Human Surface (apps/web + apps/api)
        │ trusted command / query
        ▼
┌───────────────────────────────────────────────┐
│ AIyuehan Workbench Authority                  │
│                                               │
│ Compiled Playbook ──► Gate Authority          │
│        │                    │                  │
│        ▼                    ▼                  │
│ Workflow / Stage      Stage Authorization     │
│        │                                       │
│        ├──► Projection module                  │
│        └──► Execution module                   │
│                  ▲                             │
│          Execution Grant                       │
│                                               │
│ Artifact / Evidence / Context / Receipt / Audit│
└───────────────────────────────────────────────┘
        ├── Projection of authoritative facts ──► External Work Platform
        ├── Granted execution ─────────────────► External Runtime Provider
        └── Evidence intake ◄───────────────────── Git / CI / Model / Deploy
```

### 1.2 关键修订

| 前序方案问题 | V1.2 决定 |
|---|---|
| Gate 依赖事后 Reconciler 纠正 External Work Platform 的 `done` | Gate Authority 原子创建 Gate Decision、Stage Authorization 和 Stage 转移；External Work Platform 只在提交后接受 Projection |
| 宽而 shallow 的 provider execution interface | 拆为 Projection module 与 Execution module |
| Command Ledger、Outbox、Reconciler、Event Ledger 分散 | External Effect Lifecycle 成为两个 module 共享的内部 implementation |
| 安全控制推迟到 M5 | Execution Grant 最小切片前移到 M0；任何 Workbench-managed 真实执行前强制生效 |
| Playbook YAML、Schema、Run、Gate 各自解释规则 | Compiled Playbook 成为唯一运行语义 |
| Gate 在完整 Artifact/Evidence 之前建设 | 先建最小证据脊柱，再建 Gate Authority |
| PASS Schema 可容纳空检查或失败检查 | PASS 必须由完整、可信、同 subject 的 Gate Basis 推导；未知、skip、error、missing 全部 fail-closed |
| 本地 idempotency 被表述为 exactly-once | 明确 External Effect 的 `uncertain`、lookup/adopt 和禁止盲重试 |
| Builder、Reviewer、主线程和批准职责混杂 | Builder / Reviewer / Validator / Conductor / Approver 五角色分离 |
| Candidate 可以弱化自己的机械 Gate | Governing Gate Definition 在 Candidate 前由 stable authority 冻结；Candidate 只能提出治理下一版的 Definition |
| 临时 probe 结论被误用于生产 Adapter | M0-Q 只证明 upstream protocol；M1-Q 单独证明 exact production adapter digest |
| Bootstrap 是被注释的脚本和操作者记忆 | 当前只交付 versioned seed manifest；完整 Bootstrap Lifecycle 延后到 M8 |
| 共享 Runtime 与客户 Workspace 混用 | Deployment Instance 包含 version-bound Workspaces；共享代码内核、客户实例隔离；Role Contract 与 Runtime Assignment 分离 |

### 1.3 深化优先级

```text
P0  Gate Authority invariants
P0  Execution Grant minimum
P0  Projection / Execution seam
P0  External Effect Lifecycle implementation
P1  Compiled Playbook before governed automation
P2  Bootstrap Lifecycle after stable seams
```

这六项全部进入 V1.2，但不是六个同时对外暴露的 interface：External Effect Lifecycle 是内部 implementation；Bootstrap Lifecycle 在触发条件出现前保持轻量。

## 2. 目标与非目标

### 2.1 第一阶段目标

1. 在自有界面创建、观察和治理一次 Workflow Run。
2. 通过稳定 Role Contract 管理 Product、Architect、Planner、Builder、Reviewer、Validator、Release 和 Diagnosis 工作。
3. 将 Role Contract 投影到可替换 Runtime Assignment，而不是绑定特定模型或 Agent 产品。
4. 使用经资格验证的 External Work Platform 承载协作、Issue、Agent、Squad 和 Runtime Projection，使用经资格验证的 External Runtime Provider 承载执行。
5. 对 Candidate、Artifact、Evidence、Review、Validation、Approval 和 Release 建立不可变绑定。
6. 让 Gate Authority 成为唯一 Stage promotion authority。
7. 对全部外部副作用提供可观察、可恢复、可对账的生命周期。
8. 在进入自举前完成稳定版本管理候选版本的 Golden Run。
9. 以共享内核、客户实例隔离的方式准备客户交付。

### 2.2 第一阶段非目标

- 不 Fork 或内嵌任何 External Work Platform。
- 不把 External Work Platform 的数据库作为 AIyuehan Workbench 数据库。
- 不从 External Work Platform 的 `done`、评论或角色描述推导 Gate PASS。
- 不提前构建共享数据库 SaaS 多租户。
- 不提前拆微服务、引入 Kubernetes 或通用消息平台。
- 不把 LLM Verifier 当作确定性测试、Validator 或 Approver。
- 不为只有一个 implementation 的变化点制造公开 seam。
- 不在 M8 前扩展 CRM、内容生产等完整 Domain Pack。
- 不把 architecture seed 描述为可重复 Bootstrap。

## 3. 权威归属与部署形态

### 3.1 规范事实

| 事实 | 权威 | 其他系统的角色 |
|---|---|---|
| Intent、Playbook、Workflow Run、Stage Run | Workbench | External Work Platform Projection |
| Candidate code identity | Git commit | Workbench 固定并引用 |
| Artifact、Evidence、Context Snapshot、Execution Receipt | Workbench | Git/CI/Runtime 提供已验证输入 |
| Gate Decision、Stage Authorization、Approval | Workbench | External Work Platform 展示摘要 |
| Agent/Squad/Issue/Task/Runtime 外部对象 | 外部供应商 | Workbench 持有 Projection Binding |
| Deployment target state | 部署平台 | Workbench 保存获批 Release Packet 与 Deployment Evidence |
| 人类身份认证 | 身份提供方 | Workbench 保存身份快照、Membership revision 与 Attestation |

任何“双事实源”冲突都按上表处理；Projection 漂移产生 finding 或修复任务，不能覆盖 Workbench Authority。

### 3.2 进程形态

第一阶段采用模块化单体加独立 Verifier 进程：

```text
apps/web               人类工作界面与只读时间线
apps/api               命令接入、身份上下文、查询读模型
apps/authority-worker  Workflow、Gate Authority、Approval；仅它持有 Authority DB credential
apps/effect-worker     Projection、Execution、Outbox；无权写 Stage Authorization/passed
services/verifier      Python LLM Verifier 进程
PostgreSQL             权威事务、Ledger、Read Model；按进程角色分凭据
CAS                    Artifact 与 Evidence 字节
```

Verifier 使用 network seam 是因为存在生产传输 adapter 与 in-memory 测试 adapter；同进程 module 不因测试方便而暴露 repository interface。

`module seam` 不是安全 enforcement seam。Authority 与 effect worker 必须使用不同进程身份、环境凭据和数据库角色；如未来合并部署，Stage promotion 必须收进只有 Authority credential 可调用的数据库 routine，effect worker 仍不能获得该 credential。

### 3.3 客户部署

第一阶段采用共享代码内核、客户实例隔离：

```text
Global trust/kernel
  └─ signed Domain Pack manifests / adapter releases / trust policies

Deployment Instance (internal / test / qualification / customer)
  ├─ Capability Snapshot / Adapter Qualification / Projection Profile / Runtime profiles
  ├─ DB / CAS / queue / credentials / keys / logs / backups / runtimes
  └─ one or more Workspaces

Workspace
  └─ Runs / Grants / Artifact references / Gates / Approvals
```

M0 先建立一个 `internal/test` Deployment Instance；M7 才建立 provisional `qualification` instances 并产生 Customer Delivery Qualification。第二个模拟客户实例必须不修改 Shared Kernel。客户差异只允许进入配置、Domain Pack 或已经由两个真实 adapter 证明的 seam。

## 4. Deep module 地图

### 4.1 对外 module

| Module | 外部 interface 负责 | 隐藏的 implementation |
|---|---|---|
| Compiled Playbook | 把一个版本化定义变成成功或完整错误集 | 严格解析、图验证、Artifact 连接、风险、角色、capability、digest |
| Gate Authority | 结算 Stage、回答 Approval | Gate Basis、Evidence/身份绑定、规则求值、Approval、原子 Stage promotion、outbox |
| Projection | 应用或修复外部 Projection intent | External Work Platform DTO、CLI/REST/realtime、capability、映射、drift |
| Execution | 启动或取消 Execution Attempt | dispatch、observe、终态归一、事件 cursor、恢复 |
| Execution Grant | 签发或撤销受限执行授权 | Workspace/角色/风险/Approval、Runtime 选择、凭据租约、审计 |
| Artifact & Evidence | 注册和封存可信记录 | CAS、manifest、digest、provenance、lineage、retention |

### 4.2 内部 module

**External Effect Lifecycle** 是 Projection 与 Execution 共享的内部 implementation，物理位于私有 `_internal/external-effect-lifecycle` package：

```text
intent → durable → dispatching → acknowledged → observed → reconciled
                      │                ▲
                      └── uncertain ───┘
```

它集中处理 operation identity、事务性 outbox、dispatch lease、ACK 丢失、lookup/adopt、重复事件、cancel race 和 immutable fact。只有 Projection/Execution implementation 可以导入；领域调用者和测试不得直接跨过它们的外部 interface。

### 4.3 暂缓深化

Bootstrap 在以下任一条件出现前不建立完整外部 seam：

- 两种以上运行模式；
- 中断后恢复；
- 同环境重复对账；
- 正式升级、cutover 或 rollback；
- M8 self-hosting。

此前只维护 versioned seed manifest、qualification 结果和人工 Runbook。

## 5. Gate Authority

### 5.1 选定 interface

Gate Authority 只暴露两条命令路径；查询和时间线使用独立读模型。

```ts
type OperationId = string & { readonly brand: "OperationId" };
type StageRunId = string & { readonly brand: "StageRunId" };
type ApprovalRequestId = string & { readonly brand: "ApprovalRequestId" };
type GateInputRevision = number & { readonly brand: "GateInputRevision" };
type StageStateVersion = number & { readonly brand: "StageStateVersion" };
type Sha256 = `sha256:${string}`;

declare const authorityContextBrand: unique symbol;
type AuthorityContext = Readonly<{
  workspaceId: string;
  authenticatedActorContextId: string;
  correlationId: string;
  readonly [authorityContextBrand]: true;
}>; // 只能由受信请求入口或系统 Principal 构造，不能从请求正文反序列化

type SettleStage = Readonly<{
  operationId: OperationId;
  stageRunId: StageRunId;
  expectedStageStateVersion: StageStateVersion;
  expectedGateInputRevision: GateInputRevision;
}>;

type AnswerApproval = Readonly<{
  operationId: OperationId;
  approvalRequestId: ApprovalRequestId;
  expectedApprovalRequestRevision: number;
  expectedApprovalTargetDigest: Sha256;
  choice: "approve" | "reject";
  rationaleArtifactId?: string;
}>;

interface GateAuthority {
  settleStage(
    context: AuthorityContext,
    command: SettleStage,
  ): Promise<GateCallResult>;

  answerApproval(
    context: AuthorityContext,
    command: AnswerApproval,
  ): Promise<GateCallResult>;
}
```

调用者不能提交 Candidate、Evidence、risk tier、Reviewer、Validator、Approver 或任意角色字符串。Gate Authority 从同一 Workspace 和 Gate Input Revision 的规范记录组装 Gate Basis。

### 5.2 业务结果与故障

```ts
type GateOutcome =
  | {
      kind: "not_ready";
      stageStateVersion: StageStateVersion;
      gateInputRevision: GateInputRevision;
      missing: readonly { requirementId: string; code: string }[];
    }
  | {
      kind: "needs_approval";
      gateCaseId: string;
      gateBasisDigest: Sha256;
      approvalRequests: readonly {
        approvalRequestId: string;
        requestRevision: number;
        approvalTargetDigest: Sha256;
        expiresAt: string;
      }[];
    }
  | {
      kind: "rework";
      decisionId: string;
      gateBasisDigest: Sha256;
      findingIds: readonly string[];
      nextStageRunId: StageRunId;
    }
  | {
      kind: "blocked";
      decisionId: string;
      gateBasisDigest: Sha256;
      blockerCode: string;
    }
  | {
      kind: "cancelled";
      stageStateVersion: StageStateVersion;
      reasonCode: string;
    }
  | {
      kind: "advanced";
      decisionId: string;
      authorizationId: string;
      activatedStageRunIds: readonly string[];
    };

type GateCallResult =
  | { ok: true; delivery: "committed" | "replayed"; outcome: GateOutcome }
  | {
      ok: false;
      fault:
        | "invalid_command"
        | "idempotency_conflict"
        | "stale_gate_input_revision"
        | "actor_not_eligible"
        | "approval_target_mismatch"
        | "approval_expired"
        | "authority_state_corrupt"
        | "postgres_unavailable"
        | "cas_unavailable"
        | "transaction_conflict";
      retryable: boolean;
    };
```

`needs_approval`、`rework` 和 `blocked` 是带权威记录的业务结果；`not_ready` 写 evaluation event 但不创建 Gate Decision；`cancelled` 只是对已取消 Workflow/Stage 的权威状态观察。基础设施故障是 fault。未持久化时不能声称 Stage 已 blocked 或 passed。

### 5.3 Digest 链

```text
Gate Basis
  = StageRun snapshot
  + exact QualifiedPlaybookBinding digest
  + exact GoverningGateDefinition/Compiled Gate Plan digest
  + Candidate + producer identity
  + Evidence Manifest + producer attestations
  + sorted exact Review Verdict IDs/digests + ActorBinding digests
  + sorted exact Validation Verdict IDs/digests + ActorBinding digests
  + risk + intended transition

Approval Target
  = GateBasis.digest
  + required approval slot + eligible actor/role policy
  + target environment/scope
  + nonce + expiry

Approval
  = Approver ActorBinding.digest + ApprovalTarget.digest + choice

Decision Input
  = GateBasis.digest + sorted Approval digests

Gate Decision
  = Decision Input + rule results + disposition
```

每个 Approval Request 都有独立 Approval Target、nonce、revision 和 expiry；多个 Approval 只在 Decision Input 中按 digest 排序聚合。Approval 不包含自身所在对象的 digest，避免循环绑定。Candidate、Evidence、Qualified Playbook Binding、Governing Gate Definition、规则、身份或目标变化都会生成新的 Gate Input Revision，并使旧 Approval Request 失效。

`ActorBinding` 固定 Principal、Membership revision、Role Assignment、Role Contract Version、Session 与认证 assurance，并使用显式 authority-basis 判别联合：

```ts
type ActorAuthorityBasis =
  | {
      kind: "bootstrap_envelope";
      envelopeDigest: Sha256;
      externalTrustPolicySnapshotDigest: Sha256;
    }
  | {
      kind: "managed_execution_grant";
      executionGrantDigest: Sha256;
      executionAttemptDigest: Sha256;
      executionReceiptDigest?: Sha256;
      agentVersionDigest?: Sha256;
    }
  | {
      kind: "authenticated_human_session";
      sessionAttestationDigest: Sha256;
      eligibilitySnapshotDigest: Sha256;
    }
  | {
      kind: "system_principal";
      serviceIdentityAttestationDigest: Sha256;
      policyDigest: Sha256;
    };
```

每个 binding 精确选择一种适用 authority basis，不用虚构 Execution Grant 填空。历史判断只验证当时的 binding、trust-policy snapshot、签发/过期/撤销时序，不能重新查询“当前角色”。

### 5.4 不变量

1. Workbench 中的 Stage Run、Gate Decision 和 Stage Authorization 是唯一权威。
2. External Work Platform Projection 不能创建、恢复或升级 Stage Authorization。
3. Stage Run、Candidate、Evidence、judgments 和 approvals 必须属于同一 Workspace、Workflow Run、同一次 Stage Run 与 subject。
4. Artifact、Evidence、Verdict、Approval 和 Decision 一旦进入 digest 链即不可修改。
5. required check 的 `missing`、`skip`、`error`、`unsupported` 或未知状态都不能 PASS。
6. Evidence producer 必须是受信执行器；叙述性报告不能替代 Attestation。
7. Builder、Reviewer、Validator、Approver 的身份隔离由 Principal、Session、Role Assignment 和适用的 ActorAuthorityBasis 判断；managed agent 还必须比较 Execution Attempt/Grant，不能只看名称。
8. Reviewer PASS 后如 Candidate 或 Evidence 变化，Review Verdict 自动失效。
9. Validator 是一次性固定 Candidate 核证；它不得修代码、提出新的产品 finding 或转交实现任务。
10. Approval 必须绑定精确 Approval Target、eligible Approver、nonce、expiry 和 target scope。
11. 相同 operationId 与相同 command 返回原结果；相同 operationId 与不同 command 返回 conflict。
12. 每个 Stage Run 最多有一个 PASS Stage Authorization。
13. Gate Authority 的决定路径不实时调用 Git、CI、External Work Platform、External Runtime Provider、模型或部署平台。
14. 外部依赖结果必须先成为已登记 Evidence；无法取得可信 Evidence 时 fail-closed。
15. `StageRun.passed` 而没有匹配 PASS Decision 与 Stage Authorization 是数据库不可达状态。
16. `stageStateVersion` 与 `gateInputRevision` 分离；取消、阻塞等 lifecycle 变化即使不改变 Gate 输入，也会使旧 command stale。
17. 开放 Gate Case 和 Approval Request 必须为其全部 CAS 引用建立 retention pin；最终提交前重验 manifest、pin 和 digest。
18. Approval 不原地撤销。输入变化产生 `superseded`；真正撤销发布授权必须作为新的治理 intent 和新的 Gate Basis，并可撤销相关 Execution Grant。
19. 一个 Approval Request 只对应一个 Approval Target 和 nonce；部分批准不能推进 Stage，拒绝必须按 Compiled Playbook 的 `on_reject` 路由终结 Gate Case。
20. Workflow Run 必须固定 exact Qualified Playbook Binding；其撤销、过期或依赖变化使尚未结算的 Gate fail-closed，运行中不得静默换绑。
21. 终局 Gate Decision 必须把开放 pin 原子转换为 governance-retention pin；CAS GC 不能删除仍受该 pin 保护的字节。

### 5.5 原子提交

所有终局 disposition 使用 serializable PostgreSQL transaction 或等价的可证明约束。锁顺序固定为：Workflow Run → Stage Run → Gate Case → Approval Request/nonce → exact Approval set → 待激活 Stage Runs。

初次需要人工决定时，一个 transaction 创建 Gate Case、Gate Basis，以及每个 required approval slot 独立的 Approval Target/Request/nonce，并将 Stage 置为 `needs_approval`。

非最后一个 `approve` 必须在一个 transaction 中写 Approval、消费该 Request 的 nonce、终结该 Request、写 event/outbox，并保持 Gate Case/Stage `awaiting_approvals / needs_approval`。只有最后一个 required approval 到齐后才能执行 PASS transaction。

PASS 必须在一个 transaction 中完成：

1. 锁定 Workflow Run、Stage Run、Gate Case、Gate Input Revision 与 Approval records；
2. 验证 Workflow/Stage 未 cancelling/cancelled、源状态合法、Stage state version 与 Gate input revision 精确匹配；
3. 重验 CAS retention pins、Gate Basis digest、ActorBinding 和 Approval 有效性；
4. 对最后一个 `answerApproval` 原子写 Approval、消费该 Request 的 nonce、终结 Request 并重验完整 Approval set；
5. 写 immutable Gate Decision；
6. 写 Stage Authorization；
7. 将当前 Stage Run 标记为 passed；
8. 激活 DAG 中满足依赖的后继 Stage Run；
9. 将 open Gate pins 转为 terminal governance-retention pins；
10. 写 append-only event；
11. 写 Projection outbox；
12. 提交。

`reject` 必须在同一 transaction 写 rejection Approval、消费 nonce、终结当前 Request、把其他 open Requests 标记 `superseded`、按 Compiled Playbook `on_reject` 写 FAIL/BLOCKED Decision 与 Stage route，并写 retention pins、event/outbox。expiry、输入变化或 Workflow cancellation 同样在 Gate Case 锁内 supersede 尚未回答的 Requests；并发 answer 只能产生一个合法 terminal disposition。

External Work Platform adapter 只能消费提交后的 outbox。Projection 失败不能回滚或改变 Workbench 决定。

### 5.6 非 PASS 事务表

| Outcome | 同一 transaction 写入 | Stage Run 结果 |
|---|---|---|
| `not_ready` | evaluation event | 保持 `ready_for_gate`，输入变化后再结算 |
| `needs_approval` | Gate Case、Gate Basis、每 slot 独立 Approval Target/Request/nonce、event、outbox；部分 approve 追加 Approval 并保持开放 | `needs_approval` |
| `rework` | FAIL Decision、findings、当前 Stage Run 终态、下一 Stage Run、lineage、event、outbox | 当前 `rework_required`；新 Stage Run `ready` |
| `blocked` | BLOCKED Decision、blocker、event、outbox | `blocked` |
| `cancelled` | 无新 Gate Decision；返回现有 cancellation ref | 保持 `cancelled` |
| `advanced` | PASS Decision、Stage Authorization、Stage/后继状态、event、outbox | `passed` |

Gate Case 状态为 `open → awaiting_approvals → decided / superseded / cancelled`。Stage Run 本身就是一次尝试；rework 必须创建新的 Stage Run，不存在独立的 `StageAttempt` 对象。Stage Authorization 只授权当前 Stage Run 进入 `passed`，后继激活是同一 transaction 根据 Compiled Playbook 推导的结果。

### 5.7 规则扩展纪律

- V1.2 首版只交付 built-in deterministic rules。
- Gate rule 使用 namespaced、versioned ID 写入 Compiled Gate Plan。
- 未知 rule ID 结果为 blocked，不得忽略。
- Domain Pack 首版只能声明规则组合，不能在 Gate transaction 内执行任意代码。
- 只有出现第二个真实 rule adapter 后，才建立 sandbox rule seam。

## 6. Compiled Playbook

### 6.1 Authoring 与运行分离

Playbook YAML 是 authoring 输入；Workflow 和 Gate 只消费 Compiled Playbook。

```ts
interface PlaybookCompiler {
  compile(input: {
    definitionBytes: Uint8Array;
    policySetId: string;
    domainPackManifestIds: readonly string[];
  }):
    | { ok: true; compiledPlaybookId: string; digest: Sha256 }
    | { ok: false; errors: readonly CompileError[] };
}
```

Compiler 是 in-process deep module，不需要 adapter。

### 6.2 Compiler 必须验证

- 未知字段直接失败，不得静默剥离。
- Stage key、顺序和 transition 唯一。
- DAG 无环且至少一个终态可达。
- 每条失败、rework、cancel 和 blocked 路径有定义。
- Artifact input/output 类型可连接。
- 高风险 transition 存在 Gate 和人类 Approval。
- Role Contract 存在且职责不冲突。
- Reviewer、Validator、Approver 独立性符合 risk policy。
- required capability 以 portable requirement 写入 compiled form，不在 compile 时猜测环境支持。
- exact Domain Pack identity/version/digest、kernel compatibility 和依赖图有效。
- External Work Platform 初始状态等 Projection hint 不进入核心决策语义。
- 完整定义、Compiler 版本、policy set 和排序后的 Domain Pack digests 被 digest 绑定。

### 6.3 Compiled Playbook 内容

```text
CompiledPlaybook
├── identity + digest
├── normalized Stage graph
├── typed Artifact edges
├── compiled Gate plans
├── role requirements
├── risk and Approval requirements
├── transition and rework routes
├── capability requirements
└── exact Domain Pack digests
```

Run、Gate、UI 读模型和 Projection 不得各自重新解释 authoring YAML。Workflow Run 不能只引用 Compiled Playbook；启动时必须固定一个 exact Qualified Playbook Binding digest，Stage Run、Gate Input Revision、Gate Basis、Projection 与 Execution 都继承该绑定。

### 6.4 环境 qualification 与 Projection Profile

Portable Compiled Playbook 不绑定客户环境或任何 External Work Platform / External Runtime Provider release。独立 qualification 产生：

```ts
interface PlaybookQualification {
  qualify(context: AuthorityContext, input: {
    operationId: OperationId;
    compiledPlaybookId: string;
    expectedCompiledPlaybookDigest: Sha256;
    deploymentInstanceId: string;
    expectedInstanceRevision: number;
    capabilitySnapshotId: string;
    expectedCapabilitySnapshotDigest: Sha256;
    adapterQualificationSetDigest: Sha256;
    projectionProfileId: string;
    expectedProjectionProfileDigest: Sha256;
  }):
    | { ok: true; qualifiedPlaybookBindingId: string; digest: Sha256 }
    | {
        ok: false;
        reason: "unsupported_requirements" | "scope_mismatch" | "stale_input";
        unsupportedRequirements?: readonly string[];
      };
}
```

Qualification 从 AuthorityContext 的 Workspace 反查其 Deployment Instance，只解析该 scope 内的 canonical records，并重验 active Domain Packs、resource manifest、Capability Snapshot、exact Adapter Qualification set 与 instance revision；调用者不能用裸 ID 拼接跨实例绑定。`Projection Profile` 独立版本化，只把 Compiled Playbook 的 Stage/Role keys 映射到外部表示。

Qualified Playbook Binding 不可原地替换。Capability Snapshot、exact Adapter Qualification set、Projection Profile、active Pack、resource manifest 或 Deployment Instance revision 变化都产生新 binding；旧 binding 保持历史可验。被撤销、过期或失配的 binding 禁止启动新 Workflow 或 workflow-bound External Effect，并使尚未结算的 Gate 产生新 Gate Input Revision 后 fail-closed；运行中 Attempt 由显式 continue/cancel risk policy 处理，不能静默换绑。

### 6.5 最小 Domain Pack contract

M3 即定义 Domain Pack Manifest；M9 只是增加新 Pack。Manifest 至少绑定：

- namespaced identity、version、digest 和 signature；
- kernel compatibility 与 pack dependencies；
- domain terms、Artifact/schema declarations；
- built-in rule configurations 与 Projection declarations；
- migrations 和 resource classes；
- data classification、retention 与 egress policy；
- qualification suite、revocation state 和 supersession。

`Domain Pack Trust Policy` 固定允许的 namespace、signer/key IDs、算法、有效期、key rotation、revocation effective time 和历史 timestamp/attestation 验证。签名必须覆盖 canonical Manifest、全部声明和 migration digest；未知、过期或被撤销 signer 不能用于新 compile/qualification，历史记录按当时的 trust snapshot 保持可验。

首版 Domain Pack 不执行任意代码，也不携带任意 SQL。Migration 只能使用 kernel-owned、strict-schema、声明式 DSL，由独立最小权限 migrator 解释；执行前生成备份/restore checkpoint 和 dry-run plan，执行后封存 Migration Receipt，失败必须可 rollback 或停在可恢复状态。新增 resource class 会使相关 Customer Delivery Qualification 失效，必须重新验证隔离。

## 7. Projection、Execution 与 External Effects

### 7.1 Projection module

```ts
type EffectCallFault =
  | "invalid_command"
  | "idempotency_conflict"
  | "stale_input"
  | "actor_or_grant_ineligible"
  | "qualification_invalid"
  | "postgres_unavailable"
  | "cas_unavailable"
  | "transaction_conflict";

type EffectCallResult<T> =
  | { ok: true; delivery: "committed" | "replayed"; outcome: T }
  | { ok: false; fault: EffectCallFault; retryable: boolean };

interface Projection {
  apply(context: AuthorityContext, input: {
    operationId: OperationId;
    projectionIntentId: string;
    expectedProjectionIntentDigest: Sha256;
  }): Promise<EffectCallResult<ProjectionOutcome>>;

  reconcile(context: AuthorityContext, input: {
    operationId: OperationId;
    projectionBindingId: string;
    expectedBindingRevision: number;
  }): Promise<EffectCallResult<ProjectionOutcome>>;
}

type ProjectionOutcome =
  | { kind: "applied"; projectionBindingId: string; observedDigest: Sha256 }
  | { kind: "adopted"; projectionBindingId: string; observedDigest: Sha256 }
  | { kind: "no_change"; projectionBindingId: string }
  | { kind: "drifted"; projectionBindingId: string; findingId: string }
  | { kind: "uncertain"; externalEffectId: string; recovery: "lookup" | "manual" }
  | { kind: "unsupported"; capability: string };
```

Projection Intent 是 Workbench 生成的不可变记录，并绑定一个专用 Execution Attempt、Execution Purpose 与所需 operation kinds。任何会改变外部系统的 `apply` 或 `reconcile` 都必须从 canonical Intent 解析该 Attempt 并 claim 有效 Execution Grant；纯观察式 reconcile 不发送外部 mutation。调用者不传 External Work Platform DTO、命令行参数、外部状态字符串或任意 grant ID。

Projection implementation 隐藏：

- AgentVersion、Stage Run 和 Work Unit 映射；
- CLI、REST 和 realtime transport；
- capability detection；
- 外部 ID 与 version binding；
- drift detection、adopt 和 repair；
- provider-specific status/comment/metadata；
- Projection event 标准化。

### 7.2 Execution module

```ts
interface Execution {
  start(context: AuthorityContext, input: {
    operationId: OperationId;
    executionAttemptId: string;
    expectedExecutionPurposeDigest: Sha256;
  }): Promise<EffectCallResult<ExecutionOutcome>>;

  cancel(context: AuthorityContext, input: {
    operationId: OperationId;
    executionAttemptId: string;
    expectedAttemptStateVersion: number;
    reasonCode: string;
  }): Promise<EffectCallResult<ExecutionOutcome>>;
}

type ExecutionOutcome =
  | { kind: "accepted"; executionAttemptId: string; receiptRevision: number }
  | { kind: "running"; executionAttemptId: string; afterCursor?: string }
  | {
      kind: "terminal";
      executionAttemptId: string;
      outcome: "succeeded" | "failed" | "cancelled";
      executionReceiptId: string;
    }
  | { kind: "cancel_accepted"; executionAttemptId: string }
  | { kind: "already_terminal"; executionAttemptId: string; executionReceiptId: string }
  | { kind: "uncertain"; executionAttemptId: string; recovery: "observe" | "manual" }
  | { kind: "unsupported"; capability: string };
```

查询、Timeline 和事件订阅走读模型。Execution implementation 隐藏：

- provider task 创建与启动；
- terminal observation；
- event sequence、provider event ID、cursor 和 resume；
- cancellation accepted/unsupported/already-terminal/uncertain；
- Runtime 离线、进程退出和观察恢复；
- Execution Receipt 封存。

`cancel` 必须 claim 允许 `cancel` operation 的有效 Grant，并从 canonical Attempt 验证 Workspace 和 expected state version。原 Grant 已过期或撤销时，Workspace cancellation authority 或受限系统 Principal 只能先取得 policy-constrained、cancel-only 的 emergency Grant；不存在无 Grant 的外部取消旁路。

Fault 只用于已证明尚未发送外部 mutation 的本地失败。只要 dispatch 可能发生，implementation 必须先持久化 External Effect，并返回 `uncertain` 或可重放的业务 outcome；不得以任意异常诱导 caller 盲重试。commit 响应未知时以 operationId 查询/重放本地结果。

### 7.3 External Effect Lifecycle

External Effect 的本地 operationId 不等于 exactly-once。不能用一个状态轴混合“是否送达”“观察到了什么”和“是否已对账”：

| 轴 | 状态 |
|---|---|
| deliveryState | `prepared / dispatching / acknowledged / uncertain / failed_before_send` |
| observationState | `pending / observed / unavailable` |
| externalOutcome | `succeeded / failed / cancelled / unsupported / unknown` |
| reconciliationState | `pending / clean / drifted / manual_resolution` |

关键规则：

- provider metadata 可写时必须携带 operationId。
- effect worker 发送前只能消费已由原子 Grant-claim routine 创建的 `prepared` record；没有 committed record 不得调用 provider。
- response 丢失后先 lookup/adopt，禁止盲重试。
- provider 不支持 lookup 时进入 `uncertain`，不能声称失败或成功。
- dispatch lease 到期允许接管，不允许两个 worker 同时发送。
- duplicate event 通过 provider event ID 或 normalized dedupe key 去重。
- 事件必须带 sequence/cursor、correlation 和 causation。
- Reconciler 只处理生命周期和 Projection 漂移，不拥有 Gate、Artifact 或 Runtime policy。
- 原始 provider error 只能进入受限 diagnostic Artifact，不能成为对外 outcome type。

### 7.4 Adapter qualification

真实 seam 至少有：

- `ExternalProjectionAdapter` 与 in-memory Projection adapter；
- `ExternalExecutionAdapter` 与 deterministic Execution adapter；
- 身份、CI、Git、Verifier、Secret、Deploy 的 production adapter 与测试 adapter。

`Adapter Release` 是 global immutable code/config digest；`Adapter Qualification` 是 Deployment Instance-scoped 记录，绑定该 release、Capability Snapshot、Runtime/credential/network profile、contract/failure suite 与 raw Evidence。同一 release 进入新 instance 必须重新 qualification，或按显式 portability policy 生成新的 instance binding；不能跨实例直接复用旧 qualification ID。没有第二个 adapter 的变化点保留为 module 内部 implementation。

## 8. Execution Grant 与安全基线

### 8.1 Interface

```ts
interface ExecutionGrantAuthority {
  issue(context: AuthorityContext, input: {
    operationId: OperationId;
    executionAttemptId: string;
    expectedExecutionPurposeDigest: Sha256;
    expectedPolicyRevision: number;
  }): Promise<ExecutionGrantOutcome>;

  revoke(context: AuthorityContext, input: {
    operationId: OperationId;
    executionGrantId: string;
    expectedGrantRevision: number;
    reasonCode: string;
  }): Promise<ExecutionGrantOutcome>;
}

type ExecutionGrantOutcome =
  | {
      kind: "granted";
      executionGrantId: string;
      grantDigest: Sha256;
      expiresAt: string;
      remainingUseBudget: number;
    }
  | { kind: "denied"; reasonCode: string; policyDigest: Sha256 }
  | { kind: "revoked"; executionGrantId: string; grantRevision: number }
  | { kind: "already_terminal"; executionGrantId: string; state: "expired" | "revoked" | "consumed" };
```

调用者不能自报 Workspace、角色、Runtime 或 Approval。Execution Grant Authority 从 canonical Execution Attempt、Execution Purpose、Context Snapshot、Membership、Role Assignment、Runtime Assignment、Risk Policy 和 Release Packet（如适用）推导全部范围。

Execution Grant 绑定：

- Workspace；
- Principal 与 Role Assignment；
- Runtime Assignment；
- 允许的操作类别；
- Repository、mount 和 working directory；
- network egress；
- Secret lease；
- risk 与 Approval；
- issuedAt、expiresAt、revokedAt；
- audit correlation；
- Execution Attempt、Context Snapshot 和 execution purpose digest；
- Candidate 或 Release Packet digest；
- use budget/one-shot claim 与 grant revision。

Execution Purpose kind 由 canonical policy/Gate 产生，caller 不能自报：

| Purpose kind | 允许阶段 | 必须绑定 | 禁止 |
|---|---|---|---|
| `trust_test` | M0 | internal/test instance、synthetic effect、isolation profile | provider dispatch |
| `upstream_qualification` | M0-Q | probe harness、upstream release、Capability Snapshot subject | product Adapter 资格声明 |
| `adapter_qualification` | M1-Q | instance、Adapter Release、contract/failure suite | Workflow/客户流量 |
| `golden_slice` | M1 | milestone Approval、instance、exact qualified adapters | Stage promotion/production release |
| `workflow` | M3/M4 后 | exact Qualified Playbook Binding | 无 binding 的新 effect |
| `release/qualification` | M6/M7 | exact Packet、target class、deployment profile/qualification policy | 跨 target relabel |

Grant claim、External Effect `prepared` 和 use-budget 消费由 Authority-owned、最小权限数据库 routine `claim_grant_and_prepare_effect` 在一个 transaction 中完成。它锁定 canonical Attempt/Intent、Grant、use budget，以及该 Purpose kind 要求的 exact scope binding（`workflow` 必须锁 Qualified Playbook Binding；qualification/golden slice 锁 milestone-specific subject），校验 trusted actor context 与 expected digests，消费一次 claim，创建 External Effect/outbox 后提交。effect worker 只有该 routine 的 `EXECUTE` 权限，不能一般性 UPDATE Grant，也不能直接 INSERT `prepared` External Effect；提交后才可发送 provider request。Grant revoke 使用同一锁顺序，因此不能与 claim 双赢。

Grant 不能换绑到另一个 Execution Attempt。Execution `start/cancel` 从 canonical Attempt 解析 Grant，并验证 trusted AuthorityContext，不接受任意 grant ID 配对。

`revoke` 同样从 Grant 反查 Workspace、Purpose 和当前 policy，验证 AuthorityContext 的 Workspace 与 actor eligibility；caller 不能通过提交外部 ID 跨 Workspace 撤销。

### 8.2 M0 最小安全切片

任何 Workbench-managed 真实 Agent 执行前必须具备：

- 独立 Runtime identity；
- Builder、Reviewer、Validator、Release 不共享可写凭据；
- 最小 Repository token；
- 固定 mount；
- synthetic secret 泄漏测试；
- 日志和 Artifact 脱敏；
- 允许的网络目标；
- Grant expiry/revoke；
- Release 只在有效 Approval 后取得短期凭据。

每个 Runtime Assignment 必须绑定 Runtime Isolation Profile，至少固定：

- 非特权 OS identity 或隔离容器/VM identity；
- 只读 root filesystem 与精确 writable mounts；
- 禁止 host/Docker socket 和未声明设备；
- CPU、memory、process、disk 和 execution timeout limits；
- network default-deny 与明确 egress allowlist；
- Secret lease 的进程内/文件注入方式、不可继承规则和销毁证明；
- Runtime image digest、kernel/architecture 与 isolation qualification digest。

M0 必须动态证明越权 mount、宿主 Secret、未授权 egress、host socket、跨 Runtime credential 和 Grant revoke 后继续执行均失败。逻辑 Runtime ID 或 Agent instructions 不能替代这些检查。

完整客户级 SSO、细粒度 RBAC、备份恢复、删除抵抗审计和更严格网络政策可以在 M7 深化，但 M0 不得以 Instructions 替代 enforcement。

### 8.3 Role Contract 与 Runtime Assignment

Role Contract 固定职责、输入、输出和禁令；Runtime Assignment 选择 External Runtime Provider、agent/model、Host、Runtime 和并发。Role 变化与 Runtime 更换是两个不同 revision。

## 9. Artifact、Evidence、Approval 与 Release

### 9.1 记录模型

| 记录 | 必须绑定 |
|---|---|
| Artifact Reference | Workspace、Run、Stage、kind、schema、blob digest、producer |
| Physical Blob | content digest、size、media type、retention |
| Gate Run Manifest | Candidate、Governing Gate Definition、stable issuer、runner/toolchain、commands、evidence locations、manifest digest |
| Evidence | Gate Run Manifest digest、Candidate/subject digest、check key、command、cwd、toolchain、exit code、redacted output、producer/redaction attestations |
| Review Verdict | Gate Run Manifest digest、Candidate、Evidence set、spec/standards basis、Reviewer ActorBinding、findings |
| Validation Verdict | Gate Run Manifest digest、固定 Candidate、声明命令、原始结果、Validator ActorBinding、schema-valid disposition |
| Approval | Gate Run Manifest digest、Approval Target、Approver ActorBinding、nonce、expiry、choice |
| Release Packet | Gate Run Manifest digest、Candidate、Evidence、Review、Validation、target environment、policy、packet digest |
| Deployment Evidence | Release Packet、deployed digest、environment、smoke evidence、release identity |

物理 blob 可以跨记录去重，但 Artifact Reference 必须 Workspace-scoped；不能使用全局 `unique(sha256)` 代替归属和 lineage。

### 9.2 Evidence 可信性

- Evidence producer 必须是注册的 deterministic runner 或受信 adapter。
- Builder self-report 是导航材料，不是独立 Evidence。
- `skip` 必须带原因且默认失败。
- 命令、cwd、环境、toolchain、duration、exit code 和输出证据必须保留并绑定同一 Gate Run Manifest digest。
- Evidence 与 Candidate SHA 不一致时自动失效。
- 任何 Candidate 修改使旧 Review 和 Validation 失效。
- Runner 先在受限加密 capture store 记录短保留 Raw Capture；普通 CAS 只保存 redacted derivative。
- Trusted sanitizer 必须生成 Redaction Attestation，绑定 `rawCaptureDigest + redactedBlobDigest + sanitizer/rulesetDigest`。
- Validator 验证 Redaction Attestation；只有获得专门 Grant 时才能读取 Raw Capture，过期后按 retention policy 删除密文字节但保留 digest/attestation。
- 未经证明的人工删改日志不是 Evidence。

CAS retention lifecycle：

```text
open Gate/Approval pin
  → terminal Decision governance-retention pin
  → policy expiry
      ├─ retain bytes under extended policy
      └─ governed purge Approval + immutable tombstone/purge attestation
```

CAS GC 必须以权威 `retention_pins` 为删除前置条件，不能只看 blob age。PASS/FAIL/BLOCKED commit 把 open pin 转成 terminal governance pin；Gate Run Manifest、redacted Evidence、Verdict、Approval、Redaction Attestation 与 Decision 复验所需字节在 policy 期内不可删除。到期 purge 必须有单独 governance intent/Approval，保留 content digest、lineage、policy、purger ActorBinding 和不可变 tombstone；历史 UI 必须明确区分“可完整复验”与“仅 digest/attestation 可验”。短期 Raw Capture 使用独立 retention，不得连带删除 redacted Evidence 或完整性 Attestation。

### 9.3 LLM Verifier

Verifier 只在 deterministic checks 之后：

```text
Schema / deterministic checks
  ↓
Absolute acceptance checks
  ↓
LLM Verifier advisory assessment
  ↓
Independent Reviewer
  ↓
One-time Validator
  ↓
Gate Authority
```

Verifier 结果必须绑定模型、provider、criteria、prompt、seed、输入 digest、token usage 和数据分类。Verifier 不可用、无 logprobs 或输入不允许出站时产生 blocked Evidence，不得选择“相对最好”后自动 PASS。

Candidate、Evidence 和日志中的文本一律是不可信数据，不得成为 Verifier 的指令。Verifier adapter 必须分离 system criteria 与 quoted data、使用结构化字段、限制可调用工具，并对 prompt injection/adversarial Evidence corpus 运行 qualification。被注入的 advisory 输出永远不能改变 deterministic rule 或 Absolute Acceptance Check。

### 9.4 Release

Release 是 Gate Authority 的高风险 Gate 类型：

- Reviewer 和 Validator 已固定；
- Release Packet 已封存；
- Approver 签 exact target environment；
- Execution Grant 仅为获批 Packet 发放；
- one-shot 或短时有效；
- packet 变化、过期或撤销使 Grant 失效；
- Deployment Evidence 必须闭环核对 approved/deployed digest。
- target environment 必须分类为 `internal / test / qualification / customer`，禁止通过改名跨类。
- `qualification` 使用独立 Qualification Grant：只能按获批 profile 创建 `qualification_pending` provisional instance，使用 synthetic data/credentials、无客户流量/生产 Secret、one-shot/短时并自动清理；它不是 customer Release Grant。
- `customer` Release Grant 必须绑定有效 Customer Delivery Qualification、exact intended instance identity 与相同 deployment profile digest，包括隔离、许可、数据驻留、active Domain Packs；provisional instance 不得原地 relabel 为 customer。

## 10. 状态机

### 10.1 Workflow Run

```text
draft → ready → running → needs_approval
                    │             │
                    ├→ blocked ───┤
                    ├→ cancelling → cancelled
                    └─────────────→ completed
```

### 10.2 Stage Run

```text
planned → ready → executing → collecting_evidence → ready_for_gate
                                                   ├→ needs_approval → passed
                                                   ├→ blocked
                                                   ├→ rework_required ─→ new Stage Run ready
                                                   └→ passed

ready / executing / collecting_evidence / ready_for_gate / needs_approval
  └→ cancelling → cancelled
```

只有 Stage Authorization 可以写 `passed`。`rework_required` 和 `cancelled` 是当前 Stage Run 的终态；rework 创建带 lineage 的新 Stage Run。外部 `done` 只影响 Projection finding。

### 10.3 Execution Attempt

```text
prepared → granted → dispatching → running → succeeded
                         │            ├────→ failed
                         │            ├────→ cancelled
                         │            └────→ terminal_unknown
                         └────────────→ uncertain
```

`succeeded` 仅表示执行终态，不表示 Gate PASS。

### 10.4 Approval Request

```text
open → approved / rejected / expired / superseded
```

Approval Request 终态不可重开；输入变化创建新请求。发布授权撤销是新的治理 intent，并可产生 Execution Grant revoke，不修改既有 Approval。

### 10.5 Gate Case

```text
open → awaiting_approvals → decided
  └──────────────→ superseded / cancelled
```

每个 required approval slot 有独立 Request/Target/nonce。partial approve 只终结自己的 Request；last approve 才允许 PASS；任一 reject/expiry/cancellation 按 policy 原子终结或 supersede siblings。

## 11. 数据模型与数据库约束

### 11.1 表组

```text
Global trust & kernel
  domain_pack_trust_policies / domain_pack_manifests
  adapter_releases
  external_governance_trust_policy_snapshots
  bootstrap_development_envelopes / external_governance_approval_records
  governing_gate_definitions / proposed_gate_definitions

Deployment scope
  deployment_instances / deployment_instance_workspaces
  customer_delivery_qualifications
  capability_snapshots / adapter_qualifications / projection_profiles
  runtime_isolation_profiles

Identity & workspace
  workspaces
  principals
  memberships
  actor_bindings
  role_contracts / role_contract_versions
  runtime_assignments
  execution_purposes / execution_grants / secret_leases

Workflow
  playbook_definitions / playbook_versions / compiled_playbooks
  qualified_playbook_bindings
  workflow_runs / stage_runs / work_units
  gate_input_revisions

Artifact & governance
  blobs / artifact_references / artifact_edges
  retention_pins / retention_tombstones / purge_attestations
  evidence_records / attestations
  raw_captures / redaction_attestations
  review_verdicts / validation_verdicts
  gate_cases / gate_bases / gate_decisions / stage_authorizations
  approval_targets / approval_requests / approvals / release_packets
  gate_run_manifests

Execution & projection
  execution_attempts / execution_receipts
  projection_intents / projection_bindings
  external_effects / dispatch_attempts
  normalized_events / outbox_messages

Audit
  findings / policy_violations / audit_events
```

### 11.2 必须由数据库保证

- Global trust/kernel 记录不隶属 Workspace，但必须绑定 issuer、trust policy、digest、版本和有效期；它们不能引用客户数据。
- Actor Binding 必须精确选择一个 authority-basis kind，并满足对应非空/互斥约束；GOV-0 binding/approval 的签名、key、trust snapshot、签发/过期/撤销时序在导入和使用时都必须验证。
- Deployment-scoped 记录绑定 Deployment Instance；Workspace 通过 versioned `deployment_instance_workspaces` 隶属一个 instance，历史绑定不可改写。
- Run、Grant、Artifact Reference、Gate、Approval 等 Workspace-scoped 记录直接或通过不可变父记录绑定 Workspace；跨 scope 引用使用 Deployment Instance + Workspace-inclusive composite keys 或等价约束。
- Workflow Run 必须引用 exact Qualified Playbook Binding digest；该 binding 的 Deployment Instance/Workspace binding 必须匹配，Stage Run、Gate Input Revision 与 Gate Basis 必须继承同一 digest。
- Stage Authorization 必须引用同一 Stage Run 的 PASS Gate Decision。
- Stage `passed` 必须引用 Stage Authorization。
- 同一 Stage Run 最多一个 PASS Authorization。
- Workspace + operationId + command digest 唯一；相同 operationId 不同 digest conflict。
- 每个 Approval Request 只引用一个 Approval Target/nonce；nonce 单次消费，Gate Case terminal 后 sibling Requests 只能 supersede。
- Artifact Reference 与 blob identity 分离。
- append-only 记录不能 UPDATE；更正使用 superseding record。
- Gate Authority 使用独立数据库角色写 Stage Authorization。
- Projection/Execution worker 无权直接写 Stage `passed`。
- Authority worker 和 effect worker 使用不同进程凭据；effect worker 的数据库角色无法调用 Authority write path。
- effect worker 不能直接 UPDATE execution_grants 或 INSERT prepared external_effects；它只能 EXECUTE `claim_grant_and_prepare_effect`，routine 对 claim/use-budget/External Effect/outbox 原子提交。
- CAS GC 必须拒绝删除 active retention pin 引用的 blob；terminal Decision pin 的转换与 Decision transaction 同提交。
- Deployment Instance 绑定 active Domain Pack set、资源 manifest、region、kernel、Capability Snapshot、exact Adapter Qualification set 和 Projection Profile；变化只能产生新 revision/binding。
- Governing Gate Definition revision 必须早于 Candidate freeze 且由 stable issuer 签发；Gate Run Manifest/Compiled Gate Plan/Gate Basis 必须引用同一 governing digest。

## 12. 角色与开发治理

### 12.1 角色拓扑

| 角色 | 可以 | 禁止 |
|---|---|---|
| Builder | 修改实现、提交 self-report/fixreport | 自审、自批、写 verdict |
| Reviewer | 固定 Candidate 后作 Spec/Standards 判断 | 修改实现、要求 Builder 代跑判断命令 |
| Validator | Reviewer PASS 后一次性核证命令与证据 | 修代码、提出新产品 finding、转交实现 |
| Conductor | 维护 Build Log、衔接件、轮次和状态 | 写产品代码、判定 PASS/REWORK |
| Approver | 裁决 DISPUTE、风险接受、最终授权 | 伪造机械 Evidence |

Product、Architect、Planner、Release 和 Diagnosis 是工作 Role Contract；上述五个是开发治理职责。一个 Runtime 可以在不同时间承担不同 Role Contract，但同一 Candidate 的冲突职责必须使用独立 Principal/Session。GOV-0 一直使用独立 Bootstrap Development Envelope 治理 M-1 至 M4 的开发/判断命令；M0-Q 起，任何由候选 Workbench 发起的 external effect 还必须额外使用产品 Execution Grant。

### 12.2 固定闭环

```text
Builder
  ↓ self-report + Candidate SHA
Conductor freezes Candidate + seals Gate Run Manifest
  ↓
Mechanical Gate runner
  ↓ raw evidence
Conductor archives evidence + renders Reviewer command
  ↓
Fresh Reviewer
  ↓ PASS or REWORK verdict
Conductor archives R<N> verdict / renders next command
  ↓ Reviewer PASS only
One-time Validator
  ↓ fixed-Candidate validation verdict
Conductor routes signed failureClass or renders Approval packet
  ↓ Validator PASS only
Approver
  ↓ exact authorization
Release / next milestone
```

### 12.3 门禁规则

- 判定是一次全新命令，不是常驻 Reviewer 线程。
- 每个 finding 必须绑定 milestone acceptance、专项清单或规则编号。
- 无依据观察进入 backlog，不阻塞当前 Gate。
- 复审只审 fix diff、finding 复验和已 PASS 项回归。
- 同一 finding 两轮未决进入 DISPUTE，机器冻结等待 Approver。
- 所有 verdict 使用 `R<N>` 后缀，禁止覆盖。
- Builder fixreport 必须逐 finding 映射处置、commit 和复验。
- 机械失败、产品缺陷、流程缺陷、证据缺陷必须分开处理。

### 12.4 Validator 与返工路由

Validation Verdict 必须携带闭集 `failureClass = product / evidence / process / interrupted / unknown / none`，并由 Validator ActorBinding 签署。Conductor 只做 schema 校验和确定性路由；缺失、未知、争议或与 Evidence 不一致时冻结并进入 DISPUTE，不得自行分类。

| 结果 | Conductor 动作 | 下一状态 |
|---|---|---|
| Mechanical Gate fail/skip/error | 归档原始结果，不启动 Reviewer | Builder rework |
| Reviewer REWORK，无 BLOCKER | 生成定向 fixreport 与复验命令；`close` 只能指 finding，不能关闭 milestone | Builder → mechanical regression → targeted Fresh Reviewer recheck |
| Reviewer REWORK，含 BLOCKER | 生成 fixreport 与完整回归要求 | Builder → full mechanical → Fresh Reviewer recheck |
| Reviewer PASS | 封存 Candidate、Verdict、Evidence set | One-time Validator |
| Validator product defect | 归档原始 FAIL；Candidate 必须改变 | Builder → full mechanical → Fresh Reviewer |
| Validator evidence defect | 从受信 runner 重建 Evidence；旧 Validation 不复用 | Mechanical → Fresh Reviewer → new Validator |
| Validator process defect | 冻结机器；不得修产品规避流程缺陷 | 在旧 Governing Gate Definition 下审查 Proposed Definition，批准后仅治理下一 Candidate |
| Validator interrupted/unknown/skipped | fail-closed 归档，不推断结果 | 新的一次性 Validator，仅经 Approver/规则允许 |
| DISPUTE 两轮未决 | 冻结 Builder/Reviewer/Validator | Approver terminal decision |

任何 Candidate 修改都会使旧 Reviewer Verdict 失效；即使只修 MINOR，也必须取得当前 Candidate 的新 Reviewer PASS 后才可进入 Validator。若不需修改产品，Reviewer 应在同一 Candidate 上签发明确 PASS 并把非阻塞项登记 backlog，不能让 REWORK 被机械命令自动升级为 PASS。Conductor 永远只归档、按已签 failureClass 路由和渲染下一份确定性衔接件；它不能生成 PASS、REWORK、分类判断或修复代码。

### 12.5 Governing Gate Definition 与 Gate Run Manifest

用于判断 Candidate N 的 `Governing Gate Definition` 必须在 Candidate 创建前由 stable governance authority 冻结、签名和批准，并保存在 Candidate 无权写入的 governance store/ref。Candidate 仓库可以携带 Proposed Gate Definition，但它只能在旧 Governing Definition 下作为独立 governance Candidate 通过 Mechanical Gate、Reviewer、Validator、Approver 后，治理后续 Candidate；不能审自己。

```yaml
schema_version: aiyuehan-workbench.governing-gate-content/v1
definition_id: <stable-id>
revision: <integer>
status: FROZEN_PENDING_ACTIVATION
effective: false
milestone: M1
execution_class: controlled_build
provider_credentials: synthetic
risk_policy_digest: <sha256>
trust_policy_digest: <sha256>
bootstrap_envelope_policy_digest: <sha256>
gate_assets:
  - path: <repo-relative-path>
    sha256: <sha256>
runner:
  kind: local_external_governance_runner
  toolchain:
    - name: <tool-name>
      path: <absolute-tool-path>
      version: <exact-version>
  network: denied
  governance_preconditions: [<precondition>]
commands:
  - id: typecheck
    argv: [pnpm, typecheck]
    cwd: .
    timeout_seconds: 600
    required: true
evidence_requirements: [<required-evidence>]
skip_policy: fail
clean_tree_required: true
dynamic_external_effects_allowed: false
allowed_effects: [<allowed-effect>]
forbidden_effects: [<forbidden-effect>]
required_outputs: [<required-output>]
forbidden_claims: [<forbidden-claim>]
activation_requirements: [<activation-requirement>]
```

Candidate 固定后，由 Conductor 在 Candidate 外封存 Gate Run Manifest：

```yaml
schema_version: aiyuehan-workbench.gate-run-manifest/v1
manifest_id: <stable-id>
repository_id: <immutable-repository-id>
base_sha: <40-hex>
candidate_sha: <40-hex>
candidate_tree_sha: <40-hex>
governing_definition_digest: <sha256>
gate_assets_digest: <sha256>
conductor_actor_binding_digest: <sha256>
runner_actor_binding_digest: <sha256>
toolchain_digest: <sha256>
commands_digest: <sha256>
environment_digest: <sha256>
evidence_location: <sealed-location>
pre_tree_digest: <sha256>
post_tree_policy: must_equal_pre_tree_and_end_clean
sealed_at: <RFC3339>
signature:
  domain: aiyuehan-workbench:<record-domain>:v1
  payload_profile: UTF8(domain + newline + schema_version + newline) || RFC8785(record_with_signature.value_base64_omitted)
  algorithm: Ed25519
  key_id: <key-id>
  signed_at: <RFC3339>
  value_base64: <base64-signature>
```

Gate Run Manifest 使用 canonical encoding 计算自身 digest。Compiled Gate Plan、Gate Basis、每条 Evidence、Review Verdict、Validation Verdict、Approval 和 Release Packet 必须绑定同一个 Governing Gate Definition digest 与 Gate Run Manifest digest；这既避免 Candidate commit 的哈希自引用，也阻止被审对象降低自己的 Gate。

Builder、Candidate 和 Conductor 均无 Governing Definition 签发/替换权。stable N 持有 N+1 的 definition/envelope authority；Candidate 修改仓库内 proposed definition、package script 或 gate helper 时，当前 Gate 仍使用预先冻结的 governing digest 与 external gate assets，无法解析时直接 BLOCKED。

任何 `<TBD>`、未知字段、缺失 cwd、未固定 runner/toolchain、必需命令 skipped、超时、非零退出码、Evidence 缺失、pre/post tree 不符或最终 dirty tree 都使 Gate BLOCKED。本文不在仓库不存在时虚构具体命令；M0 必须将其替换为真实可执行内容。

### 12.6 GOV-0 Bootstrap Governance Protocol

M-1 至 M4 在 Workbench Gate Authority 产品化前使用外部稳定治理：

- M-1 前先建立 governance-only Git repository/store，保存已批准计划、Governing/Proposed Gate Definitions、Build Log 和 verdict schemas；它不含产品实现，M0 可在同一 repository 中增加产品 skeleton，但 Candidate 无 governing ref 写权限；
- M-1 Candidate 创建前，由用户/外部 stable authority 对首份 Governing Gate Definition digest 和 Bootstrap Development Envelope policy 形成正式 Approval Record；未有该记录不得启动 M-1；
- Builder、Reviewer、Validator、Conductor、Approver 使用独立 Principal/Session；
- 每次开发或判断命令都使用外部 authority 签发的 Bootstrap Development Envelope，绑定 repository、Candidate/subject digest、角色、Session、允许的命令/路径、隔离 profile、synthetic credential、expiry 和审计位置；
- Envelope 禁止 External Runtime Provider 的 Runtime/Task dispatch、客户/生产资源、发布凭据、push/deploy，以及未在 manifest 中声明的网络或文件写入；它不能作为 Capability Snapshot 或产品 Execution Evidence；
- Gate Definition、Gate Run Manifest、Evidence、R<N> Verdict、Validation Verdict 和 Approval 全部落盘且 digest-bound；
- Governing Gate Definition 的任何变更都作为独立 governance Candidate，在旧 definition 下完成全链；生效 revision 只能治理后续 Candidate；
- 判断命令以一次性全新会话执行，权限按角色固定；
- Conductor 维护 append-only Build Log 和衔接件，不判定；
- Reviewer/Validator/Approver 结果使用独立 schema，失败、skip、interrupt 一律 fail-closed；
- DISPUTE、两轮停机、finding basis、复验行和不覆盖归档立即适用；
- M4 完成后，这些记录只作为历史 Artifact 导入并引用，不追溯生成 Workbench Gate Decision。

GOV-0 的 external trust root 至少包含：

```text
ExternalGovernanceTrustPolicySnapshot
  authority identity + eligible roles
  trusted key IDs + algorithms + validity
  rotation/revocation effective times
  canonical schema/version

ExternalGovernanceActorBinding
  Principal + Session + Role
  BootstrapDevelopmentEnvelope digest
  TrustPolicySnapshot digest
  issuedAt + expiresAt + revokedAt
  signature algorithm + key ID + signature

ExternalGovernanceApprovalRecord
  GoverningGateDefinition digest
  BootstrapEnvelopePolicy digest
  Approver ActorBinding digest
  choice + issuedAt
  signature algorithm + key ID + signature
```

Gate Run Manifest、Evidence producer、Reviewer/Validator verdict 和 Approval 必须引用相应 External Governance Actor Binding。缺失、不受信、签名错误、签发时已过期/撤销或角色不合格一律 fail-closed；key 后续轮换不能抹去由当时 trust-policy snapshot 和有效时间证明的历史签名。

GOV-0 是开发治理协议，不是产品 Bootstrap Lifecycle。Bootstrap Development Envelope 是 M-1 至 M4 的外部开发 trust root，不是产品 Execution Grant；它授权的只是 manifest-declared 构建、机械检查和治理判断。M0-Q 起，所有 Workbench-managed Runtime/Task/Projection mutation 必须同时通过产品 Execution Grant；外部 Envelope 不能替代 Grant，也不存在永久 bootstrap bypass。

## 13. M-1：静态上游 Qualification

### 13.1 目标

在任何产品实现和动态任务 dispatch 前，固定候选 External Work Platform 与 External Runtime Provider 的 release/digest，形成可追溯的静态能力假设和动态验证计划。

### 13.2 工作项

- 固定 External Work Platform、External Runtime Provider、`external-platform-cli`、runtime-provider bridge 和 Verifier 版本。
- 只读检查官方文档、公开源码、release notes、license 和已知 interface。
- 建立 public interface / internal interface / CLI / unavailable capability 假设矩阵。
- 列出 Agent、Squad、Issue、metadata、status、task、cancel、events、Runtime recovery 的动态 probe。
- 将 Stage Barrier、operation metadata、lookup/adopt、event identity、cursor、cancellation、备份恢复写入 M0-Q failure matrix。
- 取得客户托管、嵌入、归属和品牌条款的书面许可结论。
- 不安装、不认证、不创建 Runtime/Task、不执行 Agent；动态行为一律标为 unproven。

### 13.3 产物

```text
StaticCapabilityAssessment
DynamicQualificationPlan
PinnedReleaseInventory
LicenseDisposition
M-1 Gate Run Manifest + raw evidence
```

### 13.4 Exit Gate

- 每项能力标记 `documented / documented-unsupported / unknown / requires-dynamic-proof`。
- `documented` 不得升级成 `proven`；只有 M0-Q 动态 Evidence 可以产生 Capability Snapshot。
- 所有需要动态验证的能力都有精确 probe、预期结果、失败保留和清理计划。
- M-1 没有任何 Runtime/Task/Agent dispatch。
- 未解决商业许可时，只允许内部实验路线。

## 14. M0：Authority 与 Trust 基线

### 14.1 目标

建立可被治理的仓库、最小权威记录和安全执行前提；不依赖 Workbench 自己管理自己。

### 14.2 工作项

- 初始化 pnpm monorepo、Web/API/Authority Worker/Effect Worker 空应用和 PostgreSQL migrations。
- 建立 `CONTEXT.md`、ADR、Governing/Proposed Gate Definition、Gate Run Manifest、Build Log 和 R<N> verdict 目录；GOV-0 已从仓库外稳定协议开始生效。
- 建立 Workspace、Principal、Membership、Role Contract、Runtime Assignment。
- 建立一个不含客户数据的 `internal/test` Deployment Instance，并把测试 Workspace 纳入该 instance。
- 实现 Execution Grant 最小切片、Grant expiry/revoke 和 synthetic secret 测试。
- 实现 Authority-owned `claim_grant_and_prepare_effect` 数据库 routine 与 effect-worker 最小权限；M0 只对 synthetic effect 做负向验证，不连接任何 External Work Platform 或 External Runtime Provider。
- 建立最小 Context Snapshot、Execution Attempt、Execution Receipt 和 Artifact Reference。
- 建立数据库角色：Authority writer、effect worker、read model、migration；进程凭据分离。
- 建立 CI：format、typecheck、lint、unit、migration、build。
- 建立 Builder/Reviewer/Validator/Conductor/Approver Role Contract。
- 建立 Runtime Isolation Profile 与本地受限测试 Runtime；不连接任何 External Work Platform 或 External Runtime Provider、不创建客户生产资源。

### 14.3 Exit Gate

- 必需机械命令来自 sealed Gate Run Manifest 并全部通过。
- Builder、Reviewer、Validator、Conductor、Approver 使用独立 Principal/Session；执行角色使用独立 Grant。
- 首份 Governing Definition issuer、M-1/M0 verdict 与 Approval 的 bootstrap Actor Bindings/External Approval Record 均通过 root key、trust snapshot、expiry/revocation 验证。
- Builder 无权写 Stage Authorization、main 或 release credential。
- effect worker 无 Authority credential，无法写 Stage Authorization 或 `passed`。
- effect worker 不能直接更新 Grant 或插入 `prepared` External Effect；只能调用原子 claim/prepare routine，revoke/claim race 最多一个成功。
- Grant 过期和 revoke 后执行被拒绝。
- synthetic secret 不出现在日志、Artifact、HTTP 响应或 verdict。
- 越权 mount、host socket、宿主 Secret、未授权 egress、跨 Runtime credential 和 revoke 后继续执行均被动态拒绝。
- migration up/down、备份/恢复最小检查通过。
- Candidate SHA、raw evidence 和最终 clean tree 已封存。

### 14.4 M0-Q：动态 Upstream Protocol Qualification

M0-Q 是 M0 PASS 后、M1 前的强制子 Gate，也是第一次允许的动态上游验证。它只证明固定 upstream release 的协议行为，不给尚未实现的产品 Adapter 发资格。

工作项：

- 使用 disposable test Workspace、synthetic data/credentials 和受限 Runtime Isolation Profile；
- 每个 probe 由 canonical Execution Attempt、Context Snapshot 和 Execution Grant 驱动；
- 使用单独 versioned/signed probe harness，并把 harness digest、协议请求/响应 schema 与 Runtime profile 绑定到每条 Evidence；
- 动态验证安装、认证、Runtime binding、Agent/Squad/Issue/task、metadata/status、cancel、events、recovery 和清理；
- 重放 Stage Barrier + Parent Wake 以及 commit/wake 失败顺序；
- 验证 operation metadata、lookup/adopt、cursor、duplicate events 和 cancellation races；
- 验证升级、备份恢复、固定版本回退；不预设任何 durable implementation 胜出。

产物：

```text
CapabilitySnapshot
ProbeHarnessQualificationReport
UpstreamProtocolEvidence
CleanupEvidence
M0-Q Gate Run Manifest + raw Evidence
```

Exit Gate：

- 每项能力标记 `proven / unsupported / unavailable / not-tested`；`not-tested` 不能当作 supported。
- 每个 `proven` 结论绑定动态 Evidence、固定 upstream release/digest、exact probe-harness digest 和 Runtime Isolation Profile。
- Capability Snapshot 明确声明 `does_not_qualify_product_adapter: true`；产品 Adapter 必须在 M1-Q 重新验证。
- 清理 Evidence 证明测试资源和 credential 已销毁。
- 所有生产需要的 unsupported 能力已有 Workbench-owned fallback 或明确 kill criterion。
- M0-Q 未 PASS 时 M1 不得开始。

## 15. M1：Projection / Execution Golden Slice

### 15.1 目标

在 M0-Q PASS 后、不启用自动 Stage promotion 的情况下，完成一个可恢复的外部执行闭环。

### 15.2 M1-A：实现工作项

- Projection module 与 External Work Platform/in-memory adapters。
- Execution module 与 External Runtime Provider/deterministic adapters。
- External Effect Lifecycle、outbox、dispatch lease、uncertain、lookup/adopt。
- normalized events、sequence/cursor、Timeline 读模型。
- cancel、Runtime offline、worker restart 和 duplicate event。
- Execution Receipt 与最小 Artifact 注册。

### 15.3 M1-Q：精确 Adapter Qualification

- 在 M0 `internal/test` Deployment Instance 内，对 exact `ExternalProjectionAdapter` / `ExternalExecutionAdapter` release digests 与各自 in-memory/deterministic adapters 跑同一 provider-neutral contract suite。
- 将 M0-Q Capability Snapshot 作为 upstream 行为基线，但通过真实 production adapter interface 发起动态 probe。
- 对 production adapter、test adapter 与 durable runner 执行 SIGKILL、ACK loss、重复 webhook、cursor loss、cancel race、lookup/adopt 和 External Effect 故障矩阵。
- 验证 `EffectCallResult` fault/retryable 语义；任何可能已发送的路径必须持久化并返回 `uncertain`，不能抛成可盲重试 fault。
- 封存 Deployment Instance revision、exact adapter release digest、Capability Snapshot digest、contract suite digest、Runtime Isolation Profile 和 raw Evidence，产生该 instance 的 Adapter Qualification records/set。

M1-Q 未 PASS 时不得运行 Golden Slice，也不得在 M3 产生引用这些 adapter 的 Qualified Playbook Binding。

### 15.4 Golden Slice

```text
Workbench creates Execution Attempt
  ↓ Execution Grant
Execution.start
  ↓ External Effect Lifecycle
External Runtime Provider task executes
  ↓ normalized events
Execution Receipt + Artifact Reference
  ↓
Read model shows terminal observation
```

### 15.5 Exit Gate

- Golden Slice 使用 M1-Q 已通过的 exact production adapter digests。
- 相同 operationId 不产生重复外部对象。
- “provider success + ACK loss”进入 lookup/adopt 或 uncertain，不盲重试。
- worker 在任意持久化点退出后可恢复。
- duplicate/out-of-order event 不重复终结 Attempt。
- cancel 明确区分 accepted、unsupported、already-terminal、uncertain。
- 原始 External Runtime Provider DTO 不泄漏到领域 module。
- Grant claim/use-budget/`prepared` 在一个 routine transaction 中提交；effect worker 绕过 routine 的写入被数据库拒绝。
- pre-send fault 与 persisted `uncertain` 可由 contract tests 稳定区分。
- M1 不声称 Stage PASS。

## 16. M2：Agent Registry 与 Projection

### 16.1 目标

AIyuehan Workbench 管理 Role Contract、AgentVersion 和 Runtime Assignment，将协作表示可靠 Projection 到 External Work Platform，并将执行配置绑定到 External Runtime Provider。

### 16.2 工作项

- Agent Definition/Version 与 immutable config digest。
- Role Contract 与 Runtime Assignment 分离。
- Skill/MCP/model/runtime configuration。
- publish、binding、drift、repair、rollback。
- 每个角色独立 Runtime/Grant policy。
- Agent Test Lab 使用 synthetic credentials。

### 16.3 Exit Gate

- 草稿变化不影响已发布版本。
- publish ACK 丢失可 adopt，不重复创建 Agent。
- 外部 drift 被发现并按 policy repair/flag，不静默覆盖。
- rollback 后新 Attempt 使用指定旧版本，历史 Receipt 保持原绑定。
- 一个 Runtime identity 不同时承担 Builder 与 Reviewer/Validator 冲突职责。

## 17. M3：Artifact/Evidence 脊柱与 Compiled Playbook

### 17.1 目标

先建立可信治理输入，再允许 Gate Authority 消费。

### 17.2 工作项

- CAS、Artifact Reference、Artifact Edge、Evidence Manifest。
- Context Snapshot、Execution Receipt 完整版本。
- Review/Validation Verdict schemas 和身份 Attestation。
- retention pin、terminal governance retention、governed purge/tombstone lifecycle。
- strict Playbook authoring schema。
- Domain Pack Trust Policy、Manifest 最小 contract、声明式 migration、signature、compatibility、resource/data policy 与 qualification suite。
- Portable Compiled Playbook 与 policy/Domain Pack digests。
- 消费 M0-Q Capability Snapshot 与 M1-Q exact Adapter Qualification set，在 M0 internal/test Deployment Instance 上产生 Qualified Playbook Binding。
- DAG、Artifact 类型、风险、角色、Approval、route 验证。
- built-in deterministic rules registry。
- unknown rule/field fail-closed。

### 17.3 Exit Gate

- 同内容可以被不同 Workspace/Run 合法引用且 lineage 不混淆。
- blob 损坏、subject mismatch、producer 不可信被拒绝。
- YAML 未知字段不会静默丢失。
- 环、悬空 route、不可达终态、Artifact 断链、高风险无 Approval 编译失败。
- Compiled Playbook 可确定性重编译为同 digest。
- Workflow Run 无 exact Qualified Playbook Binding、跨 Deployment Instance/Workspace、binding 过期/撤销或 adapter/profile/pack revision 不匹配时不能启动或产生新 External Effect。
- 环境 capability、exact Adapter Qualification set 或 Projection Profile 变化只产生新 Qualified Playbook Binding，不改变 portable digest，也不静默替换运行中 binding。
- 未受信签名、不兼容、依赖缺失、任意 SQL/code migration、不可 rollback 或声明新资源但未 qualification 的 Domain Pack 被拒绝。
- open Gate pin 可转换为 terminal governance pin；active pin 下 GC 删除失败；获批 purge 留下 tombstone/attestation，Raw Capture retention 与 redacted Evidence 分离。
- 所有判断输入能追溯到 Candidate 和 producer identity。

## 18. M4：Gate Authority 与受控 Workflow

### 18.1 目标

把工作流从约定升级为不可绕过的权威状态机。

### 18.2 工作项

- Gate Authority 两条命令 interface。
- Gate Basis、Approval Target、Decision Input digest chain。
- Workflow/Stage/Gate Input 对 exact Qualified Playbook Binding 的强制绑定和失效策略。
- Gate Input Revision、Gate Decision、Stage Authorization。
- Gate Case、多 Approval Request/Approval lifecycle、partial/last/reject/expiry routes。
- Governing Gate Definition 与 Gate Run Manifest digest binding；Candidate-local proposed definition 不得治理自身。
- Stage DAG activation 和 rework route。
- Gate transaction、outbox 和 read model。
- Projection 对外状态，但不允许反向授权。
- 数据库角色与不可达状态约束。

### 18.3 Exit Gate

- 空 checks、missing、skip、error、unknown、unsupported 均不能 PASS。
- Candidate/Evidence/Review/Validation/Approval subject 不一致不能 PASS。
- 身份冲突不能 PASS。
- ActorAuthorityBasis 缺失、kind/字段不一致、bootstrap signature/key/trust snapshot 不受信、签发时过期/撤销时不能 PASS。
- Approval 过期、旧 Packet、错误环境、重复 nonce 不能 PASS。
- 两个并发 settle 最多产生一个 PASS Authorization。
- 并发 approve/reject 最多一个终局 disposition；nonce 只消费一次。
- partial approve 保持 `needs_approval`，last approve 才可 PASS；early reject/expiry 原子 supersede sibling Requests 并走 `on_reject`。
- Workflow cancelling/cancelled 或 Stage state version 变化使旧 settle/approval stale。
- transaction 任一步失败全部回滚。
- needs_approval、rework、blocked 的 Decision/Request/Stage/event/outbox 写集合保持原子。
- 开放 Gate Case 的 CAS retention pin 缺失或损坏时不能 PASS。
- PASS/FAIL/BLOCKED 后 terminal governance pin 仍保护可复验证据；未经 purge Approval 不可删除。
- Qualified Playbook Binding 失效、被撤销或 scope mismatch 后，未结算 Gate 与新 External Effect fail-closed。
- Candidate 修改 proposed Gate Definition、package script 或 gate helper 时，当前 Gate 仍使用 pre-frozen governing digest；替换/缺失直接 BLOCKED。
- commit 成功但响应丢失时重放原结果。
- External Work Platform 被手工设为 `done` 不改变 Workbench Stage。
- Projection 永久失败不破坏已提交权威状态。
- effect worker credential 直接写 Stage Authorization、Gate Decision 或 `passed` 必须被数据库拒绝。

## 19. M5：Verifier 与独立开发 Gate

### 19.1 目标

将 GOV-0 已经使用的 Best-of-N、Evidence audit、Fresh Reviewer、One-time Validator 和 Conductor 闭环产品化，不改变既有治理语义。

### 19.2 工作项

- Verifier select/compare/track adapter。
- criteria/prompt/model/provider/seed version binding。
- Absolute Acceptance Checks。
- Builder self-report 与 fixreport。
- Fresh Reviewer 命令、R<N> verdict schema、finding IDs。
- One-time Validator 命令、固定 Candidate 和 fail-closed raw verdict。
- Conductor 衔接件、Build Log、DISPUTE 和两轮停机规则。
- Raw Capture、redacted Evidence 与 Redaction Attestation 验证。
- Verifier instruction/data 隔离和 adversarial Evidence corpus。

### 19.3 Exit Gate

- 三个不合格候选可以全部被拒绝，不强选 winner。
- Verifier 不可用、无所需模型能力或数据不允许出站时 fail-closed。
- Reviewer 与 Builder 身份、Session 和 Grant 独立。
- Validator 只在 Reviewer PASS 后执行一次，失败或 skipped 即不通过。
- Candidate 变化使旧 Review、Validation 和 Approval 全部失效。
- 当前 Candidate 没有新 Reviewer PASS 时，Validator、Approver 与 milestone closure 均不可达；任何 REWORK 修复后必须重新 Reviewer recheck。
- Validator failureClass 必须是签名闭集；Conductor 只做确定性路由，unknown/dispute 冻结。
- verdict 历轮不可覆盖，finding 有依据和复验行。
- prompt injection 不能改变 deterministic rule、Absolute Acceptance Check 或 Gate disposition。
- 产品化记录与 GOV-0 schema/语义逐项对账，历史 GOV-0 Artifact 不被改写为追溯 Gate Decision。

## 20. M6：Release、Deployment 与 Observe

### 20.1 目标

完成固定 Candidate 到获批 `internal/test` 目标环境的发布闭环；`qualification` 由 M7 专项 Gate 启用，customer target 在 M7 qualification 前保持禁止。

### 20.2 工作项

- Release Packet、Approval Target 和 target environment binding。
- Release Execution Grant 的 one-shot/short-lived policy。
- production/test deployment adapters 的 provider-neutral contract suite、exact instance-scoped Adapter Qualification、smoke Evidence 和 rollback intent。
- Deployment Evidence 与 approved/deployed digest 对账。
- observation window、health/SLO Evidence 和自动 revoke。

### 20.3 Exit Gate

- 未批准、过期、撤销、Packet 变化或环境错误时无法取得 Release Grant。
- 部署只能使用 approved Candidate digest。
- Release Packet 必须绑定控制 instance 中已通过 qualification 的 exact deployment adapter release/qualification digests。
- Smoke 必需项 skipped/error 即发布 Gate 不通过。
- rollback 是新的受控 intent，不复用旧裸凭据。
- Deployment Evidence 闭环绑定 Release Packet、identity、environment 和实际 digest。
- M7 前请求 `qualification/customer` target 必须 fail-closed；不得通过改名伪装为 internal/test。

## 21. M7：客户隔离与恢复加固

### 21.1 目标

证明共享内核可以运行两个完全隔离的客户实例。

### 21.2 工作项

- 通过两份获批 Qualification Grant 创建 Customer A/B `qualification_pending` provisional Deployment Instances；Grant 绑定 versioned deployment profile/resource manifest、kernel、exact adapter release digests、required qualification suites、active Domain Pack set 和 region。
- provisional A/B 使用 synthetic data/credentials，独立 DB、CAS、queue/search namespace、keys、logs、backups、runtimes，且无客户流量或生产 Secret。
- 在每个 provisional instance 内重跑 exact Adapter Qualification；跨实例复用 M1-Q qualification ID 必须被拒绝。
- SSO/RBAC qualification。
- network allowlist、mount、Secret Broker、audit retention。
- backup/restore、key rotation、runtime destruction。
- 跨客户检索、Artifact、event、credential、log 负向测试。
- 第二客户使用配置/Domain Pack 部署，Shared Kernel 不改动。
- 新 Domain Pack resource class 触发隔离 qualification 失效和重跑。
- 失败、过期或撤销的 qualification 自动销毁 provisional resources 并封存 Cleanup Evidence；禁止原地 relabel。
- 生成 Customer Delivery Qualification，绑定 license、data residency、isolation、active packs、kernel/adapters/region 与 exact deployment profile digest。
- Qualification PASS 后，以新的 customer Release Packet、Approval 和 Release Grant 创建真实 Customer Deployment Instance，并核对 intended instance identity/profile；不复用 Qualification Grant。

### 21.3 Exit Gate

- 所有跨客户读取和引用均被拒绝并产生审计记录。
- Runtime 销毁后凭据失效。
- backup restore 后 digest 和 audit chain 可验证。
- 第二客户部署不含 customer-specific kernel patch。
- 商业许可、数据驻留和运维责任有书面 disposition。
- provisional instance relabel、真实客户数据/Secret、失败后残留资源和 profile mismatch 均被 Gate 拒绝。
- 只有有效 Customer Delivery Qualification 才允许后续 `customer` Release Grant。

## 22. M8：Bootstrap Lifecycle 与 Self-hosting

### 22.1 目标

让稳定 Workbench 版本管理候选版本，而不是让候选系统批准自己。

### 22.2 Bootstrap 状态

```text
unqualified → qualified → secured → seeded → verified
                                      │          │
                                      └→ failed └→ cutover_ready
                                                   │
                                             cutover / rollback
```

### 22.3 工作项

- versioned seed manifest。
- resumable Bootstrap ledger。
- qualification、secure、seed、verify、cutover、rollback。
- drift/adopt/cleanup。
- stable version N 管理 candidate N+1。
- 外部 CI/Approver 保留最终升级权。
- Bootstrap、managed、self-hosted 三种明确模式。

### 22.4 Golden Run

```text
Stable N creates governed Candidate N+1
  ↓
Intent → Design → Plan → Build
  ↓ deliberate CI failure
Gate REWORK → fix → deterministic verify
  ↓
Fresh Review → One-time Validation
  ↓
Human Approval → Release Grant
  ↓
Canary → Smoke → Observe → Cutover or Rollback
```

### 22.5 Exit Gate

- candidate N+1 无权修改或伪造其 Gate/Approval/Validator 记录。
- Bootstrap 在每个持久化点中断后可 resume 或 rollback。
- 重复运行不会重复创建或错误 adopt 资源。
- cutover 前后有可验证版本和数据快照。
- stable N 可以拒绝、回滚和归档 N+1。
- 完成后才允许把 seed 包升级为可执行 Bootstrap artifact。

## 23. M9：Domain Pack 扩展

### 23.1 顺序

顺序：

```text
software-development hardening
→ self-media
→ meeting/todo
→ knowledge/memory
→ CRM/clientops
```

M3 已定义 Domain Pack contract；M9 只增加经过签名、compatibility 和 qualification 的新 Pack。Domain Pack 可以增加术语、Artifact kinds、Playbook、built-in rule 配置、resource classes 和 Projection declarations；不能削弱 Workbench Authority、immutable binding、separation-of-duty、Execution Grant 或 Gate atomicity。

### 23.2 每个 Pack 的工作项

- 在 Domain Pack Trust Policy 下签发 canonical Manifest，并固定 signer/key/trust snapshot。
- 验证 namespace/schema/rule/Artifact collision 与依赖图。
- 对同一输入执行 deterministic compile 和 qualification。
- 对声明式 migration 执行 dry-run、backup、apply、rollback/restore 与 Migration Receipt 核对。
- 对新增 resource class 重跑 Deployment Instance isolation 与 Customer Delivery Qualification。
- 验证 signer/pack revocation、supersession、downgrade 和 rollback route。

### 23.3 Exit Gate

- 未受信、过期、撤销或 signature/digest 不匹配的 Pack 不能 compile/qualify。
- Pack 不能执行任意代码/SQL，也不能取得 kernel/Authority credential。
- namespace collision、不可逆 migration、缺失 restore proof 或 dependency drift 一律 fail-closed。
- 新 Pack 不改变相同输入的既有 Compiled Playbook 历史 digest；使用它必须形成新 version/binding。
- 新 resource class 的双实例 isolation regression 和 Customer Delivery Qualification 已通过。
- revoke/rollback 后新 Workflow 不再使用旧 Pack，历史 Run/Decision 仍可验证。

## 24. 仓库结构建议

```text
AIyuehan-workbench/
├── CONTEXT.md
├── apps/
│   ├── web/
│   ├── api/
│   ├── authority-worker/
│   └── effect-worker/
├── packages/
│   ├── compiled-playbook/
│   ├── gate-authority/
│   ├── projection/
│   ├── execution/
│   ├── execution-grant/
│   ├── artifact-evidence/
│   ├── context-receipt/
│   ├── identity-role/
│   ├── db/
│   ├── read-models/
│   └── _internal/
│       └── external-effect-lifecycle/
├── services/
│   └── verifier/
├── adapters/
│   ├── external-platform/
│   ├── git/
│   ├── ci/
│   ├── identity/
│   ├── secrets/
│   └── deploy/
├── playbooks/
├── domain-packs/
├── docs/
│   ├── adr/
│   ├── gates/
│   ├── verdicts/
│   ├── build/
│   └── runbooks/
└── infra/
    ├── migrations/
    ├── runtime-images/
    └── customer-instance/
```

External Effect Lifecycle 使用私有物理 package 维持 locality，但不从 Projection/Execution 的公共入口导出。未来新调用者必须先通过 deletion test，不能因为测试便利而扩大 seam。

## 25. 测试策略

### 25.1 Interface 是测试面

- Compiled Playbook tests 穿过 `compile`。
- Gate tests 穿过 `settleStage/answerApproval`。
- Projection tests 对 External Work Platform 与 in-memory adapters 跑相同 contract suite。
- Execution tests 对 External Runtime Provider 与 deterministic adapters 跑相同 contract suite。
- Execution Grant tests 穿过 `issue/revoke`。
- 不保留只验证 shallow pass-through 的旧测试。

### 25.2 Gate 负向矩阵

```text
empty checks
missing / skip / error / unsupported
Candidate mismatch
Evidence stale or untrusted
Reviewer / Validator / Approver identity conflict
Approval expired / replayed / wrong target
Candidate changed while awaiting approval
Candidate edits proposed Gate Definition/gate helper while governing digest stays fixed
concurrent settle
concurrent approve/reject
partial approval / last approval / early reject / expiry race / duplicate answer
Workflow/Stage cancelled during approval
Stage state version changes without Gate input change
Qualified Playbook Binding revoked/expired/scope mismatch
CAS retention pin missing/corrupt
terminal retention GC attempt / governed purge tombstone
transaction failure at every write
commit response lost
External Work Platform done without authorization
Projection permanent failure
```

### 25.3 External Effect 故障矩阵

```text
worker SIGKILL before send
provider success + ACK loss
duplicate dispatch lease
duplicate/out-of-order events
cursor loss and resume
cancel vs terminal race
provider offline / timeout / partial response
lookup unsupported
manual uncertain resolution
pre-send retryable fault vs persisted uncertain
Grant claim vs revoke race
effect worker direct Grant/prepared write denied
```

### 25.4 安全矩阵

```text
cross-Workspace reference
wrong Role Assignment
expired/revoked Grant
shared Builder/Reviewer identity
ActorAuthorityBasis missing/mixed/untrusted/expired/revoked
unauthorized Runtime/mount/egress
Secret in prompt/log/Artifact/HTTP response
host/Docker socket access
Grant rebound to another Execution Attempt
Grant one-shot double claim
Raw Capture/redaction attestation mismatch
Verifier prompt injection/adversarial Evidence
Release Grant before Approval
customer Release Grant before Customer Delivery Qualification
Qualification Grant with customer data/production Secret
qualification_pending instance relabel attempt
failed qualification cleanup / profile mismatch
wrong customer instance
```

## 26. 项目 Definition of Done

Workbench 开发内核只有同时满足以下条件才完成：

1. M-1 静态 assessment、M0-Q upstream Capability Snapshot、M1-Q exact Adapter Qualification set 和许可 disposition 已完成。
2. AIyuehan Workbench 可创建并观察 Workflow Run，但 External Work Platform 状态不能推进权威 Stage。
3. 所有 Workbench-managed 真实执行使用有效 Execution Grant；M-1 至 M4 的开发/治理命令还必须使用受限 Bootstrap Development Envelope，二者不能互相替代。
4. Role Contract 与 Runtime Assignment 分离并可版本化。
5. Projection 与 Execution 通过独立 interface 和两套 adapters 验证；production adapter 的 exact digest 已通过 M1-Q。
6. 外部 ACK 丢失、重复事件、cancel race 和 worker restart 可恢复。
7. Artifact、Evidence、Context Snapshot、Execution Receipt 和 lineage 完整。
8. Playbook 只通过 Compiled Playbook 编译，并通过 exact Qualified Playbook Binding 启动 Workflow。
9. Gate Authority 是唯一 Stage promotion authority。
10. PASS、Stage Authorization、Stage 状态、event、outbox 原子提交。
11. skip/error/unknown/untrusted Evidence 无法 PASS。
12. Builder、Reviewer、Validator、Conductor、Approver 职责分离。
13. Candidate 变化自动失效 Review、Validation 和 Approval。
14. Release Packet、target environment、Grant 和 Deployment Evidence 闭环。
15. 两个客户实例完全隔离且 Shared Kernel 无客户 patch。
16. stable N 成功治理 N+1 Golden Run 和 rollback。
17. 所有 milestone 有 pre-Candidate Governing Gate Definition、sealed Gate Run Manifest、Evidence/attestation、fixed SHA 和 clean tree；Candidate 无法降低自己的 Gate。
18. 历轮 verdict、fixreport、DISPUTE 和 Approver 决定不可覆盖。
19. Authority/effect process credentials 分离，effect worker 无法写 Stage Authorization。
20. customer Release Grant 必须绑定有效 Customer Delivery Qualification。
21. Grant claim/use-budget 与 External Effect `prepared` 原子提交，effect worker 无直接写权限。
22. Gate Decision 的 redacted Evidence 在 governance retention 期内可复验；purge 有独立 Approval 和 tombstone。
23. partial/last/reject Approval、Reviewer recheck 与 Validator failure routing 都不可绕过。
24. GOV-0 issuer、Reviewer、Validator、Approver 具有可历史验证的 external trust-policy snapshot、Actor Binding 与签名 Approval Record。

## 27. 前序 finding disposition 与关闭计划

`DESIGN_CLOSED` 只表示 V1.2 已给出明确设计处置；在目标 milestone 的动态 Evidence 出现前均保持 `IMPLEMENTATION_OPEN`。

| Finding ID | Finding | 当前状态 | 目标 | 关闭所需证明 |
|---|---|---|---|---|
| F-001 | Hard Gate 只是 detective | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M4 | 并发、取消、外部 done、事务故障负向 Evidence |
| F-002 | 上游 interface/Adapter 未证明 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M-1 + M0-Q + M1-Q | 固定 release 的 Capability Snapshot、exact Adapter Qualification 与 raw probes |
| F-003 | 前序 seed 归档不可执行 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M8 | interruption/resume/replay/cutover/rollback Golden Run |
| F-004 | Gate/Evidence schema 可假 PASS | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M3–M4 | fail-closed Gate matrix 与数据库不可达状态测试 |
| F-005 | exactly-once 误述 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M1 | ACK-loss lookup/adopt/uncertain 故障 Evidence |
| F-006 | 安全和租户过晚 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M0 + M7 | Runtime isolation negative tests 与双客户 qualification |
| F-007 | Reviewer/Validator/Conductor 混用 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | GOV-0 + M5 | 独立 identity/session、当前 Candidate Reviewer PASS、R<N> verdict 和 signed failure routing |
| F-008 | 里程碑依赖倒置 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | 全计划 | 每 milestone dependency Gate PASS |
| F-009 | provider execution interface 宽而 provider-shaped | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M1–M2 | Projection/Execution 双 adapter contract suites |
| F-010 | Playbook/Domain Pack schema 与 trust 漂移 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M3 + M9 | strict compile、signer/migration、binding 与 qualification negative suite |
| F-011 | Release Packet/Approval 绑定不足 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M6–M7 | wrong packet/env/expiry/customer qualification tests |
| F-012 | Verifier 被过度授权 | `DESIGN_CLOSED / IMPLEMENTATION_OPEN` | M5 | advisory-only、prompt-injection、data-egress tests |

## 28. 下一授权点

V1.2 调整到此只形成设计文件。下一步在获得明确实施授权前，只允许：

- 复核本文和 ADR；
- 修改术语、module 归属、interface 和 milestone；
- 将本文标记为 `APPROVED_FOR_IMPLEMENTATION` 或继续 `REWORK`。

以下行为尚未授权：创建仓库实现、执行本文列出的开发或治理命令、执行外部归档中的任何脚本、安装或配置 External Work Platform / External Runtime Provider、创建 Workspace/Agent/Squad、生成客户资源、提交、推送、部署或发布。
