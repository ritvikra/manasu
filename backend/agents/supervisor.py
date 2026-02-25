from langgraph.graph import StateGraph, END
from models.state import AgentState
from agents.router import router_node


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("router", router_node)
    graph.set_entry_point("router")
    graph.add_edge("router", END)
    return graph.compile()


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
