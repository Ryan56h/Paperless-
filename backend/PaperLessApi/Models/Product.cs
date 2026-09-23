using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class Product
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string TenantId { get; set; } = string.Empty;

    [JsonIgnore]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public long Price { get; set; }

    [MaxLength(20)]
    public string? Unit { get; set; } = "Cái";

    [MaxLength(50)]
    public string? Barcode { get; set; }

    public bool Popular { get; set; } = false;

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
