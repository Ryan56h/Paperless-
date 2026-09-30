using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;
using PaperLessApi.Models;

namespace PaperLessApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<StaffController> _logger;

    public StaffController(AppDbContext context, ILogger<StaffController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string? GetCallerUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
    }

    private async Task<(bool Allowed, string? TenantId, User? Caller, string? ErrorMessage)> ValidateCallerAsync(string? requestedTenantId = null)
    {
        var callerId = GetCallerUserId();
        if (string.IsNullOrEmpty(callerId))
        {
            return (false, null, null, "Không xác định được danh tính người dùng (token không hợp lệ).");
        }

        var caller = await _context.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == callerId);
        if (caller == null)
        {
            return (false, null, null, "Tài khoản của bạn không tồn tại trong hệ thống.");
        }

        // Claim check
        var roleClaim = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? caller.Role;

        // Check if admin
        if (roleClaim.Equals("admin", StringComparison.OrdinalIgnoreCase) || caller.Role.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            var adminTenantId = !string.IsNullOrWhiteSpace(requestedTenantId) ? requestedTenantId : caller.TenantId;
            return (true, adminTenantId, caller, null);
        }

        // Check if owner: role is owner OR caller is store owner of the tenant
        bool isStoreOwner = caller.Role.Equals("owner", StringComparison.OrdinalIgnoreCase)
                            || roleClaim.Equals("owner", StringComparison.OrdinalIgnoreCase)
                            || (caller.Tenant != null && (
                                (!string.IsNullOrEmpty(caller.Tenant.Email) && caller.Tenant.Email.Equals(caller.Email, StringComparison.OrdinalIgnoreCase)) ||
                                (!string.IsNullOrEmpty(caller.Tenant.Phone) && caller.Tenant.Phone == caller.Phone) ||
                                (!string.IsNullOrEmpty(caller.Tenant.OwnerName) && caller.Tenant.OwnerName.Equals(caller.FullName, StringComparison.OrdinalIgnoreCase))
                            ));

        if (!isStoreOwner)
        {
            return (false, null, caller, "Chỉ tài khoản Chủ cửa hàng (Owner) hoặc Quản trị viên (Admin) mới có quyền quản lý nhân viên.");
        }

        // Auto-heal role in DB if it was incorrectly marked as "staff"
        if (!caller.Role.Equals("owner", StringComparison.OrdinalIgnoreCase))
        {
            caller.Role = "owner";
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to auto-heal caller role: {Message}", ex.Message);
            }
        }

        var tenantId = !string.IsNullOrWhiteSpace(caller.TenantId) ? caller.TenantId : requestedTenantId;
        if (string.IsNullOrEmpty(tenantId))
        {
            return (false, null, caller, "Tài khoản của bạn chưa được liên kết với cửa hàng nào.");
        }

        return (true, tenantId, caller, null);
    }

    [HttpGet]
    public async Task<ActionResult<List<StaffDto>>> GetStaffList([FromQuery] string? tenantId)
    {
        var (allowed, tid, caller, errorMsg) = await ValidateCallerAsync(tenantId);
        if (!allowed)
        {
            return StatusCode(403, new { message = errorMsg });
        }

        var staffList = await _context.Users
            .Include(u => u.Branch)
            .Where(u => u.TenantId == tid && u.Role == "staff" && u.Id != caller!.Id)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new StaffDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                BusinessType = u.BusinessType,
                BranchId = u.BranchId,
                BranchName = u.Branch != null ? u.Branch.Name : null,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(staffList);
    }

    [HttpPost]
    public async Task<ActionResult<StaffDto>> CreateStaff([FromBody] CreateStaffRequest request, [FromQuery] string? tenantId)
    {
        var (allowed, tid, caller, errorMsg) = await ValidateCallerAsync(tenantId);
        if (!allowed)
        {
            return StatusCode(403, new { message = errorMsg });
        }

        var branchId = caller?.BranchId;
        var businessType = caller?.BusinessType ?? "grocery";

        // If caller doesn't have branch, grab first branch of tenant
        if (string.IsNullOrEmpty(branchId))
        {
            var firstBranch = await _context.Branches.FirstOrDefaultAsync(b => b.TenantId == tid);
            branchId = firstBranch?.Id;
        }

        var cleanPhone = request.Phone.Trim();
        var phoneExists = await _context.Users.AnyAsync(u => u.Phone == cleanPhone);
        if (phoneExists)
        {
            return BadRequest(new { message = $"Số điện thoại '{cleanPhone}' đã được sử dụng bởi một tài khoản khác trong hệ thống." });
        }

        string email;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            email = request.Email.Trim().ToLower();
            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
            {
                return BadRequest(new { message = $"Email '{email}' đã được sử dụng bởi một tài khoản khác trong hệ thống." });
            }
        }
        else
        {
            // Auto generate standard format username email for staff
            var safeTenantPrefix = tid!.Replace("-", "").Substring(0, Math.Min(6, tid.Replace("-", "").Length));
            email = $"{cleanPhone}@{safeTenantPrefix}.paperless.vn";
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
            {
                email = $"{cleanPhone}_{Guid.NewGuid().ToString("N")[..4]}@{safeTenantPrefix}.paperless.vn";
            }
        }

        var staff = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = cleanPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "staff",
            TenantId = tid,
            BranchId = branchId,
            BusinessType = businessType,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(staff);
        await _context.SaveChangesAsync();

        var branch = branchId != null ? await _context.Branches.FindAsync(branchId) : null;

        var resultDto = new StaffDto
        {
            Id = staff.Id,
            FullName = staff.FullName,
            Email = staff.Email,
            Phone = staff.Phone,
            Role = staff.Role,
            BusinessType = staff.BusinessType,
            BranchId = staff.BranchId,
            BranchName = branch?.Name,
            CreatedAt = staff.CreatedAt
        };

        return Ok(resultDto);
    }

    [HttpPut("{id}/reset-password")]
    public async Task<IActionResult> ResetStaffPassword(string id, [FromBody] UpdateStaffPasswordRequest request, [FromQuery] string? tenantId)
    {
        var (allowed, tid, _, errorMsg) = await ValidateCallerAsync(tenantId);
        if (!allowed)
        {
            return StatusCode(403, new { message = errorMsg });
        }

        var staff = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tid);
        if (staff == null)
        {
            return NotFound(new { message = "Không tìm thấy nhân viên trong cửa hàng này." });
        }

        staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã cập nhật mật khẩu mới cho nhân viên {staff.FullName}." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(string id, [FromQuery] string? tenantId)
    {
        var (allowed, tid, caller, errorMsg) = await ValidateCallerAsync(tenantId);
        if (!allowed)
        {
            return StatusCode(403, new { message = errorMsg });
        }

        if (caller!.Id == id)
        {
            return BadRequest(new { message = "Bạn không thể xóa chính tài khoản chủ quán của mình." });
        }

        var staff = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tid);
        if (staff == null)
        {
            return NotFound(new { message = "Không tìm thấy nhân viên cần xóa." });
        }

        if (staff.Role != "staff")
        {
            return BadRequest(new { message = "Chỉ có thể xóa tài khoản nhân viên." });
        }

        try
        {
            _context.Users.Remove(staff);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã xóa tài khoản nhân viên {staff.FullName} thành công." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning("Cannot delete staff {StaffId} due to foreign key: {Message}", id, ex.Message);
            return BadRequest(new
            {
                message = "Không thể xóa nhân viên này vì đã có dữ liệu hóa đơn liên kết trong lịch sử. Bạn có thể đổi mật khẩu để ngừng quyền đăng nhập của nhân viên này."
            });
        }
    }
}
