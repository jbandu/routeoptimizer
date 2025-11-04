# Copa Airlines Agentic Route Optimization - Quick Start

## What is This?

This is a **proof of concept** of the agentic AI architecture for Copa Airlines route optimization. It demonstrates how multiple autonomous agents can work together to optimize flight routes without constant human intervention.

## Difference from Current System

### Current System (LLM-Based)
```
Human → Request → Single LLM → Suggestion → Human Validates → Execute
```

### Agentic System
```
Human sets Goal → Multiple Agents Collaborate → Autonomous Optimization → Human Oversight
```

## Run the Demo

### Prerequisites
```bash
pip install asyncio  # Usually included in Python 3.7+
```

### Run
```bash
cd agents
python route_agents.py
```

### Expected Output
You'll see the agents working together in real-time:

```
================================================================================
COPA AIRLINES AGENTIC ROUTE OPTIMIZATION DEMO
================================================================================

✓ Registered 6 agents:
  - planner: goal_decomposition, task_assignment, workflow_management
  - weather: weather_monitoring, forecasting, turbulence_detection
  - fuel: fuel_pricing, tankering_analysis, cost_optimization
  - network: slot_management, connection_optimization, network_analysis
  - optimizer: route_optimization, multi_llm_comparison, decision_making
  - critic: performance_monitoring, anomaly_detection, feedback_generation

✓ Starting agent message loops...

--------------------------------------------------------------------------------
[Orchestrator] New goal set: Optimize PTY-BOG route for tomorrow

[Planner] Decomposing goal: Optimize PTY-BOG route for tomorrow
[Planner] Session: abc-123-xyz

[Weather] Fetching forecast for PTY-BOG
[Fuel] Analyzing fuel costs for PTY-BOG
[Network] Checking constraints for PTY-BOG

[Planner] Received data from weather
[Planner] Received data from fuel
[Planner] Received data from network

[Planner] All data collected. Triggering optimization...

[Optimizer] Running optimization...
  - Weather confidence: 0.85
  - Fuel savings: $450
  - Network status: minimal

[Optimizer] ✓ Optimization complete!
  Recommended: FL390
  Fuel savings: 450 lbs
  Confidence: 89%

[Critic] Stored prediction for monitoring

OPTIMIZATION RESULTS
--------------------------------------------------------------------------------
Recommended Altitude: 39,000 ft
Fuel Savings: 450 lbs
Time Impact: +2.5 minutes
Confidence: 89%
Auto-Approved: YES (confidence > 85%)

SYSTEM STATISTICS
--------------------------------------------------------------------------------
Total Messages: 12
Agent Performance:
  planner: 3 tasks, 100% success, 0.234s avg
  weather: 1 task, 100% success, 0.512s avg
  fuel: 1 task, 100% success, 0.301s avg
  ...
```

## Architecture Overview

### Agents

1. **Planner Agent** - Orchestrates the workflow
   - Decomposes goals into tasks
   - Delegates to specialized agents
   - Tracks progress

2. **Weather Agent** - Weather monitoring
   - Fetches real-time weather data
   - Monitors turbulence
   - Alerts on changes

3. **Fuel Agent** - Fuel optimization
   - Tracks fuel prices
   - Calculates tankering savings
   - Optimizes costs

4. **Network Agent** - Network management
   - Checks slot availability
   - Manages connections
   - Assesses network impact

5. **Optimizer Agent** - Route optimization
   - Uses multi-LLM comparison
   - Generates recommendations
   - Assesses confidence

6. **Critic Agent** - Quality control
   - Monitors actual outcomes
   - Compares predictions
   - Triggers re-optimization

### Communication Flow

```
┌─────────────┐
│ Orchestrator│ Sets Goal
└──────┬──────┘
       │
   ┌───▼────┐
   │ Planner│ Decomposes
   └───┬────┘
       │
   ┌───┴───────────────┐
   │                   │
┌──▼────┐        ┌─────▼──┐
│Weather│        │  Fuel  │
└──┬────┘        └─────┬──┘
   │                   │
   └──────┬────────────┘
          │
      ┌───▼─────┐
      │Optimizer│ Synthesizes
      └───┬─────┘
          │
      ┌───▼────┐
      │ Critic │ Monitors
      └────────┘
```

## Key Concepts

### 1. Autonomous Operation
Agents work independently without waiting for human input at each step.

### 2. Parallel Processing
Multiple agents work simultaneously to gather data faster.

### 3. Event-Driven
Agents react to events (weather changes, price updates, etc.) automatically.

### 4. Self-Correcting
Critic agent monitors outcomes and triggers re-optimization if needed.

### 5. Human Oversight
Humans set goals and approve high-risk decisions, but don't micromanage.

## Integration with Current System

This agent framework can be integrated with your existing multi-LLM optimizer:

1. **Optimizer Agent** calls your existing `/optimize-route-multi` endpoint
2. **Critic Agent** uses your `agent_executions` table for comparison
3. **Weather/Fuel Agents** use your existing Supabase tables
4. **Frontend** shows agent status in real-time dashboard

## Next Steps

### 1. Add Real Data Sources
Replace mock data with real API calls:
```python
# In WeatherAgent
async def get_weather_forecast(self, origin, destination):
    response = await fetch_openweathermap_api(...)
    return response.json()
```

### 2. Connect to Supabase
```python
from supabase import create_client

supabase = create_client(url, key)

# In agents
async def fetch_from_db(self, query):
    return await supabase.from_('table').select('*').execute()
```

### 3. Add More Agents
- **Crew Agent** - Crew scheduling
- **Maintenance Agent** - Aircraft availability
- **Compliance Agent** - Regulatory checks
- **Learning Agent** - ML model training

### 4. Build Dashboard
Create a React dashboard showing:
- Real-time agent status
- Message flow visualization
- Performance metrics
- Approval queue

### 5. Implement Policies
Add governance rules:
```python
if optimization_result['confidence'] < 0.85:
    require_human_approval()

if cost_delta > 5000:
    escalate_to_manager()
```

## Production Considerations

### Reliability
- Add error recovery and retry logic
- Implement circuit breakers
- Add health checks for each agent

### Scalability
- Deploy agents as separate services
- Use message queue (Redis, RabbitMQ)
- Scale agents independently

### Monitoring
- Track agent performance
- Log all decisions
- Alert on anomalies

### Security
- Authenticate agent communications
- Encrypt sensitive data
- Audit all actions

## FAQ

**Q: How is this different from the current multi-LLM optimizer?**
A: Current system requires human to trigger each optimization. Agentic system continuously monitors and optimizes autonomously.

**Q: Can I still use the current optimizer?**
A: Yes! The agentic system uses your current optimizer internally. It just adds autonomous orchestration around it.

**Q: Do agents replace dispatchers?**
A: No. Agents handle routine optimizations. Dispatchers provide oversight and handle exceptions.

**Q: What if an agent fails?**
A: Other agents continue working. The system is resilient to individual failures.

**Q: How do I control the agents?**
A: Set policies that define when agents need approval, what constraints to follow, and when to escalate.

## Resources

- **Architecture Doc**: `../AGENTIC_ARCHITECTURE.md`
- **Current System**: `../MULTI_LLM_FEATURE.md`
- **LangGraph Tutorial**: https://langchain-ai.github.io/langgraph/
- **Multi-Agent Patterns**: https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/

---

**Ready to transform Copa Airlines into an AI-powered autonomous operation! ✈️🤖**
