"""
Concrete Agent Implementations for Route Optimization
Demonstrates the multi-agent autonomous system
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from base_agent import (
    BaseAgent, AgentMessage, MessageType, AgentStatus,
    Orchestrator, MessageBus, Tool
)


class PlannerAgent(BaseAgent):
    """
    Planner Agent: Decomposes high-level goals into tasks.
    Orchestrates other agents to achieve optimization goals.
    """

    def __init__(self):
        super().__init__(
            agent_id="planner",
            capabilities=["goal_decomposition", "task_assignment", "workflow_management"]
        )

    async def handle_command(self, message: AgentMessage):
        """Handle start optimization command from orchestrator"""
        if message.payload.get("action") == "start_optimization":
            await self.decompose_and_delegate(message.payload)

    async def decompose_and_delegate(self, payload: Dict[str, Any]):
        """
        Decompose goal into subtasks and delegate to agents.

        Example goal: "Optimize PTY-BOG route for tomorrow"

        Tasks:
        1. Get weather forecast (Weather Agent)
        2. Get fuel prices (Fuel Agent)
        3. Check network constraints (Network Agent)
        4. Calculate optimal route (Optimizer Agent)
        5. Validate compliance (Compliance Agent)
        """
        goal = payload["goal"]
        session_id = payload["session_id"]

        print(f"\n[Planner] Decomposing goal: {goal}")
        print(f"[Planner] Session: {session_id}")

        # Step 1: Request weather data
        await self.send_message(
            to_agent="weather",
            message_type=MessageType.REQUEST,
            payload={
                "action": "get_forecast",
                "origin": "PTY",
                "destination": "BOG",
                "time_range": "next_24_hours"
            },
            correlation_id=session_id
        )

        # Step 2: Request fuel data
        await self.send_message(
            to_agent="fuel",
            message_type=MessageType.REQUEST,
            payload={
                "action": "get_fuel_analysis",
                "origin": "PTY",
                "destination": "BOG"
            },
            correlation_id=session_id
        )

        # Step 3: Request network analysis
        await self.send_message(
            to_agent="network",
            message_type=MessageType.REQUEST,
            payload={
                "action": "check_constraints",
                "route": "PTY-BOG"
            },
            correlation_id=session_id
        )

        # Store that we're waiting for responses
        if self.context:
            self.context.set("planning_status", "waiting_for_data")
            self.context.set("pending_responses", ["weather", "fuel", "network"])

    async def handle_response(self, message: AgentMessage):
        """Handle responses from other agents"""
        if not self.context:
            return

        # Track which agents have responded
        pending = self.context.get("pending_responses", [])
        if message.from_agent in pending:
            pending.remove(message.from_agent)
            self.context.set("pending_responses", pending)

            # Store the response data
            self.context.set(f"{message.from_agent}_data", message.payload)

            print(f"[Planner] Received data from {message.from_agent}")

        # If all data collected, proceed to optimization
        if len(pending) == 0 and self.context.get("planning_status") == "waiting_for_data":
            await self.trigger_optimization()

    async def trigger_optimization(self):
        """Once all data is collected, trigger the optimizer"""
        print(f"\n[Planner] All data collected. Triggering optimization...")

        await self.send_message(
            to_agent="optimizer",
            message_type=MessageType.REQUEST,
            payload={
                "action": "optimize_route",
                "weather_data": self.context.get("weather_data"),
                "fuel_data": self.context.get("fuel_data"),
                "network_data": self.context.get("network_data")
            },
            correlation_id=self.context.session_id
        )

        self.context.set("planning_status", "optimizing")


class WeatherAgent(BaseAgent):
    """
    Weather Agent: Continuously monitors weather and provides forecasts.
    Alerts other agents of significant weather changes.
    """

    def __init__(self):
        super().__init__(
            agent_id="weather",
            capabilities=["weather_monitoring", "forecasting", "turbulence_detection"]
        )
        self.monitoring_task = None

    async def handle_request(self, message: AgentMessage):
        """Handle weather data requests"""
        action = message.payload.get("action")

        if action == "get_forecast":
            forecast_data = await self.get_weather_forecast(
                origin=message.payload["origin"],
                destination=message.payload["destination"]
            )

            # Send response back
            await self.send_message(
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload=forecast_data,
                correlation_id=message.correlation_id
            )

    async def get_weather_forecast(self, origin: str, destination: str) -> Dict[str, Any]:
        """
        Get weather forecast for route.
        In production, this would call real weather APIs.
        """
        print(f"[Weather] Fetching forecast for {origin}-{destination}")

        # Simulate weather data fetch
        await asyncio.sleep(0.5)  # Simulate API call

        # Mock data - in production, call OpenWeatherMap, etc.
        return {
            "origin_weather": {
                "airport": origin,
                "temperature": 28,
                "wind_speed": 12,
                "wind_direction": 90,
                "visibility": "10km"
            },
            "destination_weather": {
                "airport": destination,
                "temperature": 22,
                "wind_speed": 8,
                "wind_direction": 180,
                "visibility": "10km"
            },
            "route_weather": {
                "turbulence_alerts": [],
                "wind_at_fl390": {"speed": 45, "direction": 270, "component": "tailwind"},
                "wind_at_fl370": {"speed": 35, "direction": 260, "component": "tailwind"},
                "recommended_altitude": 39000,
                "confidence": 0.85
            },
            "timestamp": datetime.now().isoformat()
        }

    async def start_continuous_monitoring(self):
        """
        Continuously monitor weather and broadcast alerts.
        This runs in the background.
        """
        print("[Weather] Starting continuous monitoring...")

        while True:
            await asyncio.sleep(60)  # Check every minute

            # Check for significant weather changes
            # If found, broadcast event
            # await self.broadcast_event("severe_weather_alert", {...})


class FuelAgent(BaseAgent):
    """
    Fuel Agent: Monitors fuel prices and calculates fuel optimization.
    """

    def __init__(self):
        super().__init__(
            agent_id="fuel",
            capabilities=["fuel_pricing", "tankering_analysis", "cost_optimization"]
        )

    async def handle_request(self, message: AgentMessage):
        """Handle fuel analysis requests"""
        action = message.payload.get("action")

        if action == "get_fuel_analysis":
            fuel_data = await self.analyze_fuel_costs(
                origin=message.payload["origin"],
                destination=message.payload["destination"]
            )

            await self.send_message(
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload=fuel_data,
                correlation_id=message.correlation_id
            )

    async def analyze_fuel_costs(self, origin: str, destination: str) -> Dict[str, Any]:
        """Calculate fuel costs and tankering recommendations"""
        print(f"[Fuel] Analyzing fuel costs for {origin}-{destination}")

        await asyncio.sleep(0.3)  # Simulate calculation

        return {
            "origin_price": 3.45,  # USD per gallon
            "destination_price": 4.10,
            "fuel_burn_estimate": 2400,  # lbs
            "tankering_recommended": True,
            "tankering_savings": 450,  # USD
            "confidence": 0.92,
            "timestamp": datetime.now().isoformat()
        }


class NetworkAgent(BaseAgent):
    """
    Network Agent: Manages network constraints, slots, and connections.
    """

    def __init__(self):
        super().__init__(
            agent_id="network",
            capabilities=["slot_management", "connection_optimization", "network_analysis"]
        )

    async def handle_request(self, message: AgentMessage):
        """Handle network constraint requests"""
        action = message.payload.get("action")

        if action == "check_constraints":
            constraints = await self.check_network_constraints(
                route=message.payload["route"]
            )

            await self.send_message(
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload=constraints,
                correlation_id=message.correlation_id
            )

    async def check_network_constraints(self, route: str) -> Dict[str, Any]:
        """Check network constraints for route"""
        print(f"[Network] Checking constraints for {route}")

        await asyncio.sleep(0.2)

        return {
            "slots_available": True,
            "connecting_flights": 3,
            "network_impact": "minimal",
            "constraints": [],
            "timestamp": datetime.now().isoformat()
        }


class OptimizerAgent(BaseAgent):
    """
    Optimizer Agent: Performs multi-objective optimization.
    Uses the existing multi-LLM feature to get recommendations.
    """

    def __init__(self):
        super().__init__(
            agent_id="optimizer",
            capabilities=["route_optimization", "multi_llm_comparison", "decision_making"]
        )

    async def handle_request(self, message: AgentMessage):
        """Handle optimization requests"""
        action = message.payload.get("action")

        if action == "optimize_route":
            result = await self.optimize_route(
                weather_data=message.payload.get("weather_data"),
                fuel_data=message.payload.get("fuel_data"),
                network_data=message.payload.get("network_data")
            )

            # Send result to Planner
            await self.send_message(
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload=result,
                correlation_id=message.correlation_id
            )

            # Also broadcast completion event
            await self.broadcast_event(
                event_type="optimization_complete",
                data=result
            )

    async def optimize_route(self, weather_data, fuel_data, network_data) -> Dict[str, Any]:
        """
        Perform route optimization using collected data.
        In production, this would call the multi-LLM comparison endpoint.
        """
        print(f"\n[Optimizer] Running optimization...")
        print(f"  - Weather confidence: {weather_data['route_weather']['confidence']}")
        print(f"  - Fuel savings: ${fuel_data['tankering_savings']}")
        print(f"  - Network status: {network_data['network_impact']}")

        # Simulate multi-LLM comparison
        await asyncio.sleep(2)  # Simulate LLM calls

        # In production, call: POST /functions/v1/optimize-route-multi
        # For now, return mock optimization result
        result = {
            "recommended_altitude": 39000,
            "estimated_fuel_savings": 450,
            "estimated_time_savings": 2.5,
            "route": "PTY-BOG",
            "confidence": 0.89,
            "reasoning": "Favorable tailwinds at FL390 combined with fuel tankering opportunity",
            "llm_consensus": {
                "claude": {"altitude": 39000, "confidence": 0.92},
                "openai": {"altitude": 39000, "confidence": 0.88},
                "gemini": {"altitude": 37000, "confidence": 0.85}
            },
            "requires_approval": False,  # Auto-approve if confidence > 0.85
            "timestamp": datetime.now().isoformat()
        }

        print(f"\n[Optimizer] ✓ Optimization complete!")
        print(f"  Recommended: FL{result['recommended_altitude']/100:.0f}")
        print(f"  Fuel savings: {result['estimated_fuel_savings']} lbs")
        print(f"  Confidence: {result['confidence']*100:.0f}%")

        return result


class CriticAgent(BaseAgent):
    """
    Critic Agent: Monitors actual outcomes vs predictions.
    Triggers re-optimization if needed.
    """

    def __init__(self):
        super().__init__(
            agent_id="critic",
            capabilities=["performance_monitoring", "anomaly_detection", "feedback_generation"]
        )

    async def handle_event(self, message: AgentMessage):
        """Listen for optimization completion events"""
        event_type = message.payload.get("event")

        if event_type == "optimization_complete":
            # Store prediction for later comparison
            prediction = message.payload["data"]
            if self.context:
                self.context.set("last_prediction", prediction)
                print(f"[Critic] Stored prediction for monitoring")

    async def compare_prediction_vs_actual(self, flight_id: str):
        """
        After flight completion, compare predicted vs actual.
        In production, this would fetch actual flight data.
        """
        if not self.context:
            return

        prediction = self.context.get("last_prediction")
        if not prediction:
            return

        # Fetch actual flight data
        actual = {
            "fuel_used": 2850,  # lbs
            "flight_time": 92,  # minutes
            "altitude_flown": 39000
        }

        # Compare
        fuel_error = abs(actual["fuel_used"] - prediction["estimated_fuel_savings"])
        accuracy = 1.0 - (fuel_error / actual["fuel_used"])

        print(f"\n[Critic] Performance Analysis:")
        print(f"  Predicted fuel: {prediction['estimated_fuel_savings']} lbs")
        print(f"  Actual fuel: {actual['fuel_used']} lbs")
        print(f"  Accuracy: {accuracy*100:.1f}%")

        # If accuracy is poor, trigger investigation
        if accuracy < 0.8:
            await self.broadcast_event(
                event_type="poor_prediction_accuracy",
                data={"accuracy": accuracy, "flight_id": flight_id}
            )


# Demo: Putting it all together
async def demo_agentic_system():
    """
    Demonstrate the agentic route optimization system.
    """
    print("\n" + "="*80)
    print("COPA AIRLINES AGENTIC ROUTE OPTIMIZATION DEMO")
    print("="*80 + "\n")

    # 1. Create message bus
    bus = MessageBus()

    # 2. Create and register agents
    planner = PlannerAgent()
    weather = WeatherAgent()
    fuel = FuelAgent()
    network = NetworkAgent()
    optimizer = OptimizerAgent()
    critic = CriticAgent()

    agents = [planner, weather, fuel, network, optimizer, critic]

    for agent in agents:
        bus.register_agent(agent)

    print("✓ Registered 6 agents:")
    for agent in agents:
        print(f"  - {agent.agent_id}: {', '.join(agent.capabilities)}")

    # 3. Create orchestrator
    orchestrator = Orchestrator(bus)

    # 4. Start agent message processing loops
    print("\n✓ Starting agent message loops...")
    agent_tasks = [asyncio.create_task(agent.process_messages()) for agent in agents]

    # 5. Set optimization goal
    print("\n" + "-"*80)
    session_id = await orchestrator.set_goal(
        goal="Optimize PTY-BOG route for tomorrow",
        initial_data={"origin": "PTY", "destination": "BOG", "aircraft": "B738"}
    )

    # 6. Start optimization
    await orchestrator.start_optimization(session_id)

    # 7. Wait for optimization to complete
    print("\nWaiting for agents to complete their work...\n")
    await asyncio.sleep(5)  # Give agents time to process

    # 8. Show results
    print("\n" + "-"*80)
    print("OPTIMIZATION RESULTS")
    print("-"*80)

    progress = orchestrator.get_progress(session_id)
    print(f"\nSession: {session_id}")
    print(f"Goal: {progress['goal']}")
    print(f"\nContext Data:")
    for key, value in progress['data'].items():
        if isinstance(value, dict):
            print(f"  {key}: [Complex data structure]")
        else:
            print(f"  {key}: {value}")

    # 9. Show system statistics
    print("\n" + "-"*80)
    print("SYSTEM STATISTICS")
    print("-"*80)

    stats = bus.get_system_stats()
    print(f"\nTotal Messages: {stats['total_messages']}")
    print(f"\nAgent Performance:")
    for agent_stat in stats['agents']:
        print(f"\n  {agent_stat['agent_id']}:")
        print(f"    Status: {agent_stat['status']}")
        print(f"    Tasks Completed: {agent_stat['tasks_completed']}")
        print(f"    Success Rate: {agent_stat['success_rate']*100:.1f}%")
        print(f"    Avg Time: {agent_stat['avg_time_per_task']:.3f}s")

    # 10. Show message history
    print("\n" + "-"*80)
    print("MESSAGE HISTORY (Last 10)")
    print("-"*80)
    for msg in bus.get_message_history(10):
        print(f"  [{msg['type']}] {msg['from']} → {msg['to']}")

    print("\n" + "="*80)
    print("DEMO COMPLETE - Agentic system successfully optimized route!")
    print("="*80 + "\n")

    # Cancel agent tasks
    for task in agent_tasks:
        task.cancel()


if __name__ == "__main__":
    # Run the demo
    asyncio.run(demo_agentic_system())
