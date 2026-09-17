using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public interface IInvoiceRepository
{
    Task<Invoice?> GetInvoiceByIdAsync(string id);
    Task<Invoice?> GetLatestInvoiceAsync();
    Task<bool> ExistsAsync(string id);
    Task<Invoice> AddInvoiceAsync(Invoice invoice);
}
