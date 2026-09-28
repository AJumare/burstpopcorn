import { useState } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LockKeyhole,
  LogOut,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { getListAdminOrdersQueryKey, useListAdminOrders, useUpdateAdminOrderDelivery } from '@workspace/api-client-react';
import type { AdminOrder, AdminOrderPage } from '@workspace/api-client-react';
import './admin-orders.css';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const lagosDate = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const lagosTime = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function paidTime(value: string | null) {
  if (!value) return { date: 'Date unavailable', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: 'Date unavailable', time: '' };
  return { date: lagosDate.format(date), time: `${lagosTime.format(date)} WAT` };
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };
  return candidate.status ?? candidate.statusCode ?? candidate.response?.status;
}

function OrderRow({
  order,
  index,
  onDeliveryChange,
  deliveryDisabled,
  deliveryPending,
  deliveryError,
}: {
  order: AdminOrder;
  index: number;
  onDeliveryChange: (reference: string, delivered: boolean) => void;
  deliveryDisabled: boolean;
  deliveryPending: boolean;
  deliveryError?: string;
}) {
  const [copied, setCopied] = useState(false);
  const paid = paidTime(order.paidAt);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(order.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="orders-row" data-testid={`row-order-${index}`}>
      <div className="orders-cell orders-cell-order">
        <span className="orders-mobile-label">Order & contents</span>
        <div className="orders-reference-line">
          <span className="orders-reference" data-testid={`text-reference-${index}`} title={order.reference}>
            {order.reference}
          </span>
          <button
            className="orders-copy"
            type="button"
            onClick={copyReference}
            aria-label={`Copy reference ${order.reference}`}
            title={copied ? 'Copied' : 'Copy reference'}
            data-testid={`button-copy-reference-${index}`}
          >
            {copied ? <Check size={14} strokeWidth={2.2} /> : <Copy size={14} strokeWidth={1.8} />}
          </button>
        </div>
        <p className="orders-items" data-testid={`text-items-${index}`}>{order.items}</p>
      </div>

      <div className="orders-cell orders-cell-customer">
        <span className="orders-mobile-label">Customer</span>
        <strong className="orders-customer-name" data-testid={`text-customer-${index}`}>{order.customerName}</strong>
        <a className="orders-contact" href={`tel:${order.phone.replace(/[^\d+]/g, '')}`} data-testid={`link-phone-${index}`}>
          {order.phone}
        </a>
        {order.email ? (
          <a className="orders-contact orders-email" href={`mailto:${order.email}`} data-testid={`link-email-${index}`}>
            {order.email}
          </a>
        ) : (
          <span className="orders-muted" data-testid={`text-email-unavailable-${index}`}>No email supplied</span>
        )}
      </div>

      <div className="orders-cell orders-cell-delivery">
        <span className="orders-mobile-label">Delivery address</span>
        <p className="orders-address" data-testid={`text-address-${index}`}>{order.address}</p>
        <span className="orders-region" data-testid={`text-state-${index}`}>{order.state}</span>
      </div>

      <div className="orders-cell orders-cell-payment">
        <span className="orders-mobile-label">Payment</span>
        <strong className="orders-amount" data-testid={`text-total-${index}`}>{naira.format(order.totalNaira)}</strong>
        <span className="orders-paid" data-testid={`text-paid-at-${index}`}>{paid.date}</span>
        {paid.time && <span className="orders-paid-time">{paid.time}</span>}
      </div>

      <div className="orders-cell orders-cell-status">
        <span className="orders-mobile-label">Delivery status</span>
        <label className={`orders-delivery-control${order.deliveredAt ? ' is-delivered' : ''}`}>
          <input
            type="checkbox"
            checked={Boolean(order.deliveredAt)}
            disabled={deliveryDisabled}
            onChange={(event) => onDeliveryChange(order.reference, event.target.checked)}
            aria-label={`${order.deliveredAt ? 'Undo delivered status for' : 'Mark delivered'} ${order.reference}`}
            data-testid={`checkbox-delivered-${index}`}
          />
          <span>{deliveryPending ? 'Saving…' : order.deliveredAt ? 'Delivered' : 'Mark delivered'}</span>
        </label>
        {order.deliveredAt && <span className="orders-delivery-date">{paidTime(order.deliveredAt).date}</span>}
        {deliveryError && <span className="orders-delivery-error" role="alert" data-testid={`status-delivery-error-${index}`}>{deliveryError}</span>}
      </div>
    </article>
  );
}

function LoadingRows() {
  return (
    <div className="orders-loading" role="status" aria-label="Loading paid orders" data-testid="status-orders-loading">
      <span className="orders-sr-only">Loading paid orders…</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div className="orders-skeleton-row" key={index}>
          <div><i className="orders-skeleton sk-short" /><i className="orders-skeleton sk-long" /></div>
          <div><i className="orders-skeleton sk-medium" /><i className="orders-skeleton sk-short" /></div>
          <div><i className="orders-skeleton sk-long" /><i className="orders-skeleton sk-medium" /></div>
          <div><i className="orders-skeleton sk-short" /><i className="orders-skeleton sk-short" /></div>
          <div><i className="orders-skeleton sk-medium" /></div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  data,
  page,
  onPageChange,
  disabled,
}: {
  data: AdminOrderPage;
  page: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  return (
    <nav className="orders-pagination" aria-label="Order pages" data-testid="navigation-order-pages">
      <span className="orders-pagination-note">
        Showing <strong>{data.orders.length}</strong> {data.orders.length === 1 ? 'order' : 'orders'} on page {data.page}
      </span>
      <div className="orders-pagination-actions">
        <button
          type="button"
          className="orders-page-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || disabled}
          data-testid="button-previous-page"
        >
          <ChevronLeft size={17} /> <span>Previous</span>
        </button>
        <span className="orders-page-number" aria-current="page" data-testid="text-current-page">
          {String(data.page).padStart(2, '0')}
        </span>
        <button
          type="button"
          className="orders-page-button"
          onClick={() => onPageChange(page + 1)}
          disabled={!data.hasMore || disabled}
          data-testid="button-next-page"
        >
          <span>Next</span> <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [deliveryError, setDeliveryError] = useState<{ reference: string; message: string } | null>(null);
  const { signOut } = useClerk();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isError, error, refetch } = useListAdminOrders(
    { page },
    { query: { queryKey: [...getListAdminOrdersQueryKey({ page }), userId], retry: (count, failure) => errorStatus(failure) !== 403 && count < 2, staleTime: 30_000 } },
  );
  const forbidden = isError && errorStatus(error) === 403;
  const updateDelivery = useUpdateAdminOrderDelivery({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueriesData<AdminOrderPage>(
          {
            predicate: (query) => query.queryKey[0] === getListAdminOrdersQueryKey()[0]
              && query.queryKey[query.queryKey.length - 1] === userId,
          },
          (current) => current ? {
            ...current,
            orders: current.orders.map((order) => order.reference === updated.reference
              ? { ...order, deliveredAt: updated.deliveredAt }
              : order),
          } : current,
        );
        setDeliveryError(null);
      },
      onError: (failure, variables) => {
        setDeliveryError({
          reference: variables.reference,
          message: errorStatus(failure) === 403
            ? 'This account cannot update deliveries.'
            : 'Could not save. Please try again.',
        });
      },
    },
  });

  function changeDelivery(reference: string, delivered: boolean) {
    setDeliveryError(null);
    updateDelivery.mutate({ reference, data: { delivered } });
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="orders-desk">
      <header className="orders-topbar">
        <div className="orders-topbar-inner">
          <div className="orders-brand" aria-label="Burst Popcorn Co. private order desk">
            <span className="orders-brand-symbol" aria-hidden="true"><span /><span /><span /></span>
            <span className="orders-brand-wordmark">burst<span className="orders-brand-dot">.</span></span>
            <span className="orders-brand-divider" />
            <span className="orders-brand-desk">ORDER DESK</span>
          </div>
          <div className="orders-topbar-actions">
            <Link href="/" className="orders-shop-link" aria-label="Return to public shop" data-testid="link-back-to-shop">
              <span>View shop</span> <ArrowUpRight size={15} strokeWidth={1.8} />
            </Link>
            <span className="orders-action-divider" />
            <button
              type="button"
              className="orders-signout"
              onClick={() => void signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })}
              data-testid="button-sign-out"
              aria-label="Sign out of order desk"
            >
              <LogOut size={16} strokeWidth={1.8} /><span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="orders-content">
        <div className="orders-intro">
          <div className="orders-intro-main">
            <div className="orders-eyebrow"><span className="orders-eyebrow-line" /> THE PRIVATE COUNTER <span className="orders-eyebrow-line" /></div>
            <h1>Every order,<br /><em>in good hands.</em></h1>
            <p>Paid orders and delivery details, all in one place.</p>
          </div>
          <div className="orders-intro-aside">
            <span className="orders-aside-icon"><ShieldCheck size={22} strokeWidth={1.5} /></span>
            <div>
              <strong>Confirmed payments only</strong>
              <span>Orders appear here after Paystack confirms payment.</span>
            </div>
          </div>
        </div>

        <section className="orders-panel" aria-labelledby="orders-list-title">
          <div className="orders-panel-heading">
            <div>
              <div className="orders-panel-kicker"><span className="orders-live-dot" /> LIVE ORDER LIST</div>
              <h2 id="orders-list-title">Paid orders <span className="orders-heading-count" data-testid="text-orders-count">{data && !isError ? data.orders.length : '—'}</span></h2>
              <p>Newest confirmed payments first. Times shown in West Africa Time.</p>
            </div>
            <button
              type="button"
              className="orders-refresh"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label={isFetching ? 'Refreshing orders' : 'Refresh orders'}
              data-testid="button-refresh-orders"
            >
              <RefreshCw size={16} strokeWidth={1.8} className={isFetching ? 'orders-refreshing-icon' : ''} />
              <span>{isFetching && !isLoading ? 'Refreshing' : 'Refresh list'}</span>
            </button>
          </div>

          {isError ? (
            <div className="orders-state" role="alert" data-testid={forbidden ? 'status-orders-forbidden' : 'status-orders-error'}>
              <div className="orders-state-icon">{forbidden ? <LockKeyhole size={26} strokeWidth={1.5} /> : <RefreshCw size={26} strokeWidth={1.5} />}</div>
              <span className="orders-state-kicker">{forbidden ? 'ACCESS RESTRICTED' : 'COULD NOT LOAD ORDERS'}</span>
              <h3>{forbidden ? 'This desk is for the owner.' : 'The list didn’t come through.'}</h3>
              <p>{forbidden ? 'Your account doesn’t have permission to view paid orders. Contact the shop owner if this seems wrong.' : 'Your orders are safe. Check your connection and try loading the list again.'}</p>
              {!forbidden && <button type="button" className="orders-state-button" onClick={() => void refetch()} data-testid="button-retry-orders">Try again <ArrowUpRight size={16} /></button>}
              {forbidden && <Link href="/" className="orders-state-button" data-testid="link-forbidden-back-to-shop">Back to the shop <ArrowUpRight size={16} /></Link>}
            </div>
          ) : isLoading || !data ? (
            <LoadingRows />
          ) : data.orders.length === 0 ? (
            <>
              <div className="orders-state orders-empty" data-testid="status-orders-empty">
                <div className="orders-state-icon"><PackageOpen size={30} strokeWidth={1.35} /></div>
                <span className="orders-state-kicker">ALL CLEAR</span>
                <h3>No Burst orders on this page.</h3>
                <p>{data.hasMore ? 'There may be older orders on the next page.' : page === 1 ? 'When a customer completes payment, their order and delivery details will show up here.' : 'Check the previous page for more orders.'}</p>
              </div>
              <Pagination data={data} page={page} onPageChange={changePage} disabled={isFetching} />
            </>
          ) : (
            <>
              <div className="orders-table" data-testid="list-paid-orders">
                <div className="orders-table-head" aria-hidden="true">
                  <span>ORDER / ITEMS</span><span>CUSTOMER</span><span>DELIVERY TO</span><span>PAID</span><span>DELIVERED</span>
                </div>
                <div className="orders-table-body">
                  {data.orders.map((order, index) => (
                    <OrderRow
                      key={`${order.reference}-${index}`}
                      order={order}
                      index={index}
                      onDeliveryChange={changeDelivery}
                      deliveryDisabled={updateDelivery.isPending}
                      deliveryPending={updateDelivery.isPending && updateDelivery.variables?.reference === order.reference}
                      deliveryError={deliveryError?.reference === order.reference ? deliveryError.message : undefined}
                    />
                  ))}
                </div>
              </div>
              <Pagination data={data} page={page} onPageChange={changePage} disabled={isFetching} />
            </>
          )}
        </section>

        <footer className="orders-footer">
          <span><span className="orders-footer-mark">burst.</span> / The good stuff, on its way.</span>
          <span className="orders-footer-private"><LockKeyhole size={12} /> PRIVATE ORDER DESK</span>
        </footer>
      </div>
    </main>
  );
}