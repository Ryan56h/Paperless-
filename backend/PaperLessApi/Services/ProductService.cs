using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;
using PaperLessApi.Models;

namespace PaperLessApi.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductDto>> GetProductsAsync(string tenantId, string? category, string? search)
    {
        var query = _context.Products.AsNoTracking().Where(p => p.TenantId == tenantId && p.IsAvailable);

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

        var products = await query
            .OrderByDescending(p => p.Popular)
            .ThenBy(p => p.Name)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Category = p.Category,
                Price = p.Price,
                Unit = p.Unit,
                Barcode = p.Barcode,
                Stock = p.Stock,
                Popular = p.Popular,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable
            })
            .ToListAsync();

        return products;
    }

    public async Task<List<string>> GetCategoriesAsync(string tenantId)
    {
        var categories = await _context.Products
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.IsAvailable)
            .Select(p => p.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return categories;
    }

    public async Task<ProductDto?> GetProductByIdAsync(string tenantId, string id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (product == null) return null;

        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Category = product.Category,
            Price = product.Price,
            Unit = product.Unit,
            Barcode = product.Barcode,
            Stock = product.Stock,
            Popular = product.Popular,
            ImageUrl = product.ImageUrl,
            IsAvailable = product.IsAvailable
        };
    }

    public async Task<ProductDto> CreateProductAsync(string tenantId, CreateProductRequest request)
    {
        var count = await _context.Products.CountAsync(p => p.TenantId == tenantId);
        var productId = $"GP{(count + 1).ToString("D3")}";

        var product = new Product
        {
            Id = productId,
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Price = request.Price,
            Unit = request.Unit?.Trim() ?? "Cái",
            Barcode = request.Barcode?.Trim(),
            Stock = request.Stock,
            Popular = request.Popular,
            ImageUrl = request.ImageUrl,
            IsAvailable = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Category = product.Category,
            Price = product.Price,
            Unit = product.Unit,
            Barcode = product.Barcode,
            Stock = product.Stock,
            Popular = product.Popular,
            ImageUrl = product.ImageUrl,
            IsAvailable = product.IsAvailable
        };
    }

    public async Task<ProductDto?> UpdateProductAsync(string tenantId, string id, UpdateProductRequest request)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
        if (product == null) return null;

        product.Name = request.Name.Trim();
        product.Category = request.Category.Trim();
        product.Price = request.Price;
        product.Unit = request.Unit?.Trim() ?? product.Unit;
        product.Barcode = request.Barcode?.Trim();
        product.Stock = request.Stock;
        product.Popular = request.Popular;
        product.ImageUrl = request.ImageUrl;
        product.IsAvailable = request.IsAvailable;

        await _context.SaveChangesAsync();

        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Category = product.Category,
            Price = product.Price,
            Unit = product.Unit,
            Barcode = product.Barcode,
            Stock = product.Stock,
            Popular = product.Popular,
            ImageUrl = product.ImageUrl,
            IsAvailable = product.IsAvailable
        };
    }

    public async Task<bool> DeleteProductAsync(string tenantId, string id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
        if (product == null) return false;

        product.IsAvailable = false; // Soft delete
        await _context.SaveChangesAsync();
        return true;
    }
}
