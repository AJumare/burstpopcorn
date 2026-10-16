import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { getDeliverySchedule } from '@workspace/delivery-schedule';
import { useCreateManualOrder, useMarkManualOrderPaid } from '@workspace/api-client-react';
import type { AdminOrder, ManualOrderInput, ManualOrderResult } from '@workspace/api-client-react';

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  'bank-transfer': 'Bank transfer',
  cash: 'Cash',
  other: 'Other',
};

/** Current wall-clock time in Lagos as a datetime-local value. */
export function nowInWat() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

/** Treat a datetime-local value as WAT, never as the visitor's timezone. */
export function watToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const iso = `${value}:00+01:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

export function autoDelivery(value: string) {
  const iso = watToIso(value);
  if (!iso) return null;
  try {
    return getDeliverySchedule(iso);
  } catch {
    return null;
  }
}

export function failureMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const e = error as { status?: number; data?: { error?: string; message?: string } };
    if (e.status === 403) return 'This account cannot record orders.';
    const msg = e.data?.error ?? e.data?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
}

function Dialog({ title, kicker, onClose, busy, children, testId }: {
  title: string; kicker: string; onClose: () => void; busy: boolean; children: ReactNode; testId: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="manual-dialog"
      aria-labelledby={`${testId}-title`}
      onCancel={(e) => { e.preventDefault(); if (!busy) closeRef.current(); }}
      data-testid={testId}
    >
      <div className="manual-dialog-head">
        <div>
          <span className="manual-kicker">{kicker}</span>
          <h3 id={`${testId}-title`}>{title}</h3>
        </div>
        <button type="button" className="manual-close" onClick={onClose} disabled={busy} aria-label="Close" data-testid={`${testId}-close`}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="manual-field">
      <span className="manual-label">{label}</span>
      {children}
      {hint && <span className="manual-hint">{hint}</span>}
    </label>
  );
}

function DeliveryHint({ paidAt, override }: { paidAt: string; override: string }) {
  const schedule = autoDelivery(paidAt);
  if (override) return <>Override set. Leave empty to use the standard schedule.</>;
  return schedule ? <>Auto: {schedule.deliveryLabel} ({schedule.deliveryDate})</> : <>Pick a payment time to see the auto date.</>;
}

type Draft = {
  requestId: string; customerName: string; email: string; phone: string; address: string; state: string;
  caramel: string; brittle: string; total: string; paymentMethod: ManualOrderInput['paymentMethod'];
  paymentStatus: ManualOrderInput['paymentStatus']; paidAt: string; deliveryDate: string; sendConfirmation: boolean;
};

function freshDraft(): Draft {
  return {
    requestId: crypto.randomUUID(), customerName: '', email: '', phone: '', address: '', state: 'Abuja (FCT)',
    caramel: '0', brittle: '0', total: '', paymentMethod: 'bank-transfer', paymentStatus: 'paid',
    paidAt: nowInWat(), deliveryDate: '', sendConfirmation: true,
  };
}

export function ManualOrderDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (result: ManualOrderResult) => void }) {
  const [draft, setDraft] = useState<Draft>(freshDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateManualOrder();
  const busy = create.isPending;
  const paid = draft.paymentStatus === 'paid';
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const lineItems = useMemo(() => {
    const items: ManualOrderInput['lineItems'] = [];
    const c = Number(draft.caramel); const b = Number(draft.brittle);
    if (Number.isInteger(c) && c > 0) items.push({ flavor: 'salted-caramel', quantity: c });
    if (Number.isInteger(b) && b > 0) items.push({ flavor: 'peanut-brittle', quantity: b });
    return items;
  }, [draft.caramel, draft.brittle]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    if (lineItems.length === 0) return setFormError('Add at least one bag of Salted Caramel or Peanut Brittle.');
    const total = Number(draft.total);
    if (!Number.isInteger(total) || total < 1) return setFormError('Enter the total in whole naira, including delivery.');
    const paidIso = paid ? watToIso(draft.paidAt) : null;
    if (paid && !paidIso) return setFormError('Enter when the payment was received (WAT).');
    const data: ManualOrderInput = {
      requestId: draft.requestId,
      customerName: draft.customerName.trim(), email: draft.email.trim(), phone: draft.phone.trim(),
      address: draft.address.trim(), state: draft.state.trim(), lineItems, totalNaira: total,
      paymentMethod: draft.paymentMethod, paymentStatus: draft.paymentStatus,
      paidAt: paidIso, deliveryDate: draft.deliveryDate || null,
      sendConfirmation: paid ? draft.sendConfirmation : false,
    };
    create.mutate({ data }, {
      onSuccess: (result) => { setDraft(freshDraft()); onSaved(result); },
      onError: (err) => setFormError(failureMessage(err, 'The order was not saved. Your draft is kept; trying again will not create a duplicate.')),
    });
  }

  const submitLabel = busy ? 'Saving...' : !paid ? 'Save as pending' : draft.sendConfirmation ? 'Save & send confirmation' : 'Save order';

  return (
    <Dialog title="Record an outside order" kicker="WHATSAPP / TRANSFER / EVENT" onClose={onClose} busy={busy} testId="dialog-manual-order">
      <form className="manual-form" onSubmit={submit} noValidate={false}>
        <fieldset disabled={busy}>
          <legend className="manual-section">Customer</legend>
          <div className="manual-grid">
            <Field label="Full name"><input required minLength={2} maxLength={120} value={draft.customerName} onChange={(e) => set('customerName', e.target.value)} data-testid="input-manual-name" /></Field>
            <Field label="Phone"><input required type="tel" minLength={7} maxLength={30} value={draft.phone} onChange={(e) => set('phone', e.target.value)} data-testid="input-manual-phone" /></Field>
            <Field label="Email" hint="Confirmations are sent here."><input required type="email" maxLength={254} value={draft.email} onChange={(e) => set('email', e.target.value)} data-testid="input-manual-email" /></Field>
            <Field label="State"><input required minLength={2} maxLength={100} value={draft.state} onChange={(e) => set('state', e.target.value)} data-testid="input-manual-state" /></Field>
            <div className="manual-span"><Field label="Delivery address"><textarea required minLength={5} maxLength={1000} rows={2} value={draft.address} onChange={(e) => set('address', e.target.value)} data-testid="input-manual-address" /></Field></div>
          </div>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="manual-section">Bags & total</legend>
          <div className="manual-grid manual-grid-3">
            <Field label="Salted Caramel"><input type="number" min={0} max={10000} step={1} inputMode="numeric" value={draft.caramel} onChange={(e) => set('caramel', e.target.value)} data-testid="input-manual-salted-caramel" /></Field>
            <Field label="Peanut Brittle"><input type="number" min={0} max={10000} step={1} inputMode="numeric" value={draft.brittle} onChange={(e) => set('brittle', e.target.value)} data-testid="input-manual-peanut-brittle" /></Field>
            <Field label="Total (NGN)" hint="Including delivery."><input required type="number" min={1} step={1} inputMode="numeric" value={draft.total} onChange={(e) => set('total', e.target.value)} data-testid="input-manual-total" /></Field>
          </div>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="manual-section">Payment</legend>
          <div className="manual-grid">
            <Field label="Method">
              <select value={draft.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as Draft['paymentMethod'])} data-testid="select-manual-method">
                <option value="bank-transfer">Bank transfer</option><option value="cash">Cash</option><option value="other">Other</option>
              </select>
            </Field>
            <div className="manual-field">
              <span className="manual-label" id="manual-status-label">Status</span>
              <div className="manual-segment" role="radiogroup" aria-labelledby="manual-status-label">
                {(['paid', 'pending'] as const).map((s) => (
                  <label key={s} className={draft.paymentStatus === s ? 'is-on' : ''}>
                    <input type="radio" name="manual-status" value={s} checked={draft.paymentStatus === s} onChange={() => set('paymentStatus', s)} data-testid={`radio-manual-status-${s}`} />
                    {s === 'paid' ? 'Paid' : 'Awaiting payment'}
                  </label>
                ))}
              </div>
            </div>
            {paid && (
              <Field label="Paid at (WAT)" hint="Lagos time, whatever your device clock says."><input required type="datetime-local" value={draft.paidAt} onChange={(e) => set('paidAt', e.target.value)} data-testid="input-manual-paid-at" /></Field>
            )}
            <Field label="Delivery date override" hint={paid ? <DeliveryHint paidAt={draft.paidAt} override={draft.deliveryDate} /> : 'Optional. Set when the date is agreed, e.g. events.'}>
              <input type="date" value={draft.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} data-testid="input-manual-delivery-date" />
            </Field>
          </div>
          {paid ? (
            <label className="manual-toggle">
              <input type="checkbox" checked={draft.sendConfirmation} onChange={(e) => set('sendConfirmation', e.target.checked)} data-testid="checkbox-manual-send-confirmation" />
              <span>Email the customer a confirmation</span>
            </label>
          ) : (
            <p className="manual-note" data-testid="text-manual-pending-note">Pending orders are saved quietly. No email goes out until you mark it paid.</p>
          )}
        </fieldset>

        <p className="manual-note manual-note-strong">This only records the order. The customer is never charged from here.</p>
        {formError && <p className="manual-error" role="alert" data-testid="status-manual-error">{formError}</p>}
        <div className="manual-actions">
          <button type="button" className="manual-ghost" onClick={onClose} disabled={busy} data-testid="button-manual-cancel">Cancel</button>
          <button type="submit" className="manual-primary" disabled={busy} aria-busy={busy} data-testid="button-manual-save">{submitLabel}</button>
        </div>
      </form>
    </Dialog>
  );
}

export function MarkPaidDialog({ order, onClose, onSaved }: { order: AdminOrder; onClose: () => void; onSaved: (result: ManualOrderResult) => void }) {
  const [paidAt, setPaidAt] = useState(nowInWat);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDateOverridden ? order.deliveryDate ?? '' : '');
  const [send, setSend] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markPaid = useMarkManualOrderPaid();
  const busy = markPaid.isPending;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const iso = watToIso(paidAt);
    if (!iso) return setError('Enter when the payment was received (WAT).');
    setError(null);
    markPaid.mutate(
      { reference: order.reference, data: { paidAt: iso, deliveryDate: deliveryDate || null, sendConfirmation: send } },
      { onSuccess: onSaved, onError: (err) => setError(failureMessage(err, 'Payment was not recorded. Please try again.')) },
    );
  }

  return (
    <Dialog title={`Mark ${order.customerName} paid`} kicker={order.reference} onClose={onClose} busy={busy} testId="dialog-mark-paid">
      <form className="manual-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="manual-grid">
            <Field label="Paid at (WAT)" hint="Use the actual time the money arrived."><input required type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} data-testid="input-mark-paid-at" /></Field>
            <Field label="Delivery date override" hint={<DeliveryHint paidAt={paidAt} override={deliveryDate} />}><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} data-testid="input-mark-paid-delivery-date" /></Field>
          </div>
          <label className="manual-toggle">
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} data-testid="checkbox-mark-paid-send" />
            <span>Email the customer a confirmation</span>
          </label>
        </fieldset>
        {error && <p className="manual-error" role="alert" data-testid="status-mark-paid-error">{error}</p>}
        <div className="manual-actions">
          <button type="button" className="manual-ghost" onClick={onClose} disabled={busy} data-testid="button-mark-paid-cancel">Cancel</button>
          <button type="submit" className="manual-primary" disabled={busy} data-testid="button-mark-paid-save">{busy ? 'Saving...' : send ? 'Mark paid & send' : 'Mark paid'}</button>
        </div>
      </form>
    </Dialog>
  );
}
