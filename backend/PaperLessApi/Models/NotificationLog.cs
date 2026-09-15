using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class NotificationLog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string InvoiceId { get; set; } = string.Empty;

    [JsonIgnore]
    public Invoice? Invoice { get; set; }

    [MaxLength(20)]
    public string Channel { get; set; } = "zalo";

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "sent";

    public string? Message { get; set; }

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
