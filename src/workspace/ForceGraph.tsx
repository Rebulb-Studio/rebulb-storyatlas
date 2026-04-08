import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { COLLECTION_DEFS } from "../constants";
import type { CollectionData, Entry, Theme } from "../types";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  color: string;
  collection: string;
  entryId: string;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
  color: string;
}

function buildGraph(data: CollectionData) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap: Record<string, GraphNode> = {};

  const add = (id: string, label: string, type: string, color: string, collection: string, entryId: string) => {
    if (!nodeMap[id]) {
      const n: GraphNode = { id, label, type, color, collection, entryId };
      nodeMap[id] = n;
      nodes.push(n);
    }
    return nodeMap[id];
  };

  for (const ch of data.characters || []) {
    const nid = `char:${ch.id}`;
    add(nid, (ch.name as string) || "?", "character", "#8b5cf6", "characters", ch.id);
    if (ch.affiliation) {
      const fac = (data.factions || []).find((f) => ((f.name as string) || "").toLowerCase() === (ch.affiliation as string).toLowerCase());
      if (fac) {
        const fid = `fac:${fac.id}`;
        add(fid, (fac.name as string), "faction", "#ef4444", "factions", fac.id);
        edges.push({ source: nid, target: fid, label: "member of", color: "#64748b" });
      }
    }
  }

  for (const fac of data.factions || []) {
    const fid = `fac:${fac.id}`;
    add(fid, (fac.name as string) || "?", "faction", "#ef4444", "factions", fac.id);
    if (fac.leader) {
      const ch = (data.characters || []).find((c) => ((c.name as string) || "").toLowerCase() === (fac.leader as string).toLowerCase());
      if (ch) {
        add(`char:${ch.id}`, (ch.name as string), "character", "#8b5cf6", "characters", ch.id);
        edges.push({ source: `char:${ch.id}`, target: fid, label: "leads", color: "#f59e0b" });
      }
    }
    const parseList = (val: unknown): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };
    for (const a of parseList(fac.allies)) {
      const ally = (data.factions || []).find((f) => ((f.name as string) || "").toLowerCase().trim() === a.toLowerCase().trim());
      if (ally) {
        add(`fac:${ally.id}`, (ally.name as string), "faction", "#ef4444", "factions", ally.id);
        edges.push({ source: fid, target: `fac:${ally.id}`, label: "ally", color: "#22c55e" });
      }
    }
    for (const e of parseList(fac.enemies)) {
      const enemy = (data.factions || []).find((f) => ((f.name as string) || "").toLowerCase().trim() === e.toLowerCase().trim());
      if (enemy) {
        add(`fac:${enemy.id}`, (enemy.name as string), "faction", "#ef4444", "factions", enemy.id);
        edges.push({ source: fid, target: `fac:${enemy.id}`, label: "enemy", color: "#ef4444" });
      }
    }
  }

  // Locations connected by region
  for (const loc of data.locations || []) {
    add(`loc:${loc.id}`, (loc.name as string) || "?", "location", "#10b981", "locations", loc.id);
    if (loc.controlledBy) {
      const fac = (data.factions || []).find((f) => ((f.name as string) || "").toLowerCase() === (loc.controlledBy as string).toLowerCase());
      if (fac) {
        add(`fac:${fac.id}`, (fac.name as string), "faction", "#ef4444", "factions", fac.id);
        edges.push({ source: `loc:${loc.id}`, target: `fac:${fac.id}`, label: "controlled by", color: "#64748b" });
      }
    }
  }

  return { nodes, edges, nodeMap };
}

export default function ForceGraph({ data, onView, theme: t }: {
  data: CollectionData;
  onView: (col: string, item: Entry) => void;
  theme: Theme;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const { nodes, edges } = buildGraph(data);

  const filteredNodes = filter === "all" ? nodes : nodes.filter((n) => n.type === filter);
  const filteredIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter((e) => {
    const sid = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
    const tid = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
    return filteredIds.has(sid) && filteredIds.has(tid);
  });

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800, height = 600;
    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(filteredEdges).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(35));

    // Edges
    const link = g.selectAll<SVGLineElement, GraphEdge>("line")
      .data(filteredEdges)
      .join("line")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5);

    // Edge labels
    const edgeLabel = g.selectAll<SVGTextElement, GraphEdge>("text.edge-label")
      .data(filteredEdges)
      .join("text")
      .attr("class", "edge-label")
      .attr("text-anchor", "middle")
      .attr("fill", t.textDim)
      .attr("font-size", "7px")
      .attr("font-family", "'DM Sans', sans-serif")
      .text((d) => d.label);

    // Node groups
    const node = g.selectAll<SVGGElement, GraphNode>("g.node")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        const items = data[d.collection] || [];
        const item = items.find((it) => it.id === d.entryId);
        if (item) onView(d.collection, item);
      })
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append("circle").attr("r", 20).attr("fill", (d) => d.color).attr("fill-opacity", 0.15).attr("stroke", (d) => d.color).attr("stroke-width", 1.5);
    node.append("circle").attr("r", 6).attr("fill", (d) => d.color);
    node.append("text").attr("y", 32).attr("text-anchor", "middle").attr("fill", t.textMuted).attr("font-size", "9px").attr("font-family", "'DM Sans', sans-serif").text((d) => d.label.length > 18 ? d.label.slice(0, 16) + "\u2026" : d.label);

    simulation.on("tick", () => {
      link.attr("x1", (d) => (d.source as GraphNode).x!).attr("y1", (d) => (d.source as GraphNode).y!)
          .attr("x2", (d) => (d.target as GraphNode).x!).attr("y2", (d) => (d.target as GraphNode).y!);
      edgeLabel.attr("x", (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
               .attr("y", (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [filteredNodes, filteredEdges, t]);

  const pillBtn = (color: string, active: boolean) => ({
    background: active ? color + "25" : "transparent",
    border: `1px solid ${active ? color + "60" : t.border}`,
    color: active ? color : t.textDim,
    padding: "0.25rem 0.6rem", borderRadius: "14px", cursor: "pointer" as const,
    fontSize: "0.72rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
  });

  if (nodes.length === 0) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.5rem" }}>Relationship Graph</h2>
        <p style={{ color: t.textDim }}>Add characters, factions, and locations with relationships to see the interactive graph.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.75rem" }}>Relationship Graph</h2>
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {[{ id: "all", label: "All", color: t.accent }, { id: "character", label: "Characters", color: "#8b5cf6" }, { id: "faction", label: "Factions", color: "#ef4444" }, { id: "location", label: "Locations", color: "#10b981" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={pillBtn(f.color, filter === f.id)}>{f.label}</button>
        ))}
        <span style={{ fontSize: "0.68rem", color: t.textDim, marginLeft: "auto" }}>{filteredNodes.length} nodes, {filteredEdges.length} edges</span>
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <svg ref={svgRef} viewBox="0 0 800 600" style={{ width: "100%", height: "500px" }} />
      </div>
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", fontSize: "0.68rem", color: t.textDim }}>
        <span>Drag nodes to rearrange</span>
        <span>Scroll to zoom</span>
        <span>Click node to view entry</span>
      </div>
    </div>
  );
}
