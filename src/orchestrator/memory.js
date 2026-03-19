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
