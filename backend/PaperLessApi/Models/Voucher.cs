using System;
using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.Models;

public class Voucher
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string DiscountType { get; set; } = "percent";

    public long DiscountValue { get; set; }

    public long MinOrder { get; set; } = 0;

    [Required]
    [MaxLength(20)]
    public string Expiry { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "active";

    public int UsageCount { get; set; } = 0;

    public int MaxUsage { get; set; } = 100;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
