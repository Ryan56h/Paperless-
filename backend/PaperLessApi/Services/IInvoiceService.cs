using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.DTOs;
using PaperLessApi.Models;

namespace PaperLessApi.Services;

public interface IInvoiceService
{
    // Methods used by BillController
    Task<Invoice?> GetInvoiceAsync(string id);
    Task<Invoice?> GetLatestInvoiceAsync();
    Task<(bool Success, string Message, Invoice? Invoice)> CreateInvoiceAsync(Invoice invoice);

    // Grocery POS methods used by InvoicesController
    Task<InvoiceDto> CreateInvoiceAsync(string tenantId, string staffName, string? branchId, CreateInvoiceRequest request);
    Task<List<InvoiceDto>> GetInvoicesAsync(string tenantId, string? status, int limit);
    Task<InvoiceDto?> GetInvoiceByIdAsync(string id);
    Task<List<InvoiceDto>> LookupInvoicesAsync(string query);
    Task<bool> UpdateOrderStatusAsync(string id, string status);
}
