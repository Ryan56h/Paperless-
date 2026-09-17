using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _context;

    public InvoiceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(string id)
    {
        return await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Invoice?> GetLatestInvoiceAsync()
    {
        return await _context.Invoices
            .OrderByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Invoices.AnyAsync(i => i.Id == id);
    }

    public async Task<Invoice> AddInvoiceAsync(Invoice invoice)
    {
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }
}
