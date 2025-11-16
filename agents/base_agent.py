"""
Base Agent Framework for Copa Airlines Agentic Route Optimization
Minimal implementation to demonstrate multi-agent coordination
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Callable
import json
import asyncio
from uuid import uuid4


class AgentStatus(Enum):
    IDLE = "idle"
    WORKING = "working"
    WAITING = "waiting"
    ERROR = "error"
    COMPLETED = "completed"


class MessageType(Enum):
    REQUEST = "request"
    RESPONSE = "response"
    EVENT = "event"
    COMMAND = "command"


@dataclass
class AgentMessage:
    """Message passed between agents"""
    id: str = field(default_factory=lambda: str(uuid4()))
    from_agent: str = ""
    to_agent: str = ""
    type: MessageType = MessageType.REQUEST
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    correlation_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "from": self.from_agent,
            "to": self.to_agent,
            "type": self.type.value,
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat(),
            "correlation_id": self.correlation_id
        }


@dataclass
class AgentContext:
    """Shared context available to all agents"""
    session_id: str
    goal: str
    data: Dict[str, Any] = field(default_factory=dict)

    def get(self, key: str, default=None):
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.data[key] = value

    def update(self, updates: Dict[str, Any]):
        self.data.update(updates)


class BaseAgent(ABC):
    """
    Base class for all agents in the system.
    Agents are autonomous units that:
    - Receive messages
    - Process information
    - Make decisions
    - Send messages to other agents
    """

    def __init__(self, agent_id: str, capabilities: List[str]):
        self.agent_id = agent_id
        self.capabilities = capabilities
        self.status = AgentStatus.IDLE
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.context: Optional[AgentContext] = None
        self.message_bus: Optional['MessageBus'] = None

        # Performance tracking
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.total_time = 0.0

    def set_context(self, context: AgentContext):
        """Set the shared context"""
        self.context = context

    def set_message_bus(self, bus: 'MessageBus'):
        """Set the message bus for communication"""
        self.message_bus = bus

    async def send_message(self, to_agent: str, message_type: MessageType,
                          payload: Dict[str, Any], correlation_id: Optional[str] = None):
        """Send a message to another agent"""
        if not self.message_bus:
            raise RuntimeError("Message bus not configured")

        message = AgentMessage(
            from_agent=self.agent_id,
            to_agent=to_agent,
            type=message_type,
            payload=payload,
            correlation_id=correlation_id
        )

        await self.message_bus.send(message)

    async def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        """Broadcast an event to all agents"""
        await self.send_message(
            to_agent="broadcast",
            message_type=MessageType.EVENT,
            payload={"event": event_type, "data": data}
        )

    async def receive_message(self, message: AgentMessage):
        """Receive a message (called by message bus)"""
        await self.message_queue.put(message)

    async def process_messages(self):
        """Main message processing loop"""
        while True:
            try:
                message = await self.message_queue.get()

                self.status = AgentStatus.WORKING
                start_time = datetime.now()

                # Process based on message type
                if message.type == MessageType.REQUEST:
                    await self.handle_request(message)
                elif message.type == MessageType.RESPONSE:
                    await self.handle_response(message)
                elif message.type == MessageType.EVENT:
                    await self.handle_event(message)
                elif message.type == MessageType.COMMAND:
                    await self.handle_command(message)

                # Track performance
                elapsed = (datetime.now() - start_time).total_seconds()
                self.total_time += elapsed
                self.tasks_completed += 1
                self.status = AgentStatus.IDLE

            except Exception as e:
                self.status = AgentStatus.ERROR
                self.tasks_failed += 1
                await self.handle_error(e)

    @abstractmethod
    async def handle_request(self, message: AgentMessage):
        """Handle incoming request - must be implemented by subclass"""
        pass

    async def handle_response(self, message: AgentMessage):
        """Handle response from another agent"""
        pass

    async def handle_event(self, message: AgentMessage):
        """Handle broadcast event"""
        pass

    async def handle_command(self, message: AgentMessage):
        """Handle command from orchestrator"""
        pass

    async def handle_error(self, error: Exception):
        """Handle errors"""
        print(f"[{self.agent_id}] ERROR: {error}")

    def get_stats(self) -> Dict[str, Any]:
        """Get agent performance statistics"""
        return {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "capabilities": self.capabilities,
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "avg_time_per_task": self.total_time / max(self.tasks_completed, 1),
            "success_rate": self.tasks_completed / max(self.tasks_completed + self.tasks_failed, 1)
        }


class MessageBus:
    """
    Central message bus for agent communication.
    Handles routing messages between agents.
    """

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.message_log: List[AgentMessage] = []

    def register_agent(self, agent: BaseAgent):
        """Register an agent with the bus"""
        self.agents[agent.agent_id] = agent
        agent.set_message_bus(self)

    async def send(self, message: AgentMessage):
        """Send a message to target agent(s)"""
        self.message_log.append(message)

        if message.to_agent == "broadcast":
            # Send to all agents except sender
            for agent_id, agent in self.agents.items():
                if agent_id != message.from_agent:
                    await agent.receive_message(message)
        else:
            # Send to specific agent
            if message.to_agent in self.agents:
                await self.agents[message.to_agent].receive_message(message)
            else:
                print(f"Warning: Agent {message.to_agent} not found")

    def get_message_history(self, limit: int = 100) -> List[Dict]:
        """Get recent message history"""
        return [msg.to_dict() for msg in self.message_log[-limit:]]

    def get_system_stats(self) -> Dict[str, Any]:
        """Get statistics for all agents"""
        return {
            "total_agents": len(self.agents),
            "agents": [agent.get_stats() for agent in self.agents.values()],
            "total_messages": len(self.message_log)
        }


class Orchestrator:
    """
    Central orchestrator that manages the multi-agent system.
    Coordinates goal decomposition and task assignment.
    """

    def __init__(self, message_bus: MessageBus):
        self.message_bus = message_bus
        self.active_goals: Dict[str, AgentContext] = {}

    async def set_goal(self, goal: str, initial_data: Dict[str, Any] = None) -> str:
        """
        Set a new optimization goal.
        Returns session_id for tracking.
        """
        session_id = str(uuid4())
        context = AgentContext(
            session_id=session_id,
            goal=goal,
            data=initial_data or {}
        )

        self.active_goals[session_id] = context

        # Set context for all agents
        for agent in self.message_bus.agents.values():
            agent.set_context(context)

        print(f"[Orchestrator] New goal set: {goal} (session: {session_id})")
        return session_id

    async def start_optimization(self, session_id: str):
        """Start the optimization process for a goal"""
        if session_id not in self.active_goals:
            raise ValueError(f"Unknown session: {session_id}")

        context = self.active_goals[session_id]

        # Send command to Planner agent to start
        planner_message = AgentMessage(
            from_agent="orchestrator",
            to_agent="planner",
            type=MessageType.COMMAND,
            payload={
                "action": "start_optimization",
                "session_id": session_id,
                "goal": context.goal
            }
        )

        await self.message_bus.send(planner_message)

    def get_progress(self, session_id: str) -> Dict[str, Any]:
        """Get progress of an optimization goal"""
        if session_id not in self.active_goals:
            return {"error": "Unknown session"}

        context = self.active_goals[session_id]
        return {
            "session_id": session_id,
            "goal": context.goal,
            "data": context.data,
            "system_stats": self.message_bus.get_system_stats()
        }


# Example: Simple Tool Interface for Agents
class Tool(ABC):
    """Base class for tools that agents can use"""

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Execute the tool"""
        pass


class DatabaseTool(Tool):
    """Tool for database access"""

    def __init__(self, supabase_client):
        self.client = supabase_client

    async def execute(self, table: str, query: Dict[str, Any]) -> Any:
        """Query database"""
        # Implementation would use real Supabase client
        return await self.client.from_(table).select("*").execute()


class LLMTool(Tool):
    """Tool for calling LLMs"""

    def __init__(self, provider: str, model: str, api_key: str):
        self.provider = provider
        self.model = model
        self.api_key = api_key

    async def execute(self, prompt: str) -> str:
        """Call LLM with prompt"""
        # Implementation would call actual LLM API
        # For now, return placeholder
        return f"LLM Response from {self.provider}/{self.model}"


if __name__ == "__main__":
    print("Copa Airlines Agentic Framework - Base Implementation")
    print("=" * 60)
    print("\nThis is the foundation for the multi-agent system.")
    print("See example_agents.py for concrete implementations.")
