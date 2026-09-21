using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class Subscription
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string TenantId { get; set; } = string.Empty;

    [JsonIgnore]
    public Tenant? Tenant { get; set; }

    [Required]
    public string PlanId { get; set; } = string.Empty;

    public Plan? Plan { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime EndDate { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "active";
}
