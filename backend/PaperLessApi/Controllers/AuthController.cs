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
    private readonly IOtpService _otpService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext context,
        ITokenService tokenService,
        IPasswordResetService passwordResetService,
        IOtpService otpService,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _passwordResetService = passwordResetService;
        _otpService = otpService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send-register-otp")]
    public async Task<IActionResult> SendRegisterOtp([FromBody] SendRegisterOtpRequest request)
    {
        var email = request.Email?.Trim().ToLower();
        if (string.IsNullOrEmpty(email) || !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            return BadRequest(new { message = "Vui lòng cung cấp địa chỉ email hợp lệ (VD: cuahang@gmail.com)." });
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
        if (emailExists)
        {
            return BadRequest(new { message = "Email này đã được sử dụng bởi một tài khoản khác." });
        }

        var code = _otpService.GenerateOtp(email, "register", 10);
        await _emailService.SendOtpEmailAsync(email, code, "xác thực đăng ký tài khoản mới", request.FullName);

        return Ok(new
        {
            message = $"Mã xác thực OTP đã được gửi đến email {email}. Vui lòng kiểm tra hộp thư đến (hoặc thư rác/Spam)."
        });
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        var email = request.Email.Trim().ToLower();
        if (!System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            return BadRequest(new { message = "Địa chỉ email không đúng định dạng." });
        }

        var storeName = request.GetStoreName();
        if (string.IsNullOrWhiteSpace(storeName) || storeName.Length < 2)
        {
            return BadRequest(new { message = "Tên cửa hàng phải có ít nhất 2 ký tự." });
        }

        var ownerName = request.GetOwnerName();
        if (string.IsNullOrWhiteSpace(ownerName) || ownerName.Length < 2)
        {
            return BadRequest(new { message = "Họ và tên chủ quán phải có ít nhất 2 ký tự." });
        }

        var phone = request.Phone?.Trim() ?? string.Empty;
        if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^(0|\+84)(3|5|7|8|9)[0-9]{8}$"))
        {
            return BadRequest(new { message = "Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)." });
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu phải có độ dài từ 6 ký tự trở lên." });
        }

        var otp = request.OtpCode?.Trim() ?? string.Empty;
        if (!System.Text.RegularExpressions.Regex.IsMatch(otp, @"^\d{6}$"))
        {
            return BadRequest(new { message = "Mã xác thực OTP phải gồm đúng 6 chữ số." });
        }

        var isOtpValid = _otpService.ConsumeOtp(email, otp, "register");
        if (!isOtpValid)
        {
            return BadRequest(new { message = "Mã xác thực OTP không chính xác hoặc đã hết hạn (hiệu lực 10 phút)." });
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
        if (emailExists)
        {
            return BadRequest(new { message = "Email này đã được sử dụng bởi tài khoản khác." });
        }

        var phoneExists = await _context.Users.AnyAsync(u => u.Phone == phone);
        if (phoneExists)
        {
            return BadRequest(new { message = "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
        }

        var businessType = !string.IsNullOrWhiteSpace(request.Type) ? request.Type.ToLower() : "grocery";

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
            Name = "Trụ sở chính",
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
        var email = request.GetEmail();
        if (string.IsNullOrEmpty(email) || !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            return BadRequest(new { message = "Vui lòng nhập địa chỉ email hợp lệ (VD: example@gmail.com)." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy tài khoản nào với địa chỉ email này." });
        }

        var code = _passwordResetService.GenerateResetCode(email);

        // Gửi mã OTP về email của tài khoản
        await _emailService.SendOtpEmailAsync(user.Email, code, "khôi phục mật khẩu", user.FullName);

        return Ok(new
        {
            message = $"Mã xác nhận 6 chữ số đã được gửi tới email {MaskEmail(user.Email)}. Vui lòng kiểm tra hộp thư đến.",
            identifier = email,
            email = MaskEmail(user.Email)
        });
    }

    [HttpPost("verify-reset-code")]
    public IActionResult VerifyResetCode([FromBody] VerifyResetCodeRequest request)
    {
        var email = request.GetEmail();
        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { message = "Vui lòng cung cấp địa chỉ email." });
        }

        var isValid = _passwordResetService.VerifyResetCode(email, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Mã xác nhận không chính xác hoặc đã hết hạn." });
        }

        return Ok(new { message = "Mã xác thực hợp lệ." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var email = request.GetEmail();
        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { message = "Vui lòng cung cấp địa chỉ email." });
        }

        var isConsumed = _passwordResetService.ConsumeResetCode(email, request.Code);
        if (!isConsumed)
        {
            return BadRequest(new { message = "Mã xác nhận không hợp lệ hoặc đã hết hạn." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy tài khoản hợp lệ để đặt lại mật khẩu." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới." });
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return email;
        var atIndex = email.IndexOf('@');
        if (atIndex <= 1) return email;

        var name = email[..atIndex];
        var domain = email[atIndex..];

        if (name.Length <= 3)
        {
            return $"{name[0]}***{domain}";
        }

        return $"{name[0]}***{name[^1]}{domain}";
    }
}
