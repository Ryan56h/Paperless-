using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string? TenantId { get; set; }

    [JsonIgnore]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "staff"; // super_admin | owner | manager | staff

    public string? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
