import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  Share2,
  ShieldAlert,
  Info,
  Maximize2,
  RefreshCw,
  Users,
  Smartphone,
  Globe,
  Store,
  DollarSign
} from 'lucide-react';
import { EgoGraphData, SyndicateCluster } from '../types';
import { api } from '../services/api';

interface FraudNetworkRadarProps {
  transactionId: string;
  onSelectTransaction: (id: string) => void;
}

export const FraudNetworkRadar: React.FC<FraudNetworkRadarProps> = ({
  transactionId,
  onSelectTransaction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graphData, setGraphData] = useState<EgoGraphData | null>(null);
  const [syndicates, setSyndicates] = useState<SyndicateCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const [ego, syn] = await Promise.all([
        api.getEgoGraph(transactionId, 2),
        api.getSyndicates()
      ]);
      setGraphData(ego);
      setSyndicates(syn.syndicates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [transactionId]);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Build Cytoscape elements
    const elements: any[] = [];

    // Add nodes with custom styles
    graphData.nodes.forEach((node) => {
      let bg = '#3B82F6';
      let shape = 'ellipse';
      let size = 35;

      if (node.node_type === 'transaction') {
        bg = node.id === transactionId ? '#EF4444' : '#06B6D4';
        shape = 'diamond';
        size = node.id === transactionId ? 45 : 35;
      } else if (node.node_type === 'device') {
        bg = (node.account_count || 0) > 1 ? '#F59E0B' : '#64748B';
        shape = 'rectangle';
        size = 35;
      } else if (node.node_type === 'ip') {
        bg = '#14B8A6';
        shape = 'hexagon';
        size = 32;
      } else if (node.node_type === 'account') {
        bg = '#8B5CF6';
        shape = 'ellipse';
        size = 40;
      } else if (node.node_type === 'merchant') {
        bg = '#10B981';
        shape = 'triangle';
        size = 35;
      }

      elements.push({
        data: {
          id: node.id,
          label: node.label || node.id,
          nodeType: node.node_type,
          bgColor: bg,
          shape: shape,
          size: size,
          raw: node
        }
      });
    });

    // Add edges
    graphData.edges.forEach((edge, idx) => {
      elements.push({
        data: {
          id: `edge-${idx}`,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
          evidence: edge.evidence
        }
      });
    });

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(bgColor)',
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'width': 'data(size)',
            'height': 'data(size)',
            'shape': 'data(shape)' as any,
            'border-width': 2,
            'border-color': '#0F172A'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#38BDF8',
            'line-color': '#38BDF8',
            'target-arrow-color': '#38BDF8',
            'opacity': 1
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        padding: 40
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedElement({ type: 'node', ...node.data() });
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      setSelectedElement({ type: 'edge', ...edge.data() });
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [graphData]);

  const fitGraph = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            Fraud Network Radar & Syndicate Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            NetworkX multi-entity relational topology: identifies shared hardware fingerprints, IP proxy clusters, and mule rings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fitGraph}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Reset Zoom</span>
          </button>
        </div>
      </div>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cytoscape Canvas (3 cols) */}
        <div className="lg:col-span-3 bg-navy-950 border border-slate-700/80 rounded-xl overflow-hidden relative shadow-inner h-[540px]">
          {loading && (
            <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center font-mono text-xs text-cyan-400 z-10">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Computing NetworkX connected components...
            </div>
          )}

          {/* Graph Legend */}
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono space-y-1.5 z-10 backdrop-blur-md">
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Entity Map</div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Target Txn (Diamond)
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Account (Circle)
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Shared Device (Square)
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> IP Address (Hex)
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Merchant (Triangle)
            </div>
          </div>

          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>

        {/* Selected Entity & Syndicate Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Selected Element Evidence Inspector */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 text-xs space-y-3">
            <h3 className="font-bold font-mono text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Entity & Evidence Inspector
            </h3>

            {selectedElement ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">
                    {selectedElement.type === 'node' ? `Node: ${selectedElement.nodeType}` : 'Relationship Edge'}
                  </span>
                  <span className="font-mono font-bold text-cyan-300 block break-all">
                    {selectedElement.id}
                  </span>
                  {selectedElement.relation && (
                    <span className="text-teal-400 font-mono text-[10px] block">
                      Relation: {selectedElement.relation}
                    </span>
                  )}
                </div>

                {selectedElement.evidence && (
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono block">EVIDENCE JUSTIFICATION</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedElement.evidence}
                    </p>
                  </div>
                )}

                {selectedElement.nodeType === 'transaction' && (
                  <button
                    onClick={() => onSelectTransaction(selectedElement.id)}
                    className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition"
                  >
                    Open Transaction Profile
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click on any node or edge in the radar graph to view underlying relationship evidence and verification telemetry.
              </p>
            )}
          </div>

          {/* Known Syndicate Clusters List */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-mono text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Discovered Syndicates
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {syndicates.length} Rings
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {syndicates.map((syn, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-400">
                      {syn.entity_id}
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 font-bold">
                      {syn.risk_level}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    {syn.narrative}
                  </p>
                </div>
              ))}
            </div>

            {/* Inferred vs Observed Disclaimer */}
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[10px] text-slate-500 leading-tight">
              Notice: Graph edges represent observed empirical links (e.g. shared device ID). A shared device alone is not legal proof of fraud.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
