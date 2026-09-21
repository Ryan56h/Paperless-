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

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
