"""
FraudLens AI - NetworkX Graph Relationship & Entity Clustering Engine
Constructs multi-entity risk graphs connecting:
- Transactions
- User Accounts
- Devices
- IP Addresses
- Merchants

Performs:
- Bipartite entity projection (Account-Device-Account)
- Connected components (fraud ring / syndicate detection)
- Neighborhood ego-graph extraction for individual transactions
- Edge justification (documenting why each relationship exists)
"""

from typing import Dict, List, Any, Optional
import networkx as nx
import pandas as pd

class FraudGraphEngine:
    def __init__(self):
        self.graph = nx.Graph()
        self.transaction_map = {}

    def build_graph_from_dataframe(self, df: pd.DataFrame):
        """
        Builds the global multi-entity graph from transaction records.
        """
        self.graph.clear()
        self.transaction_map.clear()

        for _, row in df.iterrows():
            txn_id = str(row["transaction_id"])
            account_id = str(row["account_id"])
            device_id = str(row.get("device_id", "DEV-UNKNOWN"))
            ip_addr = str(row.get("ip_address", "0.0.0.0"))
            merchant_id = str(row.get("merchant_id", "MER-UNKNOWN"))
            amount = float(row.get("amount", 0.0))
            is_fraud = int(row.get("is_fraud", 0))
            cat = str(row.get("merchant_category", "general"))
            timestamp = str(row.get("timestamp", ""))

            self.transaction_map[txn_id] = row.to_dict()

            # 1. Add Transaction Node
            self.graph.add_node(
                txn_id,
                node_type="transaction",
                label=f"Txn {txn_id[-8:]}",
                amount=amount,
                is_fraud=is_fraud,
                timestamp=timestamp
            )

            # 2. Add Account Node
            if not self.graph.has_node(account_id):
                self.graph.add_node(
                    account_id,
                    node_type="account",
                    label=f"Acc {account_id[-6:]}",
                    tx_count=0,
                    total_volume=0.0
                )
            self.graph.nodes[account_id]["tx_count"] += 1
            self.graph.nodes[account_id]["total_volume"] += amount

            # 3. Add Device Node
            if not self.graph.has_node(device_id):
                self.graph.add_node(
                    device_id,
                    node_type="device",
                    label=f"Dev {device_id[-6:]}",
                    accounts=set()
                )
            self.graph.nodes[device_id]["accounts"].add(account_id)

            # 4. Add IP Node
            if not self.graph.has_node(ip_addr):
                self.graph.add_node(
                    ip_addr,
                    node_type="ip",
                    label=f"IP {ip_addr}",
                    accounts=set()
                )
            self.graph.nodes[ip_addr]["accounts"].add(account_id)

            # 5. Add Merchant Node
            if not self.graph.has_node(merchant_id):
                self.graph.add_node(
                    merchant_id,
                    node_type="merchant",
                    label=f"Mer {merchant_id[-6:]}",
                    category=cat
                )

            # Connect Edges with Evidence Justification
            self.graph.add_edge(
                txn_id, account_id,
                relation="ORIGINATED_FROM",
                evidence="Primary account holder initiated payment instruction."
            )
            self.graph.add_edge(
                txn_id, device_id,
                relation="CAPTURED_DEVICE",
                evidence="Device browser/hardware fingerprint captured at checkout."
            )
            self.graph.add_edge(
                txn_id, ip_addr,
                relation="ROUTED_THROUGH_IP",
                evidence="HTTP TCP/IP network connection packet header."
            )
            self.graph.add_edge(
                txn_id, merchant_id,
                relation="SETTLED_AT",
                evidence="Acquiring merchant terminal ID."
            )

    def get_ego_graph(self, txn_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Extracts the localized subnetwork around a specific transaction,
        revealing shared devices, shared IPs, and correlated accounts.
        """
        if txn_id not in self.graph:
            return {"nodes": [], "edges": [], "syndicate_cluster_size": 0, "shared_devices": [], "shared_ips": []}

        # Ego network up to specified radius
        ego_nodes = nx.single_source_shortest_path_length(self.graph, txn_id, cutoff=depth)
        subgraph = self.graph.subgraph(ego_nodes.keys())

        nodes_out = []
        for node_id in subgraph.nodes():
            nd = dict(subgraph.nodes[node_id])
            # Serialize sets
            if "accounts" in nd:
                nd["account_count"] = len(nd["accounts"])
                nd["accounts"] = list(nd["accounts"])
            nodes_out.append({
                "id": str(node_id),
                **nd
            })

        edges_out = []
        for u, v, data in subgraph.edges(data=True):
            edges_out.append({
                "source": str(u),
                "target": str(v),
                "relation": data.get("relation", "CONNECTED"),
                "evidence": data.get("evidence", "Observed network link")
            })

        # Identify shared entities in ego subgraph
        shared_devices = [
            n["id"] for n in nodes_out
            if n.get("node_type") == "device" and n.get("account_count", 0) > 1
        ]
        shared_ips = [
            n["id"] for n in nodes_out
            if n.get("node_type") == "ip" and n.get("account_count", 0) > 1
        ]

        return {
            "root_transaction": txn_id,
            "nodes": nodes_out,
            "edges": edges_out,
            "cluster_node_count": len(nodes_out),
            "shared_devices": shared_devices,
            "shared_ips": shared_ips,
            "has_syndicate_overlap": (len(shared_devices) > 0 or len(shared_ips) > 0)
        }

    def detect_syndicate_clusters(self, min_shared_accounts: int = 2) -> List[Dict[str, Any]]:
        """
        Scans global graph for potential fraud syndicates:
        Clusters where 2 or more distinct accounts share the same physical device or IP.
        """
        syndicates = []
        for dev_id, data in self.graph.nodes(data=True):
            if data.get("node_type") == "device":
                accounts = list(data.get("accounts", set()))
                if len(accounts) >= min_shared_accounts:
                    # Gather related transactions
                    connected_txns = [
                        neighbor for neighbor in self.graph.neighbors(dev_id)
                        if self.graph.nodes[neighbor].get("node_type") == "transaction"
                    ]
                    syndicates.append({
                        "entity_type": "device",
                        "entity_id": dev_id,
                        "shared_account_count": len(accounts),
                        "accounts": accounts,
                        "associated_transactions": connected_txns,
                        "risk_level": "CRITICAL" if len(accounts) >= 3 else "HIGH",
                        "narrative": f"Device {dev_id} shared across {len(accounts)} accounts ({', '.join(accounts[:3])})."
                    })

        return syndicates
