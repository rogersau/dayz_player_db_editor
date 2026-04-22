import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/types';

interface InventoryTreeProps {
  items: InventoryItem[];
  showMetadata?: boolean;
}

export function InventoryTree({ items, showMetadata = false }: InventoryTreeProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-xs text-muted-foreground">
        This player has no parsed inventory items.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <InventoryNode key={`${item.parent}-${item.persistentGuid}-${item.classname}`} item={item} expanded showMetadata={showMetadata} />
      ))}
    </div>
  );
}

interface InventoryNodeProps {
  item: InventoryItem;
  expanded?: boolean;
  showMetadata: boolean;
}

function InventoryNode({ item, expanded = false, showMetadata }: InventoryNodeProps) {
  const cargoChildren = item.children.filter((child) => child.slot === 'cargo');
  const attachmentChildren = item.children.filter((child) => child.slot !== 'cargo');

  return (
    <details className="rounded-md border bg-card/70 px-2.5 py-2 text-xs shadow-sm" open={expanded}>
      <summary className="cursor-pointer font-medium leading-5 marker:text-muted-foreground">
        {item.classname}
      </summary>
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge className="normal-case tracking-normal" variant="outline">Slot {item.slot || '—'}</Badge>
          {item.children.length > 0 && (
            <Badge className="normal-case tracking-normal" variant="secondary">
              {item.children.length} child{item.children.length === 1 ? '' : 'ren'}
            </Badge>
          )}
        </div>
        {showMetadata && (
          <dl className="space-y-1 text-[11px] leading-4 text-muted-foreground">
            <div className="grid gap-1 sm:grid-cols-[78px_minmax(0,1fr)]">
              <dt className="font-medium text-foreground/80">Persistent</dt>
              <dd className="break-all font-mono">{item.persistentGuid}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[78px_minmax(0,1fr)]">
              <dt className="font-medium text-foreground/80">Owner UID</dt>
              <dd className="break-all font-mono">{item.parent}</dd>
            </div>
          </dl>
        )}
      </div>
      {item.children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-border/70 pl-3">
          {cargoChildren.length > 0 && <InventoryGroup title="Cargo" items={cargoChildren} showMetadata={showMetadata} />}
          {attachmentChildren.length > 0 && <InventoryGroup title="Attachments" items={attachmentChildren} showMetadata={showMetadata} />}
        </div>
      )}
    </details>
  );
}

interface InventoryGroupProps {
  title: string;
  items: InventoryItem[];
  showMetadata: boolean;
}

function InventoryGroup({ title, items, showMetadata }: InventoryGroupProps) {
  return (
    <details className="rounded-md border border-border/80 bg-background/35 px-2.5 py-2 text-xs" open>
      <summary className="cursor-pointer font-medium text-foreground/90 marker:text-muted-foreground">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </summary>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <InventoryNode key={`${item.parent}-${item.persistentGuid}-${item.classname}`} item={item} showMetadata={showMetadata} />
        ))}
      </div>
    </details>
  );
}
