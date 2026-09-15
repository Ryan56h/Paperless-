using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.Models;

public class Invoice
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [Required]
    [MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string CustomerPhone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Branch { get; set; } = "Chi nhánh Q1";

    [MaxLength(100)]
    public string StaffName { get; set; } = "Nguyễn Bảo Trân";

    public long Subtotal { get; set; }
    public long Discount { get; set; } = 0;
    public long Tax { get; set; } = 0;
    public long Total { get; set; }

    [MaxLength(20)]
    public string PayMethod { get; set; } = "cash";

    [MaxLength(20)]
    public string PayStatus { get; set; } = "paid";

    [MaxLength(20)]
    public string SendChannel { get; set; } = "zalo";

    [MaxLength(20)]
    public string SendStatus { get; set; } = "sent";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<NotificationLog> Logs { get; set; } = new List<NotificationLog>();
}
