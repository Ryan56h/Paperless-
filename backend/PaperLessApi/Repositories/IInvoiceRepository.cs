using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public interface IInvoiceRepository : IGenericRepository<Invoice>
{
    Task<Invoice?> GetInvoiceByIdAsync(string id);
    Task<Invoice?> GetLatestInvoiceAsync();
    Task<bool> ExistsAsync(string id);
    Task<Invoice> AddInvoiceAsync(Invoice invoice);
    Task<int> GetMaxTicketTodayAsync(string tenantId, DateTime today);
    Task<int> CountTodayAsync(DateTime today);
    Task<List<Invoice>> GetInvoicesByTenantAsync(string tenantId, List<string>? statuses, int limit);
    Task<List<Invoice>> LookupInvoicesAsync(string cleanQuery, string rawQuery, string phoneDigits, int limit = 20);
    Task<bool> UpdateOrderStatusAsync(string id, string status);
    Task<List<Invoice>> GetInvoicesInDateRangeAsync(string tenantId, DateTime from, DateTime to);
    Task<long> GetRevenueInDateRangeAsync(string tenantId, DateTime from, DateTime to);
}
