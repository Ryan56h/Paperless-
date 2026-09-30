import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchStaffListApi,
  createStaffApi,
  resetStaffPasswordApi,
  deleteStaffApi,
  type StaffMember,
  type CreateStaffPayload,
} from '../../services/staffApi';

export default function StaffManagementPage() {
  const { business, user } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal: Add staff
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<CreateStaffPayload>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal: Reset password
  const [resetModalStaff, setResetModalStaff] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Delete modal
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStaffListApi();
      setStaffList(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách nhân viên.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenAddModal = () => {
    setAddForm({
      fullName: '',
      phone: '',
      email: '',
      password: '',
    });
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addForm.fullName.trim() || addForm.fullName.trim().length < 2) {
      setAddError('Vui lòng nhập họ và tên nhân viên (tối thiểu 2 ký tự).');
      return;
    }

    if (!addForm.phone.trim()) {
      setAddError('Vui lòng nhập số điện thoại cho nhân viên.');
      return;
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(addForm.phone.trim())) {
      setAddError('Số điện thoại không hợp lệ (Phải đủ 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      return;
    }

    if (!addForm.password || addForm.password.length < 6) {
      setAddError('Mật khẩu khởi tạo phải có từ 6 ký tự trở lên.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStaffApi(addForm);
      setIsAddModalOpen(false);
      setSuccessMsg(`Đã tạo tài khoản cho nhân viên ${addForm.fullName} thành công!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadStaff();
    } catch (err: any) {
      setAddError(err?.message || 'Không thể tạo tài khoản nhân viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff) return;

    if (!newPassword || newPassword.length < 6) {
      setResetError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsResetting(true);
    setResetError(null);
    try {
      await resetStaffPasswordApi(resetModalStaff.id, newPassword);
      setSuccessMsg(`Đã cập nhật mật khẩu cho nhân viên ${resetModalStaff.fullName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setResetModalStaff(null);
      setNewPassword('');
    } catch (err: any) {
      setResetError(err?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      await deleteStaffApi(deletingStaff.id);
      setSuccessMsg(`Đã xóa tài khoản nhân viên ${deletingStaff.fullName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setDeletingStaff(null);
      loadStaff();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa tài khoản nhân viên.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-bg">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
                  Quản lý nhân viên
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {staffList.length} nhân viên
                </span>
              </div>
              <p className="text-xs md:text-sm text-text-muted mt-1">
                Cấp tài khoản và quản lý quyền đăng nhập cho nhân viên thu ngân / bán hàng tại {business?.name || 'cửa hàng'}.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#09261e] hover:bg-[#061c16] text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Cấp tài khoản nhân viên
            </button>
          </div>

          {/* Alert notification */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Tổng số nhân viên
              </span>
              <div className="text-2xl font-black text-text mt-1">{staffList.length}</div>
              <p className="text-[11px] text-text-dim mt-0.5">Tài khoản nhân viên được cấp</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Chi nhánh hoạt động
              </span>
              <div className="text-2xl font-black text-text mt-1">1</div>
              <p className="text-[11px] text-text-dim mt-0.5">Chi nhánh mặc định</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Chủ sở hữu (Owner)
              </span>
              <div className="text-2xl font-black text-text mt-1 truncate">
                {user?.fullName || business?.ownerName || 'Chủ shop'}
              </div>
              <p className="text-[11px] text-text-dim mt-0.5">Toàn quyền cấu hình & doanh thu</p>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text">Danh sách nhân viên</h2>
                <p className="text-xs text-text-muted">
                  Nhân viên có thể dùng SĐT và Mật khẩu được cấp để đăng nhập vào POS bán hàng.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-text-muted gap-2">
                <div className="w-6 h-6 border-2 border-text/20 border-t-text rounded-full animate-spin" />
                <span className="text-xs">Đang tải danh sách nhân viên...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-text">Chưa có nhân viên nào</h3>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Bạn là chủ cửa hàng. Hãy bấm nút bên dưới để cấp tài khoản cho thu ngân hoặc nhân viên bán hàng của bạn.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-[#09261e] hover:bg-[#061c16] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  + Cấp tài khoản nhân viên ngay
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/60 text-text-dim border-b border-border uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-5">Nhân viên</th>
                      <th className="py-3 px-5">Tài khoản đăng nhập (SĐT)</th>
                      <th className="py-3 px-5">Email</th>
                      <th className="py-3 px-5">Vai trò</th>
                      <th className="py-3 px-5">Ngày tạo</th>
                      <th className="py-3 px-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-text">
                    {staffList.map(staff => {
                      const initial = staff.fullName.charAt(0).toUpperCase();
                      const createdDate = new Date(staff.createdAt).toLocaleDateString('vi-VN');

                      return (
                        <tr key={staff.id} className="hover:bg-surface-2/40 transition-colors">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center shrink-0">
                                {initial}
                              </span>
                              <div>
                                <p className="font-bold text-text">{staff.fullName}</p>
                                <p className="text-[10px] text-text-dim">ID: {staff.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-5">
                            <span className="font-mono font-bold text-text bg-surface-2 px-2 py-1 rounded-md border border-border">
                              {staff.phone || 'Chưa cập nhật'}
                            </span>
                          </td>

                          <td className="py-3 px-5 text-text-muted">
                            {staff.email}
                          </td>

                          <td className="py-3 px-5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Thu ngân / Bán hàng
                            </span>
                          </td>

                          <td className="py-3 px-5 text-text-dim">
                            {createdDate}
                          </td>

                          <td className="py-3 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setResetModalStaff(staff);
                                  setNewPassword('');
                                  setResetError(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:text-text bg-surface-2 hover:bg-surface-2/80 border border-border rounded-lg transition-colors cursor-pointer"
                                title="Đổi mật khẩu"
                              >
                                Đổi mật khẩu
                              </button>
                              <button
                                onClick={() => setDeletingStaff(staff)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa nhân viên"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CREATE STAFF */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Cấp tài khoản nhân viên mới</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Tài khoản sẽ được tự động liên kết với {business?.name || 'cửa hàng'}.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-dim hover:text-text p-1 cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Họ và tên nhân viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={addForm.fullName}
                  onChange={e => setAddForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-2 border border-border focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Số điện thoại (Tên đăng nhập) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912345678"
                  value={addForm.phone}
                  onChange={e => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-2 border border-border focus:border-emerald-500 outline-none transition-colors"
                />
                <p className="text-[10px] text-text-dim mt-1">
                  Nhân viên sẽ dùng số điện thoại này để đăng nhập vào máy POS.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Email (Tuỳ chọn)
                </label>
                <input
                  type="email"
                  placeholder="VD: an.nv@gmail.com (không bắt buộc)"
                  value={addForm.email}
                  onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-2 border border-border focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="VD: 123456"
                  value={addForm.password}
                  onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-2 border border-border focus:border-emerald-500 outline-none transition-colors font-mono"
                />
                <p className="text-[10px] text-text-dim mt-1">
                  Tối thiểu 6 ký tự. Hãy gửi mật khẩu này cho nhân viên để họ đăng nhập.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface-2 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#09261e] hover:bg-[#061c16] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Xác nhận cấp tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Đổi mật khẩu nhân viên</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Nhân viên: <span className="font-bold text-text">{resetModalStaff.fullName}</span>
                </p>
              </div>
              <button
                onClick={() => setResetModalStaff(null)}
                className="text-text-dim hover:text-text p-1 cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-2 border border-border focus:border-emerald-500 outline-none transition-colors font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetModalStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface-2 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#09261e] hover:bg-[#061c16] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 animate-scale-in">
            <h3 className="text-base font-bold text-text">Xác nhận xóa tài khoản</h3>
            <p className="text-xs text-text-muted mt-2">
              Bạn có chắc chắn muốn xóa nhân viên <span className="font-bold text-text">{deletingStaff.fullName}</span> ({deletingStaff.phone})? Nhân viên này sẽ không thể đăng nhập vào quán được nữa.
            </p>

            <div className="pt-4 mt-4 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface-2 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
