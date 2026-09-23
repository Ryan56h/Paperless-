using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public interface IInvoiceService
{
    Task<InvoiceDto> CreateInvoiceAsync(string tenantId, string staffName, string? branchId, CreateInvoiceRequest request);
    Task<List<InvoiceDto>> GetInvoicesAsync(string tenantId, string? status, int limit);
    Task<InvoiceDto?> GetInvoiceByIdAsync(string id);
    Task<List<InvoiceDto>> LookupInvoicesAsync(string query);
    Task<bool> UpdateOrderStatusAsync(string id, string status);
}
