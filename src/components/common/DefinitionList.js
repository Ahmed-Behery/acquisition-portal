import { Fragment } from 'react';

/**
 * The `.dl` key/value grid.
 * `items` is `[{ term, value, valueStyle }]`; falsy entries are skipped so callers
 * can build the list conditionally without wrapping every row in a ternary.
 */
export default function DefinitionList({ items, style }) {
  return (
    <dl className="dl" style={style}>
      {items.filter(Boolean).map(({ term, value, valueStyle }) => (
        <Fragment key={term}>
          <dt>{term}</dt>
          <dd style={valueStyle}>{value ?? '—'}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
