using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public class CustomerRepository : GenericRepository<Customer>, ICustomerRepository
{
    public CustomerRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Customer?> GetByPhoneAsync(string tenantId, string phone)
    {
        var cleanPhone = phone.Trim();
        return await _dbSet
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == cleanPhone);
    }

    public async Task<Customer?> GetByIdAsync(string tenantId, string customerId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == customerId);
    }

    public async Task<List<Customer>> GetCustomersAsync(string tenantId, int limit)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.TotalSpent)
            .Take(limit)
            .ToListAsync();
    }
}
