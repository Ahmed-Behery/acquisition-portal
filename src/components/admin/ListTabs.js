import { useState } from 'react';
import Card from '@/components/common/Card';
import Banner from '@/components/common/Banner';
import { useActions } from '@/hooks/useActions';
import { useAppState } from '@/hooks/useAppStore';

/** A row of inputs plus an add button, shared by the editable reference lists. */
function AddRow({ children, onAdd, label }) {
  return (
    <div className="adm-row-input">
      {children}
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        {label}
      </button>
    </div>
  );
}

function DeleteCell({ onDelete }) {
  return (
    <td>
      <span className="del-x" onClick={onDelete} role="button" tabIndex={0} title="Delete">
        ✕
      </span>
    </td>
  );
}

export function IndustriesTab({ canEdit }) {
  const state = useAppState();
  const actions = useActions();
  const [name, setName] = useState('');

  const add = () => {
    if (actions.admin.addIndustry(name).ok) setName('');
  };

  return (
    <Card
      title="Industries"
      titleNote={`· ${state.industries.length} items · source: Industries document (auto-updates the New Entry dropdown)`}
    >
      <table className="adm-table">
        <thead>
          <tr>
            <th>Industry</th>
            {canEdit ? <th style={{ width: 60 }} /> : null}
          </tr>
        </thead>
        <tbody>
          {state.industries.map((industry) => (
            <tr key={industry.id}>
              <td>{industry.name}</td>
              {canEdit ? <DeleteCell onDelete={() => actions.admin.deleteIndustry(industry.id)} /> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {canEdit ? (
        <AddRow onAdd={add} label="Add industry">
          <input
            type="text"
            placeholder="Add a new industry…"
            aria-label="New industry"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </AddRow>
      ) : null}
    </Card>
  );
}

export function ProductsTab({ canEdit }) {
  const state = useAppState();
  const actions = useActions();
  const [draft, setDraft] = useState({ name: '', category: '' });

  const add = () => {
    if (actions.admin.addProduct(draft).ok) setDraft({ name: '', category: '' });
  };

  return (
    <Card
      title="Products"
      titleNote={`· ${state.products.length} items · source: Products document (feeds the catalogue & New Entry)`}
    >
      <table className="adm-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            {canEdit ? <th style={{ width: 60 }} /> : null}
          </tr>
        </thead>
        <tbody>
          {state.products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td className="muted">{product.category || ''}</td>
              {canEdit ? <DeleteCell onDelete={() => actions.admin.deleteProduct(product.id)} /> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {canEdit ? (
        <AddRow onAdd={add} label="Add product">
          <input
            type="text"
            placeholder="New product name…"
            aria-label="New product name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Category"
            aria-label="New product category"
            style={{ maxWidth: 160 }}
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
        </AddRow>
      ) : null}
    </Card>
  );
}

export function EgyptSourceTab({ canEdit }) {
  const state = useAppState();
  const actions = useActions();
  const [name, setName] = useState('');

  const add = () => {
    if (actions.admin.addEgyptCompany(name).ok) setName('');
  };

  return (
    <Card title="Egypt company source" titleNote={`· ${state.egyptCompanies.length} fallback entries`}>
      <Banner tone="info" className="mb-2">
        The prospect-name dropdown queries the live <b>OpenCorporates Egypt</b> reconciliation API first; if it&apos;s
        unavailable, it falls back to this curated list. Add companies here to extend the fallback.
      </Banner>
      <table className="adm-table">
        <thead>
          <tr>
            <th>Company</th>
            {canEdit ? <th style={{ width: 60 }} /> : null}
          </tr>
        </thead>
        <tbody>
          {state.egyptCompanies.map((company) => (
            <tr key={company.id}>
              <td>{company.name}</td>
              {canEdit ? <DeleteCell onDelete={() => actions.admin.deleteEgyptCompany(company.id)} /> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {canEdit ? (
        <AddRow onAdd={add} label="Add company">
          <input
            type="text"
            placeholder="Add an Egyptian company to the fallback list…"
            aria-label="New Egyptian company"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </AddRow>
      ) : null}
    </Card>
  );
}
