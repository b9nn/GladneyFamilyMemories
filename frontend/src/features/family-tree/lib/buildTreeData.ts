import type { Node as RtNode } from 'relatives-tree/lib/types';
import type { FamilyMember, FamilyRelationship } from '@/types/api';

/**
 * relatives-tree uses `const enum Gender` / `const enum RelType` in its
 * .d.ts files, which TypeScript cannot inline under `isolatedModules`.
 * We define a local compatible shape using string literals (the actual
 * runtime values match), then cast to `RtNode[]` for the calcTree call.
 */
type RtGender = 'male' | 'female';
type RtRelType = 'blood' | 'married' | 'divorced' | 'adopted' | 'half';

interface RtRelation {
  id: string;
  type: RtRelType;
}

interface RtNodeInput {
  id: string;
  gender: RtGender;
  parents: RtRelation[];
  children: RtRelation[];
  siblings: RtRelation[];
  spouses: RtRelation[];
}

/**
 * Convert our DB shape (members + relationships) into the relatives-tree
 * input format. Members with NULL gender default to 'male' for layout
 * purposes only — does not modify the DB.
 */
export function buildTreeData(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
): RtNode[] {
  const byId: Record<string, RtNodeInput> = {};
  for (const m of members) {
    const g: RtGender = m.gender === 'female' ? 'female' : 'male';
    byId[String(m.id)] = {
      id: String(m.id),
      gender: g,
      parents: [],
      children: [],
      siblings: [],
      spouses: [],
    };
  }
  for (const r of relationships) {
    const a = byId[String(r.person_a_id)];
    const b = byId[String(r.person_b_id)];
    if (!a || !b) continue;
    if (r.relationship_type === 'parent_child') {
      // person_a is parent, person_b is child
      a.children.push({ id: b.id, type: 'blood' });
      b.parents.push({ id: a.id, type: 'blood' });
    } else if (r.relationship_type === 'spouse') {
      a.spouses.push({ id: b.id, type: 'married' });
      b.spouses.push({ id: a.id, type: 'married' });
    } else if (r.relationship_type === 'sibling') {
      a.siblings.push({ id: b.id, type: 'blood' });
      b.siblings.push({ id: a.id, type: 'blood' });
    }
  }
  // Cast to RtNode[] — string literal values match the const enum runtime values
  return Object.values(byId) as unknown as RtNode[];
}

export function pickRootId(nodes: RtNode[], members: FamilyMember[]): string {
  // Prefer a node that has children but no parents (top of tree)
  const rootCandidate = nodes.find((n) => n.parents.length === 0 && n.children.length > 0);
  if (rootCandidate) return rootCandidate.id;
  // Fall back to oldest member by birth_date
  const sorted = [...members].sort((a, b) => {
    if (!a.birth_date) return 1;
    if (!b.birth_date) return -1;
    return a.birth_date.localeCompare(b.birth_date);
  });
  return String(sorted[0]?.id ?? members[0]?.id ?? '0');
}
