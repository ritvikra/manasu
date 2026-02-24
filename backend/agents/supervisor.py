from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage
from models.state import AgentState
from agents.router import router_node, TOOLS
from agents.drafters import drafter_node


def should_use_tools(state: AgentState) -> str:
    """Conditional edge: if last AI message has tool calls, execute them."""
    messages = state["messages"]
    last = messages[-1] if messages else None
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "end"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    tool_node = ToolNode(TOOLS)

    graph.add_node("router", router_node)
    graph.add_node("tools", tool_node)
    graph.add_node("drafter", drafter_node)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        should_use_tools,
        {"tools": "tools", "end": END},
    )
    graph.add_edge("tools", "drafter")
    graph.add_edge("drafter", END)

    return graph.compile()


# Singleton graph instance
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
