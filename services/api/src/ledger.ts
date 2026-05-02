import { sql } from "./db.js";

const startOfDay = (t = Date.now()) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const startOfMonth = (t = Date.now()) => {
  const d = new Date(t);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export async function spendToday(agentId: string): Promise<number> {
  const rows = await sql<{ s: string }[]>`
    SELECT COALESCE(SUM(amount_cents), 0)::bigint AS s FROM reservations
    WHERE agent_id = ${agentId} AND state = 'committed' AND created_at >= ${startOfDay()}
  `;
  return Number(rows[0]?.s ?? 0);
}

export async function spendMonth(agentId: string): Promise<number> {
  const rows = await sql<{ s: string }[]>`
    SELECT COALESCE(SUM(amount_cents), 0)::bigint AS s FROM reservations
    WHERE agent_id = ${agentId} AND state = 'committed' AND created_at >= ${startOfMonth()}
  `;
  return Number(rows[0]?.s ?? 0);
}

export async function reserve(agentId: string, amountCents: number): Promise<string> {
  const id = "rsv_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  await sql`
    INSERT INTO reservations(id, agent_id, amount_cents, state, created_at)
    VALUES (${id}, ${agentId}, ${amountCents}, 'reserved', ${Date.now()})
  `;
  return id;
}

export async function commit(reservationId: string): Promise<void> {
  await sql`UPDATE reservations SET state = 'committed' WHERE id = ${reservationId}`;
}

export async function release(reservationId: string): Promise<void> {
  await sql`
    UPDATE reservations SET state = 'released', released_at = ${Date.now()} WHERE id = ${reservationId}
  `;
}
