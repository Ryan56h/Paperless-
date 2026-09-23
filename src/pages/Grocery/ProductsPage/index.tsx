import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import AppLayout from '../../../components/layout/AppLayout';
import { useAuth } from '../../../context/AuthContext';
import type { CatalogProduct } from '../../../types';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

export default function GroceryProductsPage() {
  const { business } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const lastScanRef = useRef<{code: string, time: number}>({ code: '', time: 0 });

  // Fetch from backend
  useEffect(() => {
    if (business?.id) {
      fetchProducts();
    }
  }, [business?.id]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/product?tenantId=${business?.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name?: string;
    category?: string;
    price?: number | string;
    unit?: string;
    barcode?: string;
    popular?: boolean;
  }>({
    name: '', category: 'Khác', price: '', unit: 'Cái', barcode: ''
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 15, 
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          const now = Date.now();
          if (lastScanRef.current.code === decodedText && now - lastScanRef.current.time < 2000) return;
          lastScanRef.current = { code: decodedText, time: now };

          // Thành công
          scanner.clear().catch(e => console.log(e));
          setIsScanning(false);
          setFormData(prev => ({ ...prev, barcode: decodedText }));
          fetchProductInfo(decodedText);
        },
        () => {
          // Bỏ qua lỗi quét từng khung hình
        }
      );
      
      return () => {
        scanner.clear().catch(e => console.log(e));
      };
    }
  }, [isScanning]);

  const fetchProductInfo = async (barcode: string) => {
    setIsFetchingInfo(true);
    try {
      const res = await fetch(`/api/product/lookup-barcode/${barcode}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ 
          ...prev, 
          name: data.name,
          category: 'Khác' // Có thể cập nhật logic lấy từ API nếu có
        }));
      } else {
        alert(`Không tìm thấy thông tin sản phẩm (mã: ${barcode}) trên cơ sở dữ liệu Open Food Facts. Sản phẩm này có thể chưa được ai đóng góp lên hệ thống, bạn chịu khó nhập tay tên nhé!`);
      }
    } catch (err) {
      console.error(err);
      alert('Chưa kết nối được với API Backend để tra cứu mã vạch.');
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleOpenModal = (product?: CatalogProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, price: product.price });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Khác', price: '', unit: 'Cái', barcode: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setIsScanning(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined || formData.price === '') {
      alert('Vui lòng nhập tên và giá sản phẩm');
      return;
    }

    const payload = {
      tenantId: business?.id,
      name: formData.name,
      category: formData.category || 'Khác',
      price: Number(formData.price),
      unit: formData.unit || 'Cái',
      barcode: formData.barcode || '',
      popular: formData.popular || false
    };

    try {
      if (editingProduct) {
        // Cập nhật
        const res = await fetch(`/api/product/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts(products.map(p => p.id === updated.id ? updated : p));
        }
      } else {
        // Thêm mới
        const res = await fetch('/api/product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setProducts([created, ...products]);
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu sản phẩm');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const res = await fetch(`/api/product/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setProducts(products.filter(p => p.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-text">Quản lý sản phẩm</h1>
            <p className="text-text-dim text-sm mt-0.5">Tạp hóa Minh Phát</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-text text-bg text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            + Thêm sản phẩm
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, mã vạch..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text transition-colors"
          />
        </div>

        {/* Table (Desktop) */}
        <div className="hidden md:block bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider">Mã / Barcode</th>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider">Danh mục</th>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider text-right">Giá bán</th>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider text-center">ĐVT</th>
                <th className="px-4 py-3 font-semibold text-text-dim text-xs uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-text">{p.id}</div>
                      {p.barcode && <div className="text-[10px] text-text-muted mt-0.5">{p.barcode}</div>}
                    </td>
                    <td className="px-4 py-3 text-text font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-text-muted">{p.category}</td>
                    <td className="px-4 py-3 text-text font-semibold text-right">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-text-muted text-center">{p.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="text-xs text-text-muted hover:text-text mx-2 font-medium cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-error hover:opacity-80 font-medium cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* List View (Mobile) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.id} className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text text-sm">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-surface-2 border border-border rounded text-[10px] text-text-muted font-mono">{p.id}</span>
                      <span className="text-[11px] text-text-dim">{p.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-text text-sm">{formatCurrency(p.price)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">/ {p.unit}</p>
                  </div>
                </div>
                
                {p.barcode && (
                  <p className="text-[10px] text-text-dim">Mã vạch: <span className="font-mono">{p.barcode}</span></p>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-border border-dashed">
                  <button 
                    onClick={() => handleOpenModal(p)} 
                    className="text-xs font-medium text-text px-3 py-1.5 bg-surface-2 rounded-lg cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    className="text-xs font-medium text-[#EF4444] px-3 py-1.5 bg-[#FEF2F2] dark:bg-[#451A1A] rounded-lg cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-text-muted text-sm bg-surface rounded-xl border border-border">
              Không tìm thấy sản phẩm nào.
            </div>
          )}
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-text">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-text-muted hover:text-text text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-text-dim mb-1">Tên sản phẩm *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-dim mb-1">Giá bán (VNĐ) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price === undefined ? '' : formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-dim mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-dim mb-1">Mã vạch (Barcode)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.barcode}
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsScanning(!isScanning)}
                      className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-xs font-medium hover:text-text cursor-pointer whitespace-nowrap"
                    >
                      {isScanning ? 'Hủy quét' : '📷 Quét mã'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-dim mb-1">Danh mục</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
                  >
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Mì & Đồ ăn liền">Mì & Đồ ăn liền</option>
                    <option value="Bánh kẹo & Snack">Bánh kẹo & Snack</option>
                    <option value="Gia vị & Đồ khô">Gia vị & Đồ khô</option>
                    <option value="Hàng tiêu dùng">Hàng tiêu dùng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {isScanning && (
                <div className="border border-border rounded-lg overflow-hidden p-2">
                  <div id="reader" className="w-full"></div>
                </div>
              )}

              {isFetchingInfo && (
                <p className="text-xs text-brand animate-pulse text-center">Đang tra cứu thông tin sản phẩm...</p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-text bg-surface-2 hover:bg-border rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-bg bg-text hover:opacity-90 rounded-lg transition-opacity"
                >
                  {editingProduct ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
