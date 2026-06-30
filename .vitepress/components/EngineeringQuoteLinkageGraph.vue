<template>
  <div class="eq-graph-wrap">
    <div class="graph-header">
      <span class="graph-badge-dag">DAG</span>
      <span class="graph-badge-ent">⟳ 纠缠</span>
      <span class="graph-title">工程报价单联动依赖图</span>
      <span class="graph-hint">53 节点 · 7 层 DAG · 2 对有环纠缠</span>
    </div>
    <div class="graph-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        class="eq-flow"
      >
        <template #node-field="{ data }">
          <div class="field-node" :class="data.group">
            <div class="fn-dot"></div>
            <div class="fn-label">{{ data.label }}</div>
            <div v-if="data.sub" class="fn-sub">{{ data.sub }}</div>
          </div>
        </template>
        <template #node-entangle="{ data }">
          <div class="entangle-node">
            <div class="en-ring">⟳</div>
            <div class="en-label">{{ data.label }}</div>
            <div class="en-sub">{{ data.sub }}</div>
          </div>
        </template>
      </VueFlow>
    </div>
    <div class="graph-legend">
      <span class="leg-item"><span class="leg-dot project"></span>项目基础</span>
      <span class="leg-item"><span class="leg-dot wbs"></span>WBS 工作分解</span>
      <span class="leg-item"><span class="leg-dot costs"></span>成本汇总</span>
      <span class="leg-item"><span class="leg-dot pricing"></span>报价计算</span>
      <span class="leg-item"><span class="leg-dot resource"></span>资源规划</span>
      <span class="leg-item"><span class="leg-dot payment"></span>付款方案</span>
      <span class="leg-item"><span class="leg-dot entangle-dot"></span>⟳ 双向纠缠</span>
      <span class="leg-item"><span class="leg-edge dag-edge"></span>DAG 依赖</span>
      <span class="leg-item"><span class="leg-edge ent-edge"></span>纠缠传播</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// ── 布局参数 ──────────────────────────────────────────────────────────────────
// 主链（上半部分 y: 0~540）：项目类型 → 费率 → WBS人天/成本 → 成本汇总 → 报价 → 税 → 付款
// 资源规划（下半部分 y: 620~780）：总人天 → 纠缠(工期↔团队) → 人天单价/日均收入

const nodes = [
  // ── Layer 0: 项目输入 (x=0) ──────────────────────────────────────────────
  { id: 'projectType',     type: 'field', position: { x: 0,    y: 20  }, data: { label: '项目类型',     group: 'project', sub: '软件/集成/咨询/运维' } },
  { id: 'clientIndustry',  type: 'field', position: { x: 0,    y: 90  }, data: { label: '客户行业',     group: 'project', sub: '金融/制造/政府/零售' } },

  // ── Layer 1: 费率推导 (x=195) ────────────────────────────────────────────
  { id: 'pmRate',          type: 'field', position: { x: 195,  y: 0   }, data: { label: 'PM 日费率',    group: 'project', sub: '← 项目类型' } },
  { id: 'devRate',         type: 'field', position: { x: 195,  y: 55  }, data: { label: '开发 日费率',  group: 'project', sub: '← 项目类型' } },
  { id: 'qaRate',          type: 'field', position: { x: 195,  y: 110 }, data: { label: 'QA 日费率',    group: 'project', sub: '← 项目类型' } },
  { id: 'mgmtRate',        type: 'field', position: { x: 195,  y: 165 }, data: { label: '管理费率',     group: 'project', sub: '← 项目类型' } },
  { id: 'riskRate',        type: 'field', position: { x: 195,  y: 220 }, data: { label: '风险储备率',   group: 'project', sub: '← 项目类型' } },
  { id: 'taxRate0',        type: 'field', position: { x: 195,  y: 280 }, data: { label: '增值税率',     group: 'project', sub: '← 客户行业' } },

  // ── Layer 2: WBS 人天 (x=420) ─────────────────────────────────────────────
  { id: 'pm1',             type: 'field', position: { x: 420,  y: 0   }, data: { label: '需求分析·PM',  group: 'wbs',     sub: '用户录入' } },
  { id: 'dev1',            type: 'field', position: { x: 420,  y: 45  }, data: { label: '需求分析·开发',group: 'wbs',     sub: '用户录入' } },
  { id: 'qa1',             type: 'field', position: { x: 420,  y: 90  }, data: { label: '需求分析·QA',  group: 'wbs',     sub: '用户录入' } },
  { id: 'pm2',             type: 'field', position: { x: 420,  y: 155 }, data: { label: '系统设计·PM',  group: 'wbs',     sub: '用户录入' } },
  { id: 'dev2',            type: 'field', position: { x: 420,  y: 200 }, data: { label: '系统设计·开发',group: 'wbs',     sub: '用户录入' } },
  { id: 'qa2',             type: 'field', position: { x: 420,  y: 245 }, data: { label: '系统设计·QA',  group: 'wbs',     sub: '用户录入' } },
  { id: 'pm3',             type: 'field', position: { x: 420,  y: 310 }, data: { label: '开发实施·PM',  group: 'wbs',     sub: '用户录入' } },
  { id: 'dev3',            type: 'field', position: { x: 420,  y: 355 }, data: { label: '开发实施·开发',group: 'wbs',     sub: '用户录入' } },
  { id: 'qa3',             type: 'field', position: { x: 420,  y: 400 }, data: { label: '开发实施·QA',  group: 'wbs',     sub: '用户录入' } },

  // ── Layer 3: 阶段小计 (x=640) ────────────────────────────────────────────
  { id: 'phase1Days',      type: 'field', position: { x: 640,  y: 30  }, data: { label: '需求分析人天', group: 'wbs',     sub: 'pm1+dev1+qa1' } },
  { id: 'phase1Cost',      type: 'field', position: { x: 640,  y: 80  }, data: { label: '需求分析成本', group: 'wbs',     sub: '人天×费率' } },
  { id: 'phase2Days',      type: 'field', position: { x: 640,  y: 180 }, data: { label: '系统设计人天', group: 'wbs',     sub: 'pm2+dev2+qa2' } },
  { id: 'phase2Cost',      type: 'field', position: { x: 640,  y: 230 }, data: { label: '系统设计成本', group: 'wbs',     sub: '人天×费率' } },
  { id: 'phase3Days',      type: 'field', position: { x: 640,  y: 330 }, data: { label: '开发实施人天', group: 'wbs',     sub: 'pm3+dev3+qa3' } },
  { id: 'phase3Cost',      type: 'field', position: { x: 640,  y: 380 }, data: { label: '开发实施成本', group: 'wbs',     sub: '人天×费率' } },

  // ── Layer 4: 成本汇总 (x=870) ────────────────────────────────────────────
  { id: 'totalPersonDays', type: 'field', position: { x: 870,  y: 15  }, data: { label: '合计投入人天', group: 'costs',   sub: 'Σ三阶段人天' } },
  { id: 'laborCost',       type: 'field', position: { x: 870,  y: 85  }, data: { label: '总人力成本',   group: 'costs',   sub: 'Σ三阶段成本' } },
  { id: 'hardwareCost',    type: 'field', position: { x: 870,  y: 195 }, data: { label: '硬件采购成本', group: 'costs',   sub: '用户录入' } },
  { id: 'travelCost',      type: 'field', position: { x: 870,  y: 250 }, data: { label: '差旅及其他',   group: 'costs',   sub: '用户录入' } },

  // ── Layer 5: 管理费/风险储备 (x=1080) ────────────────────────────────────
  { id: 'managementFee',   type: 'field', position: { x: 1080, y: 55  }, data: { label: '管理费',       group: 'costs',   sub: '人力成本 × 管理费率' } },
  { id: 'riskBuffer',      type: 'field', position: { x: 1080, y: 200 }, data: { label: '风险储备金',   group: 'costs',   sub: '直接成本 × 风险率' } },

  // ── Layer 6: 总成本 (x=1280) ─────────────────────────────────────────────
  { id: 'totalCost',       type: 'field', position: { x: 1280, y: 120 }, data: { label: '项目总成本',   group: 'costs',   sub: 'Σ劳动+管理+采购+差旅+风险' } },

  // ── ⟳ 纠缠区 1：利润率 ↔ 最终报价 (x=1480~1680) ─────────────────────────
  { id: 'marginRate',      type: 'field', position: { x: 1480, y: 60  }, data: { label: '目标利润率 ⟳', group: 'pricing', sub: '用户录入/纠缠更新' } },
  { id: 'quotePrice',      type: 'field', position: { x: 1480, y: 180 }, data: { label: '最终报价 ⟳',   group: 'pricing', sub: '用户录入/纠缠更新' } },
  { id: 'entangle1',       type: 'entangle', position: { x: 1590, y: 105 }, data: { label: '纠缠 ①',    sub: 'margin × cost = quote' } },

  // ── Layer 7: 报价下游 (x=1720) ───────────────────────────────────────────
  { id: 'suggestedQuote',  type: 'field', position: { x: 1720, y: 0   }, data: { label: '建议报价',     group: 'pricing', sub: 'cost × (1 + margin%)' } },
  { id: 'marginAmount',    type: 'field', position: { x: 1720, y: 60  }, data: { label: '利润额',       group: 'pricing', sub: 'quotePrice - totalCost' } },
  { id: 'taxAmount',       type: 'field', position: { x: 1720, y: 135 }, data: { label: '增值税额',     group: 'pricing', sub: 'quotePrice × 税率' } },

  // ── Layer 8: 含税总价 (x=1940) ───────────────────────────────────────────
  { id: 'totalWithTax',    type: 'field', position: { x: 1940, y: 70  }, data: { label: '含税总价',     group: 'pricing', sub: 'quotePrice + taxAmount' } },

  // ── Layer 9: 付款方案 (x=2160) ───────────────────────────────────────────
  { id: 'depositAmount',   type: 'field', position: { x: 2160, y: 10  }, data: { label: '签约首付',     group: 'payment', sub: '含税总价 × 首付比例' } },
  { id: 'milestone',       type: 'field', position: { x: 2160, y: 80  }, data: { label: '里程碑中期款', group: 'payment', sub: '含税总价 × 40%' } },
  { id: 'finalPayment',    type: 'field', position: { x: 2160, y: 150 }, data: { label: '验收尾款',     group: 'payment', sub: '总价 - 首付 - 中期' } },

  // ── 资源规划子图 (y=490~620) ─────────────────────────────────────────────
  // totalPersonDays 已在上方，从这里延伸到下方资源规划
  { id: 'efficiency',      type: 'field', position: { x: 870,  y: 490 }, data: { label: '团队并行效率', group: 'resource', sub: '0.7 / 0.8 / 0.9' } },
  { id: 'duration',        type: 'field', position: { x: 1100, y: 460 }, data: { label: '项目工期 ⟳',   group: 'resource', sub: '用户录入/纠缠更新' } },
  { id: 'teamSize',        type: 'field', position: { x: 1100, y: 570 }, data: { label: '团队规模 ⟳',   group: 'resource', sub: '用户录入/纠缠更新' } },
  { id: 'entangle2',       type: 'entangle', position: { x: 1230, y: 498 }, data: { label: '纠缠 ②',   sub: '工期 × 人数 × 效率 = 总人天' } },
  { id: 'dailyRevenue',    type: 'field', position: { x: 1480, y: 460 }, data: { label: '日均合同额',   group: 'resource', sub: 'quotePrice ÷ 工期' } },
  { id: 'personDayRate',   type: 'field', position: { x: 1480, y: 570 }, data: { label: '人天单价',     group: 'resource', sub: 'quotePrice ÷ 总人天' } },
]

const edges = [
  // ── 项目类型 → 费率 ───────────────────────────────────────────────────────
  { id: 'e-pt-pmR',   source: 'projectType',    target: 'pmRate',          animated: false },
  { id: 'e-pt-devR',  source: 'projectType',    target: 'devRate',         animated: false },
  { id: 'e-pt-qaR',   source: 'projectType',    target: 'qaRate',          animated: false },
  { id: 'e-pt-mgR',   source: 'projectType',    target: 'mgmtRate',        animated: false },
  { id: 'e-pt-rkR',   source: 'projectType',    target: 'riskRate',        animated: false },
  { id: 'e-ci-txR',   source: 'clientIndustry', target: 'taxRate0',        animated: false },

  // ── 费率 → WBS 阶段成本 ───────────────────────────────────────────────────
  { id: 'e-pmR-p1c',  source: 'pmRate',   target: 'phase1Cost', animated: false },
  { id: 'e-devR-p1c', source: 'devRate',  target: 'phase1Cost', animated: false },
  { id: 'e-qaR-p1c',  source: 'qaRate',   target: 'phase1Cost', animated: false },
  { id: 'e-pmR-p2c',  source: 'pmRate',   target: 'phase2Cost', animated: false },
  { id: 'e-devR-p2c', source: 'devRate',  target: 'phase2Cost', animated: false },
  { id: 'e-qaR-p2c',  source: 'qaRate',   target: 'phase2Cost', animated: false },
  { id: 'e-pmR-p3c',  source: 'pmRate',   target: 'phase3Cost', animated: false },
  { id: 'e-devR-p3c', source: 'devRate',  target: 'phase3Cost', animated: false },
  { id: 'e-qaR-p3c',  source: 'qaRate',   target: 'phase3Cost', animated: false },

  // ── WBS 录入 → 阶段人天 ───────────────────────────────────────────────────
  { id: 'e-pm1-p1d',  source: 'pm1',  target: 'phase1Days', animated: false },
  { id: 'e-dev1-p1d', source: 'dev1', target: 'phase1Days', animated: false },
  { id: 'e-qa1-p1d',  source: 'qa1',  target: 'phase1Days', animated: false },
  { id: 'e-pm2-p2d',  source: 'pm2',  target: 'phase2Days', animated: false },
  { id: 'e-dev2-p2d', source: 'dev2', target: 'phase2Days', animated: false },
  { id: 'e-qa2-p2d',  source: 'qa2',  target: 'phase2Days', animated: false },
  { id: 'e-pm3-p3d',  source: 'pm3',  target: 'phase3Days', animated: false },
  { id: 'e-dev3-p3d', source: 'dev3', target: 'phase3Days', animated: false },
  { id: 'e-qa3-p3d',  source: 'qa3',  target: 'phase3Days', animated: false },

  // ── WBS 录入 → 阶段成本 ───────────────────────────────────────────────────
  { id: 'e-pm1-p1c',  source: 'pm1',  target: 'phase1Cost', animated: false },
  { id: 'e-dev1-p1c', source: 'dev1', target: 'phase1Cost', animated: false },
  { id: 'e-qa1-p1c',  source: 'qa1',  target: 'phase1Cost', animated: false },
  { id: 'e-pm2-p2c',  source: 'pm2',  target: 'phase2Cost', animated: false },
  { id: 'e-dev2-p2c', source: 'dev2', target: 'phase2Cost', animated: false },
  { id: 'e-qa2-p2c',  source: 'qa2',  target: 'phase2Cost', animated: false },
  { id: 'e-pm3-p3c',  source: 'pm3',  target: 'phase3Cost', animated: false },
  { id: 'e-dev3-p3c', source: 'dev3', target: 'phase3Cost', animated: false },
  { id: 'e-qa3-p3c',  source: 'qa3',  target: 'phase3Cost', animated: false },

  // ── 阶段汇总 ─────────────────────────────────────────────────────────────
  { id: 'e-p1d-tpd',  source: 'phase1Days', target: 'totalPersonDays', animated: false },
  { id: 'e-p2d-tpd',  source: 'phase2Days', target: 'totalPersonDays', animated: false },
  { id: 'e-p3d-tpd',  source: 'phase3Days', target: 'totalPersonDays', animated: false },
  { id: 'e-p1c-lab',  source: 'phase1Cost', target: 'laborCost',       animated: false },
  { id: 'e-p2c-lab',  source: 'phase2Cost', target: 'laborCost',       animated: false },
  { id: 'e-p3c-lab',  source: 'phase3Cost', target: 'laborCost',       animated: false },

  // ── 成本计算链 ────────────────────────────────────────────────────────────
  { id: 'e-lab-mf',   source: 'laborCost',     target: 'managementFee', animated: false },
  { id: 'e-mgR-mf',   source: 'mgmtRate',      target: 'managementFee', animated: false },
  { id: 'e-lab-rb',   source: 'laborCost',     target: 'riskBuffer',    animated: false },
  { id: 'e-mf-rb',    source: 'managementFee', target: 'riskBuffer',    animated: false },
  { id: 'e-hw-rb',    source: 'hardwareCost',  target: 'riskBuffer',    animated: false },
  { id: 'e-tv-rb',    source: 'travelCost',    target: 'riskBuffer',    animated: false },
  { id: 'e-rkR-rb',   source: 'riskRate',      target: 'riskBuffer',    animated: false },
  { id: 'e-lab-tc',   source: 'laborCost',     target: 'totalCost',     animated: false },
  { id: 'e-mf-tc',    source: 'managementFee', target: 'totalCost',     animated: false },
  { id: 'e-hw-tc',    source: 'hardwareCost',  target: 'totalCost',     animated: false },
  { id: 'e-tv-tc',    source: 'travelCost',    target: 'totalCost',     animated: false },
  { id: 'e-rb-tc',    source: 'riskBuffer',    target: 'totalCost',     animated: false },

  // ── totalCost → 报价区 ───────────────────────────────────────────────────
  { id: 'e-tc-sq',    source: 'totalCost', target: 'suggestedQuote',  animated: false },
  { id: 'e-tc-ma',    source: 'totalCost', target: 'marginAmount',    animated: false },

  // ── 建议报价（DAG，受 marginRate 驱动）────────────────────────────────────
  { id: 'e-mr-sq',    source: 'marginRate', target: 'suggestedQuote', animated: false },

  // ── ⟳ 纠缠 1 连接（bidirectional + entangle node）────────────────────────
  { id: 'e-mr-ent1',  source: 'marginRate',  target: 'entangle1', type: 'smoothstep',
    style: { stroke: '#a78bfa', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#a78bfa' } },
  { id: 'e-qp-ent1',  source: 'quotePrice',  target: 'entangle1', type: 'smoothstep',
    style: { stroke: '#a78bfa', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#a78bfa' } },
  { id: 'e-ent1-mr',  source: 'entangle1',   target: 'marginRate', type: 'smoothstep',
    style: { stroke: '#ec4899', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#ec4899' } },
  { id: 'e-ent1-qp',  source: 'entangle1',   target: 'quotePrice', type: 'smoothstep',
    style: { stroke: '#ec4899', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#ec4899' } },

  // ── 最终报价下游 ──────────────────────────────────────────────────────────
  { id: 'e-qp-ma',    source: 'quotePrice', target: 'marginAmount', animated: false },
  { id: 'e-qp-tax',   source: 'quotePrice', target: 'taxAmount',    animated: false },
  { id: 'e-txR-tax',  source: 'taxRate0',   target: 'taxAmount',    animated: false },
  { id: 'e-qp-twt',   source: 'quotePrice', target: 'totalWithTax', animated: false },
  { id: 'e-tax-twt',  source: 'taxAmount',  target: 'totalWithTax', animated: false },

  // ── 付款方案 ─────────────────────────────────────────────────────────────
  { id: 'e-twt-dep',  source: 'totalWithTax', target: 'depositAmount', animated: false },
  { id: 'e-twt-mil',  source: 'totalWithTax', target: 'milestone',     animated: false },
  { id: 'e-twt-fin',  source: 'totalWithTax', target: 'finalPayment',  animated: false },
  { id: 'e-dep-fin',  source: 'depositAmount',target: 'finalPayment',  animated: false },
  { id: 'e-mil-fin',  source: 'milestone',    target: 'finalPayment',  animated: false },

  // ── 资源规划纠缠 ──────────────────────────────────────────────────────────
  { id: 'e-tpd-ent2',  source: 'totalPersonDays', target: 'entangle2', animated: false },
  { id: 'e-eff-ent2',  source: 'efficiency',       target: 'entangle2', animated: false },
  { id: 'e-dur-ent2',  source: 'duration',  target: 'entangle2', type: 'smoothstep',
    style: { stroke: '#a78bfa', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#a78bfa' } },
  { id: 'e-ts-ent2',   source: 'teamSize',  target: 'entangle2', type: 'smoothstep',
    style: { stroke: '#a78bfa', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#a78bfa' } },
  { id: 'e-ent2-dur',  source: 'entangle2', target: 'duration',  type: 'smoothstep',
    style: { stroke: '#ec4899', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#ec4899' } },
  { id: 'e-ent2-ts',   source: 'entangle2', target: 'teamSize',  type: 'smoothstep',
    style: { stroke: '#ec4899', strokeDasharray: '5,3', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#ec4899' } },

  // ── 资源规划 DAG 下游 ─────────────────────────────────────────────────────
  { id: 'e-qp-dr',    source: 'quotePrice',      target: 'dailyRevenue',  animated: false },
  { id: 'e-dur-dr',   source: 'duration',         target: 'dailyRevenue',  animated: false },
  { id: 'e-qp-pdr',   source: 'quotePrice',      target: 'personDayRate', animated: false },
  { id: 'e-tpd-pdr',  source: 'totalPersonDays', target: 'personDayRate', animated: false },
]
</script>

<style scoped>
.eq-graph-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
}
.graph-header {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.graph-badge-dag {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #fff;
  font-family: 'JetBrains Mono', monospace;
}
.graph-badge-ent {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff;
  font-family: 'JetBrains Mono', monospace;
}
.graph-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.graph-hint  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }
.graph-body {
  height: 660px;
  background: var(--vp-c-bg-soft);
}
.eq-flow {
  width: 100%; height: 100%;
}

/* ── 普通字段节点 ─────────────────────────────────────────────── */
.field-node {
  display: flex; flex-direction: column; gap: 2px;
  padding: 5px 10px; border-radius: 8px; min-width: 110px;
  border: 1.5px solid;
  font-size: 11px; cursor: default;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
}
.field-node.project  { border-color: #6366f1; }
.field-node.wbs      { border-color: #10b981; }
.field-node.costs    { border-color: #f59e0b; }
.field-node.pricing  { border-color: #3b82f6; }
.field-node.resource { border-color: #06b6d4; }
.field-node.payment  { border-color: #8b5cf6; }
.fn-dot {
  width: 6px; height: 6px; border-radius: 50%; margin-bottom: 2px;
  background: currentColor; opacity: 0.5;
}
.project  .fn-dot  { background: #818cf8; }
.wbs      .fn-dot  { background: #34d399; }
.costs    .fn-dot  { background: #fbbf24; }
.pricing  .fn-dot  { background: #60a5fa; }
.resource .fn-dot  { background: #22d3ee; }
.payment  .fn-dot  { background: #a78bfa; }
.fn-label { font-size: 11px; font-weight: 600; color: var(--vp-c-text-1); line-height: 1.3; }
.fn-sub   { font-size: 9px; color: var(--vp-c-text-2); opacity: 0.8; line-height: 1.2; }

/* ── 纠缠节点 ─────────────────────────────────────────────────── */
.entangle-node {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 12px; border-radius: 50%;
  width: 74px; height: 74px;
  background: linear-gradient(135deg, rgba(139,92,246,.15), rgba(236,72,153,.15));
  border: 2px solid #a78bfa;
  box-shadow: 0 0 12px rgba(139,92,246,.3);
  justify-content: center;
  cursor: default;
}
.en-ring  { font-size: 18px; line-height: 1; }
.en-label { font-size: 10px; font-weight: 700; color: #a78bfa; }
.en-sub   { font-size: 8px; color: var(--vp-c-text-2); text-align: center; line-height: 1.2; }

/* ── 图例 ─────────────────────────────────────────────────────── */
.graph-legend {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 10px 20px;
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  font-size: 11px;
}
.leg-item { display: flex; align-items: center; gap: 5px; color: var(--vp-c-text-2); }
.leg-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.leg-dot.project      { background: #818cf8; }
.leg-dot.wbs          { background: #34d399; }
.leg-dot.costs        { background: #fbbf24; }
.leg-dot.pricing      { background: #60a5fa; }
.leg-dot.resource     { background: #22d3ee; }
.leg-dot.payment      { background: #a78bfa; }
.leg-dot.entangle-dot { background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 0; width: 12px; height: 2px; border-radius: 1px; }
.leg-edge { width: 20px; height: 2px; border-radius: 1px; flex-shrink: 0; }
.leg-edge.dag-edge { background: #4b5563; }
.leg-edge.ent-edge { background: linear-gradient(90deg, #a78bfa, #ec4899); }

/* Vue Flow overrides */
:deep(.vue-flow__node)          { font-family: 'JetBrains Mono', monospace; }
:deep(.vue-flow__edge-path)     { stroke-width: 1.5; stroke: #4b5563; }
:deep(.vue-flow__background)    { background: var(--vp-c-bg-soft); }
:deep(.vue-flow__controls)      { display: none; }
:deep(.vue-flow__minimap)       { display: none; }
:deep(.vue-flow__attribution)   { display: none; }
</style>
