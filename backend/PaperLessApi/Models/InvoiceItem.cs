using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PaperLessApi.Models;

public class InvoiceItem
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string InvoiceId { get; set; } = string.Empty;

    [JsonIgnore]
    public Invoice? Invoice { get; set; }

    public string? ProductId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;

    public long UnitPrice { get; set; }
}
