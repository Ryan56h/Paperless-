using PaperLessApi.Models;

namespace PaperLessApi.Services;

public interface IInvoiceService
{
    Task<Invoice?> GetInvoiceAsync(string id);
    Task<Invoice?> GetLatestInvoiceAsync();
    Task<(bool Success, string Message, Invoice? Invoice)> CreateInvoiceAsync(Invoice invoice);
}
