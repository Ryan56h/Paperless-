using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.DTOs;

public class LoginRequest
{
    public string? Email { get; set; }
    public string? EmailOrPhone { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
    public string Password { get; set; } = string.Empty;

    public string? BusinessType { get; set; }

    public string GetIdentifier()
    {
        if (!string.IsNullOrWhiteSpace(EmailOrPhone)) return EmailOrPhone.Trim();
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim();
        return string.Empty;
    }
}

public class SendRegisterOtpRequest
{
    [Required(ErrorMessage = "Vui lòng nhập địa chỉ email.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng (VD: cuahang@gmail.com).")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự.")]
    public string? FullName { get; set; }
}

public class RegisterRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên cửa hàng.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên cửa hàng phải có từ 2 đến 100 ký tự.")]
    public string? Name { get; set; }
    public string? StoreName { get; set; }

    public string Type { get; set; } = "grocery";

    [Required(ErrorMessage = "Vui lòng nhập họ và tên chủ quán.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên chủ quán phải có từ 2 đến 100 ký tự.")]
    public string? OwnerName { get; set; }
    public string? OwnerFullName { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ email.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [RegularExpression(@"^(0|\+84)(3|5|7|8|9)[0-9]{8}$", ErrorMessage = "Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [StringLength(50, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có độ dài từ 6 đến 50 ký tự.")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự.")]
    public string? Address { get; set; }

    [MaxLength(50, ErrorMessage = "Mã số thuế không được vượt quá 50 ký tự.")]
    public string? TaxCode { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập mã xác thực OTP.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã xác thực OTP phải gồm đúng 6 chữ số.")]
    public string OtpCode { get; set; } = string.Empty;

    public string GetStoreName()
    {
        if (!string.IsNullOrWhiteSpace(Name)) return Name.Trim();
        if (!string.IsNullOrWhiteSpace(StoreName)) return StoreName.Trim();
        return Type == "cafe" ? "Quán Cafe Mới" : "Cửa Hàng Mới";
    }

    public string GetOwnerName()
    {
        if (!string.IsNullOrWhiteSpace(OwnerName)) return OwnerName.Trim();
        if (!string.IsNullOrWhiteSpace(OwnerFullName)) return OwnerFullName.Trim();
        return "Chủ Cửa Hàng";
    }
}

public class BusinessProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "grocery";
    public string OwnerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? TaxCode { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? BusinessType { get; set; }
    public string? BranchId { get; set; }
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public BusinessProfileDto? Business { get; set; }
}

public class ForgotPasswordRequest
{
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự.")]
    public string? Email { get; set; }
    public string? EmailOrPhone { get; set; }

    public string GetEmail()
    {
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim().ToLower();
        if (!string.IsNullOrWhiteSpace(EmailOrPhone)) return EmailOrPhone.Trim().ToLower();
        return string.Empty;
    }
}

public class VerifyResetCodeRequest
{
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    public string? Email { get; set; }
    public string? EmailOrPhone { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập mã xác nhận.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã xác nhận gồm đúng 6 chữ số.")]
    public string Code { get; set; } = string.Empty;

    public string GetEmail()
    {
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim().ToLower();
        if (!string.IsNullOrWhiteSpace(EmailOrPhone)) return EmailOrPhone.Trim().ToLower();
        return string.Empty;
    }
}

public class ResetPasswordRequest
{
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    public string? Email { get; set; }
    public string? EmailOrPhone { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập mã xác nhận.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã xác nhận gồm đúng 6 chữ số.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
    [StringLength(50, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải có độ dài từ 6 đến 50 ký tự.")]
    public string NewPassword { get; set; } = string.Empty;

    public string GetEmail()
    {
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim().ToLower();
        if (!string.IsNullOrWhiteSpace(EmailOrPhone)) return EmailOrPhone.Trim().ToLower();
        return string.Empty;
    }
}
