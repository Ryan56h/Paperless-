using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.Models;

public class Plan
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public long Price { get; set; } = 0;

    public int MaxInvoicesMonth { get; set; } = 100;

    public int MaxMsgMonth { get; set; } = 100;

    public bool IsActive { get; set; } = true;
}
