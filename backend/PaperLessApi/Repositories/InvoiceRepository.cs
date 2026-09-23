using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public class InvoiceRepository : GenericRepository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(string id)
    {
        return await _dbSet
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Invoice?> GetLatestInvoiceAsync()
    {
        return await _dbSet
            .Include(i => i.Items)
            .OrderByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _dbSet.AnyAsync(i => i.Id == id);
    }

    public async Task<int> GetMaxTicketTodayAsync(string tenantId, DateTime today)
    {
        return await _dbSet
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= today)
            .MaxAsync(i => (int?)i.TicketNumber) ?? 100;
    }

    public async Task<int> CountTodayAsync(DateTime today)
    {
        return await _dbSet
            .Where(i => i.CreatedAt >= today)
            .CountAsync();
    }

    public async Task<List<Invoice>> GetInvoicesByTenantAsync(string tenantId, List<string>? statuses, int limit)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId);

        if (statuses != null && statuses.Count > 0)
        {
            query = query.Where(i => statuses.Contains(i.OrderStatus.ToLower()));
        }

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<Invoice>> LookupInvoicesAsync(string cleanQuery, string rawQuery, string phoneDigits, int limit = 20)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.Id.ToUpper() == cleanQuery ||
                        i.CustomerPhone == rawQuery ||
                        (!string.IsNullOrEmpty(phoneDigits) && i.CustomerPhone.Contains(phoneDigits)))
            .OrderByDescending(i => i.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<bool> UpdateOrderStatusAsync(string id, string status)
    {
        var invoice = await _dbSet.FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return false;

        invoice.OrderStatus = status.ToLower();
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Invoice>> GetInvoicesInDateRangeAsync(string tenantId, DateTime from, DateTime to)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= from && i.CreatedAt < to)
            .ToListAsync();
    }

    public async Task<long> GetRevenueInDateRangeAsync(string tenantId, DateTime from, DateTime to)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= from && i.CreatedAt < to)
            .SumAsync(i => (long?)i.Total) ?? 0;
    }

    public async Task<Invoice> AddInvoiceAsync(Invoice invoice)
    {
        if (!string.IsNullOrEmpty(invoice.CustomerPhone))
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Phone == invoice.CustomerPhone && c.TenantId == invoice.TenantId);

            if (customer == null)
            {
                customer = new Customer
                {
                    TenantId = invoice.TenantId,
                    Name = invoice.CustomerName,
                    Phone = invoice.CustomerPhone,
                    TotalSpent = invoice.Total,
                    TotalOrders = 1
                };
                _context.Customers.Add(customer);
            }
            else
            {
                customer.Name = invoice.CustomerName;
                customer.TotalSpent += invoice.Total;
                customer.TotalOrders += 1;
            }

            invoice.Customer = customer;
        }

        _dbSet.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }
}
