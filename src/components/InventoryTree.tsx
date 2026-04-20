import type { InventoryItem } from '../types';

interface InventoryTreeProps {
  items: InventoryItem[];
}

export function InventoryTree({ items }: InventoryTreeProps) {
  if (items.length === 0) {
    return <div className="empty-list">This player has no parsed inventory items.</div>;
  }

  return (
    <div className="inventory-tree">
      {items.map((item) => (
        <InventoryNode key={`${item.parent}-${item.persistentGuid}-${item.classname}`} item={item} expanded />
      ))}
    </div>
  );
}

interface InventoryNodeProps {
  item: InventoryItem;
  expanded?: boolean;
}

function InventoryNode({ item, expanded = false }: InventoryNodeProps) {
  const cargoChildren = item.children.filter((child) => child.slot === 'cargo');
  const attachmentChildren = item.children.filter((child) => child.slot !== 'cargo');

  return (
    <details className="tree-node" open={expanded}>
      <summary>{item.classname}</summary>
      <div className="item-meta">
        <div>Slot: {item.slot || '—'}</div>
        <div>PersistentID: {item.persistentGuid}</div>
        <div>Owner UID: {item.parent}</div>
      </div>
      {item.children.length > 0 && (
        <div className="tree-children">
          {cargoChildren.length > 0 && <InventoryGroup title="Cargo" items={cargoChildren} />}
          {attachmentChildren.length > 0 && <InventoryGroup title="Attachments" items={attachmentChildren} />}
        </div>
      )}
    </details>
  );
}

interface InventoryGroupProps {
  title: string;
  items: InventoryItem[];
}

function InventoryGroup({ title, items }: InventoryGroupProps) {
  return (
    <details className="tree-node" open>
      <summary>{title}</summary>
      <div className="tree-children">
        {items.map((item) => (
          <InventoryNode key={`${item.parent}-${item.persistentGuid}-${item.classname}`} item={item} />
        ))}
      </div>
    </details>
  );
}
