using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IPasswordResetService _passwordResetService;

    public AuthController(AppDbContext context, ITokenService tokenService, IPasswordResetService passwordResetService)
    {
        _context = context;
        _tokenService = tokenService;
        _passwordResetService = passwordResetService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        var storeName = request.GetStoreName();
        var ownerName = request.GetOwnerName();
        var businessType = !string.IsNullOrWhiteSpace(request.Type) ? request.Type.ToLower() : "grocery";

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailExists)
        {
            return BadRequest(new { message = "Email này đã được sử dụng." });
        }

        var defaultPlan = await _context.Plans.FirstOrDefaultAsync(p => p.Id == "free")
                          ?? await _context.Plans.FirstOrDefaultAsync();

        var tenant = new Tenant
        {
            Name = storeName,
            BusinessType = businessType,
            OwnerName = ownerName,
            Address = request.Address ?? string.Empty,
            TaxCode = request.TaxCode,
            Email = request.Email,
            Phone = request.Phone,
            Status = "trial",
            PlanId = defaultPlan?.Id
        };
        _context.Tenants.Add(tenant);

        var branch = new Branch
        {
            TenantId = tenant.Id,
            Name = "Chi nhánh " + storeName,
            Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address : "Chưa cập nhật"
        };
        _context.Branches.Add(branch);

        var user = new User
        {
            TenantId = tenant.Id,
            BranchId = branch.Id,
            FullName = ownerName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            BusinessType = businessType
        };
        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user, tenant.Name, user.BusinessType);

        return Ok(new LoginResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                TenantId = tenant.Id,
                TenantName = tenant.Name,
                BusinessType = user.BusinessType,
                BranchId = branch.Id
            },
            Business = new BusinessProfileDto
            {
                Id = tenant.Id,
                Name = tenant.Name,
                Type = tenant.BusinessType,
                OwnerName = tenant.OwnerName,
                Phone = tenant.Phone,
                Email = tenant.Email,
                Address = tenant.Address,
                TaxCode = tenant.TaxCode,
                CreatedAt = tenant.CreatedAt.ToString("yyyy-MM-dd")
            }
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var input = request.GetIdentifier().ToLower();
        if (string.IsNullOrEmpty(input))
        {
            return BadRequest(new { message = "Vui lòng nhập email hoặc số điện thoại." });
        }

        var user = await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == input || u.Phone == input);

        if (user == null)
        {
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        bool isPasswordValid = false;
        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        catch
        {
            isPasswordValid = (request.Password == user.PasswordHash);
        }

        if (!isPasswordValid)
        {
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        var token = _tokenService.GenerateToken(user, user.Tenant?.Name, user.BusinessType ?? user.Tenant?.BusinessType);

        var businessDto = user.Tenant != null ? new BusinessProfileDto
        {
            Id = user.Tenant.Id,
            Name = user.Tenant.Name,
            Type = user.Tenant.BusinessType,
            OwnerName = user.Tenant.OwnerName,
            Phone = user.Tenant.Phone,
            Email = user.Tenant.Email,
            Address = user.Tenant.Address,
            TaxCode = user.Tenant.TaxCode,
            CreatedAt = user.Tenant.CreatedAt.ToString("yyyy-MM-dd")
        } : null;

        return Ok(new LoginResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                TenantId = user.TenantId,
                TenantName = user.Tenant?.Name,
                BusinessType = user.BusinessType ?? user.Tenant?.BusinessType,
                BranchId = user.BranchId
            },
            Business = businessDto
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound();
        }

        var businessDto = user.Tenant != null ? new BusinessProfileDto
        {
            Id = user.Tenant.Id,
            Name = user.Tenant.Name,
            Type = user.Tenant.BusinessType,
            OwnerName = user.Tenant.OwnerName,
            Phone = user.Tenant.Phone,
            Email = user.Tenant.Email,
            Address = user.Tenant.Address,
            TaxCode = user.Tenant.TaxCode,
            CreatedAt = user.Tenant.CreatedAt.ToString("yyyy-MM-dd")
        } : null;

        return Ok(new
        {
            user = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                TenantId = user.TenantId,
                TenantName = user.Tenant?.Name,
                BusinessType = user.BusinessType ?? user.Tenant?.BusinessType,
                BranchId = user.BranchId
            },
            business = businessDto
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var input = request.EmailOrPhone?.Trim().ToLower();
        if (string.IsNullOrEmpty(input))
        {
            return BadRequest(new { message = "Vui lòng nhập email hoặc số điện thoại." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == input || u.Phone == input);

        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy tài khoản với email hoặc số điện thoại này." });
        }

        var code = _passwordResetService.GenerateResetCode(input);

        return Ok(new
        {
            message = "Mã xác nhận gồm 6 chữ số đã được gửi tới tài khoản của bạn.",
            identifier = input,
            resetCode = code
        });
    }

    [HttpPost("verify-reset-code")]
    public IActionResult VerifyResetCode([FromBody] VerifyResetCodeRequest request)
    {
        var input = request.EmailOrPhone?.Trim().ToLower();
        if (string.IsNullOrEmpty(input))
        {
            return BadRequest(new { message = "Vui lòng nhập email hoặc số điện thoại." });
        }

        var isValid = _passwordResetService.VerifyResetCode(input, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Mã xác nhận không chính xác hoặc đã hết hạn." });
        }

        return Ok(new { message = "Mã xác thực hợp lệ." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var input = request.EmailOrPhone?.Trim().ToLower();
        if (string.IsNullOrEmpty(input))
        {
            return BadRequest(new { message = "Vui lòng nhập email hoặc số điện thoại." });
        }

        var isConsumed = _passwordResetService.ConsumeResetCode(input, request.Code);
        if (!isConsumed)
        {
            return BadRequest(new { message = "Mã xác nhận không hợp lệ hoặc đã hết hạn." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == input || u.Phone == input);

        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy tài khoản hợp lệ để đặt lại mật khẩu." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới." });
    }
}
