using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Product>> GetProductsAsync(string tenantId, string? category, string? search)
    {
        var query = _dbSet.AsNoTracking().Where(p => p.TenantId == tenantId && p.IsAvailable);

        if (!string.IsNullOrWhiteSpace(category) && category != "Tất cả")
        {
            query = query.Where(p => p.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(searchLower) ||
                (p.Barcode != null && p.Barcode.Contains(search.Trim())));
        }

        return await query
            .OrderByDescending(p => p.Popular)
            .ThenBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<List<string>> GetCategoriesAsync(string tenantId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.IsAvailable && !string.IsNullOrEmpty(p.Category))
            .Select(p => p.Category)
            .Distinct()
            .ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(string tenantId, string id)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id);
    }

    public async Task<Product?> GetByBarcodeAsync(string tenantId, string barcode)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Barcode == barcode);
    }

    public async Task<bool> DecrementStockAsync(string tenantId, string productId, int quantity)
    {
        var product = await _dbSet.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == productId);
        if (product == null) return false;

        if (product.Stock >= quantity)
        {
            product.Stock -= quantity;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }
}
