// Lightweight hydraulic helper: tree networks, per-segment flow & Δp
// Assumptions:
// - Two-pipe tree (no loops). You provide a root "source" node (e.g., heat source).
// - Each edge is directed away from the source (from -> to).
// - Radiator flows are design flows (flow_lps per heater/tap).
//
// Pressure drop: Darcy–Weisbach with Blasius (turbulent) + laminar fallback.
//   Δp_fric = f * (L/D) * (ρ v² / 2)
//   f = 64/Re              for Re < ~2300  (laminar, smooth pipe)
//   f ≈ 0.3164 / Re^0.25   for 4e3 ≲ Re ≲ 1e5 (turbulent, smooth pipe)
// Optional minor losses on an edge:
//   Δp_minor = K_total * (ρ v² / 2)   where K_total = sum of fitting K-values
//
// Notes:
// - This is intentionally simple—no loop solver, no valve curves.
// - Good for trunk sizing and quick Δp estimates on tree topologies.

export type HydNode = { id: string; name?: string };

export type HydEdge = {
  id: string;
  from: string;          // node id (upstream)
  to: string;            // node id (downstream)
  length_m: number;      // pipe length
  diameter_mm: number;   // inner diameter (mm)
  roughness_mm?: number; // unused in Blasius; kept for future
  kMinor?: number;       // optional sum of K-values for fittings/minor losses
  note?: string;
};

export type HydRadiatorTap = {
  id: string;
  nodeId: string;   // node where this radiator taps (downstream)
  flow_lps: number; // L/s (design flow)
  name?: string;
};

export type HydFluid = {
  rho: number; // kg/m³
  mu: number;  // Pa·s (dynamic viscosity)
};

export type HydNetwork = {
  nodes: HydNode[];
  edges: HydEdge[];       // directed from source outward
  sourceNodeId: string;   // root node id
  taps: HydRadiatorTap[]; // radiators drawing flow at nodes
  fluid?: HydFluid;       // defaults to water @ ~20°C if omitted
};

export type EdgeResult = HydEdge & {
  flow_lps: number;       // L/s through the edge (downstream subtree flow)
  velocity_m_s: number;   // v
  reynolds: number;       // Re
  frictionFactor: number; // f
  dp_Pa: number;          // Δp total (friction + minor) in Pa
  dp_fric_Pa: number;     // friction portion
  dp_minor_Pa: number;    // minor losses portion
  headLoss_m: number;     // Δh = Δp / (ρ g)
};

export type NodeResult = HydNode & {
  downstreamFlow_lps: number; // total tap flow in node's subtree
  cumDp_Pa: number;           // cumulative Δp from source to this node (Pa)
  headLoss_m: number;         // cumulative head loss from source (m)
};

export type HydResults = {
  perEdge: EdgeResult[];
  perNode: NodeResult[];
  totalFlow_lps: number; // source flow (L/s)
  warnings: string[];    // basic network checks
};

/* ─────────────────────────── utilities ─────────────────────────── */

const GRAVITY = 9.80665; // m/s²

function areaFromDiameter_mm(d_mm: number): number {
  const d_m = Math.max(0, d_mm) / 1000;
  return d_m > 0 ? (Math.PI * d_m * d_m) / 4 : 0;
}
function sum(arr: number[]) {
  return arr.reduce((s, x) => s + x, 0);
}

function buildChildren(edges: HydEdge[]) {
  const children = new Map<string, HydEdge[]>();
  for (const e of edges) {
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push(e);
  }
  return children;
}

function reynoldsNumber(rho: number, v: number, d_m: number, mu: number) {
  // Re = ρ v D / μ
  if (mu <= 0 || d_m <= 0) return 0;
  return (rho * v * d_m) / mu;
}

function frictionFactorSmoothPipe(Re: number): number {
  if (Re <= 0) return 0.03;     // conservative fallback
  if (Re < 2300) return 64 / Re; // laminar
  // Blasius turbulent (smooth pipe) — valid roughly 4e3..1e5
  return 0.3164 / Math.pow(Re, 0.25);
}

/** Aggregate flows down the tree (sum of tap flows in each subtree). */
function downstreamTapFlowAtNodes(
  rootId: string,
  edges: HydEdge[],
  tapsByNode: Map<string, number>
): Map<string, number> {
  const children = buildChildren(edges);
  const flowAtNode = new Map<string, number>();

  function dfs(nodeId: string): number {
    const selfTap = tapsByNode.get(nodeId) || 0;
    const kids = children.get(nodeId) || [];
    const downstream = sum(kids.map((e) => dfs(e.to)));
    const total = selfTap + downstream;
    flowAtNode.set(nodeId, total);
    return total;
  }

  dfs(rootId);
  return flowAtNode;
}

/* ─────────────────────────── main API ─────────────────────────── */

/**
 * Compute per-edge hydraulics and cumulative Δp on a directed tree network.
 * Returns per-edge results, per-node cumulative results, source total flow, and basic warnings.
 */
export function computeNetworkResults(net: HydNetwork): HydResults {
  const fluid: HydFluid = net.fluid ?? { rho: 998, mu: 0.001 }; // water @ ~20°C
  const warnings: string[] = [];

  // Basic checks
  const nodeIds = new Set(net.nodes.map((n) => n.id));
  net.edges.forEach((e) => {
    if (!nodeIds.has(e.from)) warnings.push(`Edge "${e.id}" references missing from-node "${e.from}".`);
    if (!nodeIds.has(e.to)) warnings.push(`Edge "${e.id}" references missing to-node "${e.to}".`);
  });
  net.taps.forEach((t) => {
    if (!nodeIds.has(t.nodeId)) warnings.push(`Tap "${t.id}" references missing node "${t.nodeId}".`);
  });
  if (!nodeIds.has(net.sourceNodeId)) {
    warnings.push(`Source node "${net.sourceNodeId}" not found in nodes.`);
  }

  // Sum tap flows per node (L/s)
  const tapsByNode = new Map<string, number>();
  for (const t of net.taps) {
    if (!t.nodeId || !Number.isFinite(t.flow_lps)) continue;
    tapsByNode.set(t.nodeId, (tapsByNode.get(t.nodeId) || 0) + Math.max(0, t.flow_lps || 0));
  }

  // Downstream flow at each node (L/s)
  const nodeDownstreamFlow = downstreamTapFlowAtNodes(net.sourceNodeId, net.edges, tapsByNode);
  const totalFlow_lps = nodeDownstreamFlow.get(net.sourceNodeId) || 0;

  // Precompute lookups
  const areaByEdge = new Map<string, number>();
  for (const e of net.edges) areaByEdge.set(e.id, areaFromDiameter_mm(e.diameter_mm));

  // Per-edge hydraulics
  const perEdge: EdgeResult[] = net.edges.map((e) => {
    const q_lps = nodeDownstreamFlow.get(e.to) || 0;     // flow through this edge (L/s)
    const q_m3_s = q_lps / 1000;                         // m³/s
    const area = areaByEdge.get(e.id) || 0;
    const v = area > 0 ? q_m3_s / area : 0;              // m/s
    const D_m = Math.max(0, e.diameter_mm) / 1000;       // m
    const Re = reynoldsNumber(fluid.rho, v, D_m, Math.max(fluid.mu, 1e-9));
    const f = frictionFactorSmoothPipe(Re);

    const dynamic = 0.5 * fluid.rho * v * v;             // ρ v² / 2
    const dp_fric = D_m > 0 ? f * (Math.max(0, e.length_m) / D_m) * dynamic : 0; // Pa
    const kMinor = Math.max(0, e.kMinor ?? 0);
    const dp_minor = kMinor > 0 ? kMinor * dynamic : 0;  // Pa
    const dp = dp_fric + dp_minor;
    const headLoss_m = dp / (fluid.rho * GRAVITY);       // m

    return {
      ...e,
      flow_lps: q_lps,
      velocity_m_s: v,
      reynolds: Re,
      frictionFactor: f,
      dp_Pa: dp,
      dp_fric_Pa: dp_fric,
      dp_minor_Pa: dp_minor,
      headLoss_m,
    };
  });

  // Build children adjacency and edge result lookup for O(1) access
  const children = buildChildren(net.edges);
  const edgeResById = new Map(perEdge.map((er) => [er.id, er] as const));

  // Cumulative Δp / head loss along paths from source
  const cumDpByNode = new Map<string, number>();
  cumDpByNode.set(net.sourceNodeId, 0);

  const stack: string[] = [net.sourceNodeId];
  while (stack.length) {
    const nodeId = stack.pop()!;
    const base = cumDpByNode.get(nodeId) || 0;
    const kids = children.get(nodeId) || [];
    for (const e of kids) {
      const er = edgeResById.get(e.id);
      if (!er) continue;
      const nextDp = base + er.dp_Pa;
      cumDpByNode.set(e.to, nextDp);
      stack.push(e.to);
    }
  }

  // Per-node output
  const perNode: NodeResult[] = net.nodes.map((n) => {
    const dp = cumDpByNode.get(n.id) || 0;
    return {
      ...n,
      downstreamFlow_lps: nodeDownstreamFlow.get(n.id) || 0,
      cumDp_Pa: dp,
      headLoss_m: dp / (fluid.rho * GRAVITY),
    };
  });


  for (const n of net.nodes) {
    const hasFlow = (nodeDownstreamFlow.get(n.id) || 0) > 0;
    const seen = cumDpByNode.has(n.id);
    if (hasFlow && !seen) {
      warnings.push(`Node "${n.id}" has demand but is not reachable from source "${net.sourceNodeId}".`);
    }
  }

  return { perEdge, perNode, totalFlow_lps, warnings };
}
