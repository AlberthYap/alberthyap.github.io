import type { z } from 'zod'

import { ProjectSchema } from '~~/shared/schemas/project'
import { ToolSchema } from '~~/shared/schemas/tool'

/**
 * Domain types — derived from Zod schemas (architecture.md §9.2 single-source-of-truth pattern).
 * Never hand-write; always use `z.infer` so types stay locked to the schema.
 *
 * Re-export the schemas themselves for runtime validation in routes, forms,
 * and components (no second copy of the schema elsewhere in the codebase).
 */
export type Project = z.infer<typeof ProjectSchema>
export type Tool = z.infer<typeof ToolSchema>

export { ProjectSchema, ToolSchema }
