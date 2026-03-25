const AGENT_NAMES = ["Orchestrator", "DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"];

export class SessionMemory {
  constructor() {
    this.events = [];
  }

  add(event) {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString()
    });
  }

  getAll() {
    return [...this.events];
  }
}

/**
 * Global orchestrator trail + one SessionMemory per agent (persistent per-agent context).
 */
export class MemoryHub {
  constructor() {
    this.global = new SessionMemory();
    this.byAgent = {};
    for (const name of AGENT_NAMES) {
      this.byAgent[name] = new SessionMemory();
    }
  }

  /** @deprecated use addGlobal */
  add(event) {
    this.global.add(event);
  }

  addGlobal(event) {
    this.global.add(event);
  }

  addForAgent(agentName, event) {
    const mem = this.byAgent[agentName];
    if (!mem) {
      this.global.add({ ...event, agentName, orphanAgent: true });
      return;
    }
    mem.add({ ...event, agent: agentName });
  }

  /**
   * Flattened timeline for dashboards / GET history (backward compatible array).
   */
  getAll() {
    const flat = [];
    for (const e of this.global.getAll()) {
      flat.push({ ...e, memoryScope: "global" });
    }
    for (const name of AGENT_NAMES) {
      for (const e of this.byAgent[name].getAll()) {
        flat.push({ ...e, memoryScope: name });
      }
    }
    return flat.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  }

  getStructured() {
    return {
      global: this.global.getAll(),
      byAgent: Object.fromEntries(AGENT_NAMES.map((n) => [n, this.byAgent[n].getAll()]))
    };
  }
}
