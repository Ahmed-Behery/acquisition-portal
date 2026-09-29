import { useState } from 'react';
import Card from '@/components/common/Card';
import { ProductSubStatusBadge, StatusBadge } from '@/components/common/badges';
import { PRODUCT_SUBSTATUS } from '@/constants/pipeline';
import { pipeProductLines } from '@/domain/pipelineRules';
import { selectProduct, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';

/** Each product on the entry is negotiated and tracked separately. */
export default function ProductLinesCard({ state, entry, canEdit }) {
  const lines = pipeProductLines(entry);

  return (
    <Card
      className="mt-2"
      title="Products & negotiation status"
      titleNote={
        <>
          · each product tracked separately, alongside the overall approach (<StatusBadge status={entry.status} />)
        </>
      }
    >
      <div className="small muted mb-2">
        The main product(s) plus any product added when a leader flagged interest. The RM updates each product’s stage.
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Product</th>
            <th>Added by</th>
            <th>Product stage</th>
            {canEdit ? <th style={{ width: 220 }}>Update</th> : null}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <ProductLineRow key={line.productId} state={state} entry={entry} line={line} canEdit={canEdit} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ProductLineRow({ state, entry, line, canEdit }) {
  const actions = useActions();
  const [subStatus, setSubStatus] = useState(line.subStatus);
  const addedBy = line.addedBy ? selectUser(state, line.addedBy) : null;

  return (
    <tr>
      <td className="name">
        {selectProduct(state, line.productId)?.name || line.productId}
        {line.main ? null : (
          <span className="small" style={{ color: 'var(--primary)' }}>
            {' '}
            · added via interest
          </span>
        )}
      </td>
      <td className="small muted">
        {addedBy ? `${addedBy.name}${line.addedByRole ? ' · ' + line.addedByRole : ''}` : '—'}
      </td>
      <td>
        <ProductSubStatusBadge status={line.subStatus} />
      </td>
      {canEdit ? (
        <td>
          <div className="flex" style={{ gap: 6 }}>
            <select
              aria-label={`Stage for ${selectProduct(state, line.productId)?.name || line.productId}`}
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                border: '1px solid var(--line-strong)',
                borderRadius: 5,
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              {PRODUCT_SUBSTATUS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => actions.pipeline.setProductSubStatus(entry.id, line.productId, subStatus)}
            >
              Save
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  );
}
