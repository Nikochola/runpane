import { Intent, Ratchet, type RatchetState, type SealedIntent } from "@runpane/passport";

export type AgentSDKOptions = {
  baseUrl: string;
  agentId: string;
  /** Initial seed (hex). Caller must persist updates after every action. */
  seedHex: string;
  ratchetN?: number;
  /** Called whenever the ratchet advances — persist the new state. */
  onRatchetAdvance?: (state: RatchetState) => void | Promise<void>;
};

export type ExecuteResult =
  | { status: "executed"; receiptHash: string; result: unknown }
  | { status: "pending_approval"; approvalId: string; intentHash: string }
  | { status: "denied"; reason: string };

export class RunpaneAgent {
  private state: RatchetState;
  constructor(private opts: AgentSDKOptions) {
    this.state = {
      seedHex: opts.seedHex,
      publicKeyHex: "",
      n: opts.ratchetN ?? 0,
    };
  }

  async ready() {
    this.state = await Ratchet.fromSeed(this.opts.seedHex, this.opts.ratchetN ?? 0);
    return this;
  }

  get publicKey() {
    return this.state.publicKeyHex;
  }

  private async req<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.opts.baseUrl + path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", "x-agent-id": this.opts.agentId },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }

  async listSurfaces() {
    return this.req<{ surfaces: { id: string; title: string }[] }>(`/surfaces`);
  }

  async getSurface(id: string) {
    return this.req<{ surface: any }>(`/surfaces/${id}`);
  }

  /** Begin an action: get a fresh nonce + crystal hash from the gateway. */
  async beginAction() {
    return this.req<{ nonce: string; crystalHash: string; expiresAt: number }>(`/intents/begin`, {
      agentId: this.opts.agentId,
    });
  }

  async invoke(intent: SealedIntent["intent"]): Promise<ExecuteResult> {
    const begin = await this.beginAction();
    const sealed = await Intent.sealIntent(this.state, this.opts.agentId, begin.crystalHash, intent, {
      nonce: begin.nonce,
      ttlMs: 30_000,
    });
    const result = await this.req<ExecuteResult & { ratchetReceipt?: string }>(`/intents/execute`, {
      sealed,
    });

    if (result.status === "executed" && result.receiptHash) {
      this.state = await Ratchet.advance(this.state, result.receiptHash);
      await this.opts.onRatchetAdvance?.(this.state);
    }
    return result;
  }
}
