using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class Invoice
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string TenantId { get; set; } = string.Empty;

    [JsonIgnore]
    public Tenant? Tenant { get; set; }

    public string? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public string? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [Required]
    [MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string CustomerPhone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string BranchName { get; set; } = "Chi nhánh Q1";

    public string? StaffId { get; set; }
    public User? Staff { get; set; }

    [MaxLength(100)]
    public string StaffName { get; set; } = "Nguyễn Bảo Trân";

    public long Subtotal { get; set; }
    public long Discount { get; set; } = 0;
    public long Tax { get; set; } = 0;
    public long Total { get; set; }

    public int TicketNumber { get; set; } = 101;

    public long CashGiven { get; set; } = 0;

    public long ChangeDue { get; set; } = 0;

    [MaxLength(20)]
    public string OrderStatus { get; set; } = "preparing"; // preparing, ready, completed, cancelled

    [MaxLength(255)]
    public string? Note { get; set; }

    [MaxLength(20)]
    public string PayMethod { get; set; } = "cash";

    [MaxLength(20)]
    public string PayStatus { get; set; } = "paid";

    [MaxLength(20)]
    public string SendChannel { get; set; } = "zalo";

    [MaxLength(20)]
    public string SendStatus { get; set; } = "sent";

    [MaxLength(100)]
    public string PublicToken { get; set; } = Guid.NewGuid().ToString("N");

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<NotificationLog> Logs { get; set; } = new List<NotificationLog>();
}
