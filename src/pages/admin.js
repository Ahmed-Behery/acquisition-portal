import Link from 'next/link';
import { useRouter } from 'next/router';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import { EgyptSourceTab, IndustriesTab, ProductsTab } from '@/components/admin/ListTabs';
import RecipientsTab from '@/components/admin/RecipientsTab';
import CodesTab from '@/components/admin/CodesTab';
import EmailLogTab from '@/components/admin/EmailLogTab';
import { ROLES } from '@/constants/roles';
import { useCurrentUser } from '@/hooks/useAppStore';
import { clsx } from '@/utils/clsx';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

const BASE_TABS = [
  { key: 'industries', label: 'Industries' },
  { key: 'products', label: 'Products' },
  { key: 'egypt', label: 'Egypt company source' },
  { key: 'recipients', label: 'Notification recipients' },
  { key: 'codes', label: 'Codes & access' },
];

const ADMIN_TAB = { key: 'email', label: 'Admin email log' };

const EDITOR_ROLES = [ROLES.ADMIN, ROLES.HEAD_OF_PRODUCTS];

/** Reference lists, recipients, codes and the admin alert log. */
export default function AdminPage() {
  const router = useRouter();
  const user = useCurrentUser();

  const isAdmin = user.role === ROLES.ADMIN;
  const canEdit = EDITOR_ROLES.includes(user.role);
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  const requested = router.query.tab;
  const active = tabs.some((t) => t.key === requested) ? requested : 'industries';

  const PANELS = {
    industries: <IndustriesTab canEdit={canEdit} />,
    products: <ProductsTab canEdit={canEdit} />,
    egypt: <EgyptSourceTab canEdit={canEdit} />,
    recipients: <RecipientsTab isAdmin={isAdmin} />,
    codes: <CodesTab />,
    email: <EmailLogTab />,
  };

  return (
    <>
      <PageMeta
        title="Admin & Lists"
        description="Reference lists, notification recipients, merchant codes and platform SLAs."
      />
      <PageHead
        title="Admin & Lists"
        subtitle={
          canEdit
            ? 'Edit the dropdown sources, the notification list, and view codes & access.'
            : 'View the reference lists. Editing is restricted to Admin and Head of Products.'
        }
      />

      {canEdit ? null : (
        <Banner tone="info" className="mb-2">
          You have <b>view-only</b> access to these lists. Add/delete is available to Admin and Head of Products.
        </Banner>
      )}

      <div className="adm-tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={routes.admin(tab.key)}
            className={clsx('adm-tab', active === tab.key && 'active')}
            style={{ textDecoration: 'none' }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {PANELS[active]}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
