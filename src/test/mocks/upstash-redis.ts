type ScoreMember = { score: number; member: string };

type Transaction = {
  set: (key: string, value: unknown) => Transaction;
  zadd: (key: string, scoreMember: ScoreMember) => Transaction;
  zrem: (key: string, ...members: string[]) => Transaction;
  del: (...keys: string[]) => Transaction;
  hset: (key: string, kv: Record<string, unknown>) => Transaction;
  hdel: (key: string, ...fields: string[]) => Transaction;
  exec: () => Promise<unknown[]>;
};

// Mirrors the @upstash/redis behaviour the lead store relies on: JSON round trips,
// zrange ascending by score, mget rejecting zero keys like the real server, and hgetall
// reading a missing hash as null.
export class FakeRedis {
  execError: Error | null = null;
  private strings = new Map<string, string>();
  private sortedSets = new Map<string, Map<string, number>>();
  private hashes = new Map<string, Map<string, string>>();

  reset(): void {
    this.strings.clear();
    this.sortedSets.clear();
    this.hashes.clear();
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
      const hadHash = this.hashes.delete(key);
      if (hadString || hadSet || hadHash) removed += 1;
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

  async hset(key: string, kv: Record<string, unknown>): Promise<number> {
    const hash = this.hashes.get(key) ?? new Map<string, string>();
    this.hashes.set(key, hash);
    let added = 0;
    for (const [field, value] of Object.entries(kv)) {
      if (!hash.has(field)) added += 1;
      hash.set(field, typeof value === 'string' ? value : JSON.stringify(value));
    }
    return added;
  }

  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const hash = this.hashes.get(key);
    if (!hash || hash.size === 0) return null;
    return Object.fromEntries([...hash].map(([field, raw]) => [field, JSON.parse(raw)])) as T;
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const raw = this.hashes.get(key)?.get(field);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashes.get(key);
    let removed = 0;
    for (const field of fields) if (hash?.delete(field)) removed += 1;
    if (hash?.size === 0) this.hashes.delete(key);
    return removed;
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
      hset: (key, kv) => {
        queue.push(() => this.hset(key, kv));
        return transaction;
      },
      hdel: (key, ...fields) => {
        queue.push(() => this.hdel(key, ...fields));
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
    return [...this.strings.keys(), ...this.sortedSets.keys(), ...this.hashes.keys()].sort();
  }

  private read<T>(key: string): T | undefined {
    const raw = this.strings.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }
}
