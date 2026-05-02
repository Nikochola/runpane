/**
 * Prism Schema — typed, agent-native surface descriptions.
 * Same JSON renders for humans (via React) and for agents (as a tool spec).
 */

export type FieldType =
  | { kind: "money"; currency: string }
  | { kind: "string"; maxLength?: number }
  | { kind: "vendor" }
  | { kind: "invoiceRef" }
  | { kind: "date" }
  | { kind: "enum"; values: string[] };

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  /** Pre-filled value (for review surfaces). */
  value?: unknown;
};

export type Action = {
  /** Short id, must be unique within surface. */
  id: string;
  label: string;
  /** Capability the gateway will check. */
  capability: string;
  /** Maps surface fields → intent payload keys. */
  bind: Record<string, string>;
  /** Whether this action moves money (UI hint + audit tag). */
  monetary?: boolean;
};

export type Surface = {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  actions: Action[];
  /** Server-stamped: which org / which agent this surface is for. */
  context: {
    orgId: string;
    agentId?: string;
    surfaceVersion: number;
  };
};

/** Render a Surface as an agent-facing tool description (for LLM prompting). */
export function surfaceToToolSpec(surface: Surface) {
  return {
    name: `surface_${surface.id}`,
    description: `${surface.title}${surface.description ? " — " + surface.description : ""}`,
    actions: surface.actions.map((a) => ({
      id: a.id,
      label: a.label,
      capability: a.capability,
      inputs: surface.fields
        .filter((f) => Object.values(a.bind).includes(f.name))
        .map((f) => ({ name: f.name, type: f.type, required: f.required })),
    })),
    fields: surface.fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      readonly: f.readonly,
      value: f.value,
    })),
  };
}
