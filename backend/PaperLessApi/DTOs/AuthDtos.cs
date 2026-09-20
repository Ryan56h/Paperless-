using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.DTOs;

public class LoginRequest
{
    public string? Email { get; set; }
    public string? EmailOrPhone { get; set; }

    [Required]
    public string Password { get; set; } = string.Empty;

    public string? BusinessType { get; set; }

    public string GetIdentifier()
    {
        if (!string.IsNullOrWhiteSpace(EmailOrPhone)) return EmailOrPhone.Trim();
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim();
        return string.Empty;
    }
}

public class RegisterRequest
{
    public string? Name { get; set; }
    public string? StoreName { get; set; }

    public string Type { get; set; } = "grocery";

    public string? OwnerName { get; set; }
    public string? OwnerFullName { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? TaxCode { get; set; }

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
    public string Role { get; set; } = string.Empty;
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
