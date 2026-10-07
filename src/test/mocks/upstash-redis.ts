type ScoreMember = { score: number; member: string };

type Transaction = {
  set: (key: string, value: unknown) => Transaction;
  zadd: (key: string, scoreMember: ScoreMember) => Transaction;
  zrem: (key: string, ...members: string[]) => Transaction;
  del: (...keys: string[]) => Transaction;
  exec: () => Promise<unknown[]>;
};

// Mirrors the @upstash/redis behaviour the lead store relies on: JSON round trips,
// zrange ascending by score, and mget rejecting zero keys like the real server.
export class FakeRedis {
  execError: Error | null = null;
  private strings = new Map<string, string>();
  private sortedSets = new Map<string, Map<string, number>>();

  reset(): void {
    this.strings.clear();
    this.sortedSets.clear();
    this.execError = null;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.read<T>(key) ?? null;
  }

  async set(key: string, value: unknown): Promise<'OK'> {
    this.strings.set(key, JSON.stringify(value));
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      const hadString = this.strings.delete(key);
      const hadSet = this.sortedSets.delete(key);
      if (hadString || hadSet) removed += 1;
    }
    return removed;
  }

  async mget<T extends unknown[]>(...keys: string[]): Promise<T> {
    if (keys.length === 0) throw new Error('ERR wrong number of arguments for mget');
    return keys.map((key) => this.read(key) ?? null) as T;
  }

  async zadd(key: string, { score, member }: ScoreMember): Promise<number> {
    const set = this.sortedSets.get(key) ?? new Map<string, number>();
    this.sortedSets.set(key, set);
    const added = set.has(member) ? 0 : 1;
    set.set(member, score);
    return added;
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const set = this.sortedSets.get(key);
    let removed = 0;
    for (const member of members) if (set?.delete(member)) removed += 1;
    if (set?.size === 0) this.sortedSets.delete(key);
    return removed;
  }

  async zrange<T extends unknown[]>(key: string, start: number, stop: number): Promise<T> {
    if (start !== 0 || stop !== -1) throw new Error('FakeRedis only supports zrange(key, 0, -1)');
    return this.members(key).map(([member]) => member) as T;
  }

  multi(): Transaction {
    const queue: (() => Promise<unknown>)[] = [];
    const transaction: Transaction = {
      set: (key, value) => {
        queue.push(() => this.set(key, value));
        return transaction;
      },
      zadd: (key, scoreMember) => {
        queue.push(() => this.zadd(key, scoreMember));
        return transaction;
      },
      zrem: (key, ...members) => {
        queue.push(() => this.zrem(key, ...members));
        return transaction;
      },
      del: (...keys) => {
        queue.push(() => this.del(...keys));
        return transaction;
      },
      exec: async () => {
        if (this.execError) {
          const error = this.execError;
          this.execError = null;
          throw error;
        }
        const results: unknown[] = [];
        for (const run of queue) results.push(await run());
        return results;
      },
    };
    return transaction;
  }

  record<T = unknown>(key: string): T | undefined {
    return this.read<T>(key);
  }

  members(key: string): [string, number][] {
    const set = this.sortedSets.get(key) ?? new Map<string, number>();
    return [...set].sort(([a, scoreA], [b, scoreB]) => scoreA - scoreB || a.localeCompare(b));
  }

  keys(): string[] {
    return [...this.strings.keys(), ...this.sortedSets.keys()].sort();
  }

  private read<T>(key: string): T | undefined {
    const raw = this.strings.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }
}
