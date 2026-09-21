using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class Customer
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string TenantId { get; set; } = string.Empty;

    [JsonIgnore]
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public int Points { get; set; } = 0;

    [MaxLength(20)]
    public string Tier { get; set; } = "bronze";

    public long TotalSpent { get; set; } = 0;

    public int TotalOrders { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
