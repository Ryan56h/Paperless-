import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ZaloPreview from '../../components/common/ZaloPreview';
import SMSPreview from '../../components/common/SMSPreview';

interface DraftInvoice {
  phone: string;
  customerName: string;
  channel: 'zalo' | 'sms' | 'both';
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  requirePayment?: boolean;
}

function generateInvoiceId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `PL-${date}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

export default function SendConfirmation() {
  const navigate = useNavigate();
  const [successInfo, setSuccessInfo] = useState<{
    phone: string;
    customerName: string;
    channelLabel: string;
    channel: 'zalo' | 'sms' | 'both';
    items: { id: string; name: string; quantity: number; unitPrice: number }[];
    total: number;
    requirePayment: boolean;
  } | null>(null);
  const [invoiceId] = useState(generateInvoiceId);

  const rawDraft = sessionStorage.getItem('invoiceDraft');
  const draft: DraftInvoice | null = rawDraft ? JSON.parse(rawDraft) : null;

  const [activePreviewTab, setActivePreviewTab] = useState<'zalo' | 'sms'>(() => {
    return draft?.channel === 'sms' ? 'sms' : 'zalo';
  });
  const [activeSuccessTab, setActiveSuccessTab] = useState<'zalo' | 'sms'>('zalo');

  const handleSend = () => {
    if (draft) {
      const channelLabel = draft.channel === 'zalo' ? 'Zalo' : draft.channel === 'sms' ? 'SMS' : 'Zalo + SMS';
      setSuccessInfo({
        phone: draft.phone,
        customerName: draft.customerName,
        channelLabel,
        channel: draft.channel,
        items: draft.items,
        total: draft.total,
        requirePayment: draft.requirePayment ?? true,
      });
      setActiveSuccessTab(draft.channel === 'sms' ? 'sms' : 'zalo');

      // Save custom invoice payload to localStorage so CustomerInvoice can display it dynamically
      const createdInvoice = {
        id: invoiceId,
        customerName: draft.customerName,
        customerPhone: draft.phone,
        branch: 'FreshMart Chi nhánh Q1',
        staffName: 'Nguyễn Bảo Trân',
        items: draft.items,
        subtotal: draft.subtotal,
        discount: draft.discount,
        tax: draft.tax,
        total: draft.total,
        requirePayment: draft.requirePayment ?? true,
        paymentStatus: (draft.requirePayment ?? true) ? 'unpaid' : 'paid',
        createdAt: new Date().toISOString(),
        sendChannel: draft.channel,
        sendStatus: 'sent',
      };
      localStorage.setItem(`invoice-${invoiceId}`, JSON.stringify(createdInvoice));
    }
    sessionStorage.removeItem('invoiceDraft');
    sessionStorage.removeItem('posOrderDraft');
  };

  if (successInfo) {
    return (
      <PageLayout role="staff">
        <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[80vh] max-w-4xl mx-auto">
          <div className="text-center max-w-sm flex-1">
            <div className="w-16 h-16 rounded-full bg-[#55C244]/20 border-2 border-[#55C244] flex items-center justify-center mx-auto mb-5">
              <span className="text-[#55C244] text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Gửi thành công!</h2>
            <p className="text-text-muted text-sm mb-1">Hóa đơn đã được gửi tới <span className="text-text font-medium">{successInfo.phone}</span></p>
            <p className="text-text-muted text-sm mb-5">qua kênh <span className="text-text font-medium">{successInfo.channelLabel}</span></p>

            <div className="bg-surface-2 border border-border rounded-xl p-4 mb-5 text-left">
              <p className="text-[11px] text-text-dim uppercase tracking-wider mb-2">Mã hóa đơn</p>
              <p className="font-mono text-[#55C244] font-bold">{invoiceId}</p>
              <p className="text-[11px] text-text-dim mt-2">Link tra cứu:</p>
              <p className="text-[#55C244] text-xs font-mono">paperless.vn/invoice/{invoiceId}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Link to="/staff/invoice/new">
                <Button className="w-full">+ Tạo hóa đơn mới</Button>
              </Link>
              <Link to="/staff">
                <Button variant="ghost" className="w-full">Về trang bán hàng (POS)</Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-sm flex flex-col gap-3">
            {successInfo.channel === 'both' ? (
              <div className="flex gap-2 p-1 bg-surface-2 border border-border rounded-lg mb-2">
                <button
                  onClick={() => setActiveSuccessTab('zalo')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer text-center ${
                    activeSuccessTab === 'zalo'
                      ? 'bg-[#55C244] text-black font-bold'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Xem Zalo
                </button>
                <button
                  onClick={() => setActiveSuccessTab('sms')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer text-center ${
                    activeSuccessTab === 'sms'
                      ? 'bg-[#55C244] text-black font-bold'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Xem SMS
                </button>
              </div>
            ) : (
              <p className="text-xs text-text-dim mb-3 uppercase tracking-wider font-semibold text-center md:text-left">
                Giao diện tin nhắn {successInfo.channel === 'zalo' ? 'Zalo' : 'SMS'} đã gửi
              </p>
            )}

            {activeSuccessTab === 'zalo' && ['zalo', 'both'].includes(successInfo.channel) ? (
              <ZaloPreview
                invoiceId={invoiceId}
                customerName={successInfo.customerName}
                phone={successInfo.phone}
                items={successInfo.items}
                total={successInfo.total}
                requirePayment={successInfo.requirePayment}
              />
            ) : (
              <SMSPreview
                invoiceId={invoiceId}
                customerName={successInfo.customerName}
                phone={successInfo.phone}
                total={successInfo.total}
              />
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!draft) {
    return (
      <PageLayout role="staff">
        <div className="px-8 py-6">
          <p className="text-text-muted">Không có dữ liệu hóa đơn. <Link to="/staff/invoice/new" className="text-[#55C244]">Tạo mới</Link></p>
        </div>
      </PageLayout>
    );
  }

  const channelLabel = draft.channel === 'zalo' ? 'Zalo' : draft.channel === 'sms' ? 'SMS' : 'Zalo + SMS';
  const channelBadgeVariant = draft.channel === 'zalo' ? 'zalo' : draft.channel === 'sms' ? 'sms' : 'green';

  return (
    <PageLayout role="staff">
      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text">Xác nhận gửi hóa đơn</h1>
          <p className="text-text-dim text-sm mt-0.5">Kiểm tra lại trước khi gửi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Details */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Invoice preview */}
            <Card title="Xem trước hóa đơn" className="mb-1">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] text-text-dim uppercase tracking-wider mb-1">Mã hóa đơn (sẽ tạo)</p>
                    <p className="font-mono text-[#55C244] font-bold">{invoiceId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-dim mb-1">PaperLess+ · Chi nhánh Q1</p>
                    <p className="text-[11px] text-text-dim">{new Date().toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <p className="text-sm font-semibold text-text">{draft.customerName}</p>
                  <p className="text-text-muted text-xs">{draft.phone}</p>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-[1fr_50px_100px] gap-2 mb-2">
                    <span className="text-[11px] text-text-dim uppercase">Sản phẩm</span>
                    <span className="text-[11px] text-text-dim uppercase text-center">SL</span>
                    <span className="text-[11px] text-text-dim uppercase text-right">Thành tiền</span>
                  </div>
                  {draft.items.filter(i => i.name).map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_50px_100px] gap-2 py-1.5 border-b border-border">
                      <span className="text-sm text-text">{item.name}</span>
                      <span className="text-sm text-text-muted text-center">×{item.quantity}</span>
                      <span className="text-sm text-text text-right">{(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tạm tính</span>
                    <span className="text-text">{draft.subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {draft.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Chiết khấu</span>
                      <span className="text-[#EF4444]">-{draft.discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Thuế VAT (10%)</span>
                    <span className="text-text">{draft.tax.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border mt-1">
                    <span className="text-text font-semibold">Tổng cộng</span>
                    <span className="text-[#55C244] font-bold text-base">{draft.total.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Send info */}
            <Card title="Thông tin gửi" className="mb-1">
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">Số điện thoại đích</span>
                  <span className="text-text font-medium">{draft.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">Kênh gửi</span>
                  <Badge variant={channelBadgeVariant as 'zalo' | 'sms' | 'green'}>{channelLabel}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">Nội dung tin nhắn SMS</span>
                  <span className="text-text-muted text-xs text-right max-w-xs">
                    "[PaperLess+] Cảm ơn {draft.customerName}! HĐ {invoiceId} — {draft.total.toLocaleString('vi-VN')}đ. Xem: paperless.vn/invoice/{invoiceId}"
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 mt-2">
              <Button variant="ghost" onClick={() => navigate('/staff/invoice/new')}>Quay lại chỉnh sửa</Button>
              <Button onClick={handleSend}>Xác nhận gửi</Button>
            </div>
          </div>

          {/* Right Column: Previews */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {draft.channel === 'both' ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Xem trước tin nhắn</h3>
                  <div className="flex bg-surface-2 border border-border p-0.5 rounded-lg w-32">
                    <button
                      onClick={() => setActivePreviewTab('zalo')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer text-center ${
                        activePreviewTab === 'zalo'
                          ? 'bg-[#55C244] text-black'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      Zalo
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('sms')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer text-center ${
                        activePreviewTab === 'sms'
                          ? 'bg-[#55C244] text-black'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      SMS
                    </button>
                  </div>
                </div>

                {activePreviewTab === 'zalo' ? (
                  <ZaloPreview
                    invoiceId={invoiceId}
                    customerName={draft.customerName}
                    phone={draft.phone}
                    items={draft.items}
                    total={draft.total}
                    requirePayment={draft.requirePayment ?? true}
                  />
                ) : (
                  <SMSPreview
                    invoiceId={invoiceId}
                    customerName={draft.customerName}
                    phone={draft.phone}
                    total={draft.total}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                  Xem trước tin nhắn gửi qua {draft.channel === 'zalo' ? 'Zalo' : 'SMS'}
                </h3>
                {draft.channel === 'zalo' ? (
                  <ZaloPreview
                    invoiceId={invoiceId}
                    customerName={draft.customerName}
                    phone={draft.phone}
                    items={draft.items}
                    total={draft.total}
                    requirePayment={draft.requirePayment ?? true}
                  />
                ) : (
                  <SMSPreview
                    invoiceId={invoiceId}
                    customerName={draft.customerName}
                    phone={draft.phone}
                    total={draft.total}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
