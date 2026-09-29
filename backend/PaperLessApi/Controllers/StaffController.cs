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

[Authorize(Roles = "owner,admin")]
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

    private string? GetTenantId(string? requestedTenantId = null)
    {
        if (User.IsInRole("admin") && !string.IsNullOrWhiteSpace(requestedTenantId))
        {
            return requestedTenantId;
        }
        return User.FindFirstValue("tenant_id");
    }

    private string? GetCallerUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
    }

    [HttpGet]
    public async Task<ActionResult<List<StaffDto>>> GetStaffList([FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng." });
        }

        var staffList = await _context.Users
            .Include(u => u.Branch)
            .Where(u => u.TenantId == tid && u.Role == "staff")
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
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng." });
        }

        var callerId = GetCallerUserId();
        var caller = await _context.Users.FirstOrDefaultAsync(u => u.Id == callerId);

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
            return BadRequest(new { message = "Số điện thoại này đã được sử dụng bởi một tài khoản khác trong hệ thống." });
        }

        string email;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            email = request.Email.Trim().ToLower();
            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
            {
                return BadRequest(new { message = "Email này đã được sử dụng bởi một tài khoản khác." });
            }
        }
        else
        {
            // Auto generate standard format username email for staff
            var safeTenantPrefix = tid.Replace("-", "").Substring(0, Math.Min(6, tid.Replace("-", "").Length));
            email = $"{cleanPhone}@{safeTenantPrefix}.paperless.vn";
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
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng." });
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
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng." });
        }

        var callerId = GetCallerUserId();
        if (callerId == id)
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
