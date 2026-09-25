using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<List<ProductDto>> GetProductsAsync(string tenantId, string? category, string? search)
    {
        var products = await _productRepository.GetProductsAsync(tenantId, category, search);

        return products.Select(p => new ProductDto
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
        }).ToList();
    }

    public async Task<List<string>> GetCategoriesAsync(string tenantId)
    {
        var categories = await _productRepository.GetCategoriesAsync(tenantId);
        return categories.OrderBy(c => c).ToList();
    }

    public async Task<ProductDto?> GetProductByIdAsync(string tenantId, string id)
    {
        var product = await _productRepository.GetProductByIdAsync(tenantId, id);
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
        var resolvedTenantId = !string.IsNullOrWhiteSpace(tenantId) ? tenantId : "BIZ-GROCERY-01";
        var prefix = resolvedTenantId.Contains("CAFE", StringComparison.OrdinalIgnoreCase) ? "SPC" : "GP";

        var allProducts = await _productRepository.GetAllAsync();
        int maxSeq = 0;
        foreach (var p in allProducts)
        {
            if (!string.IsNullOrEmpty(p.Id) && p.Id.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                var numStr = p.Id.Substring(prefix.Length);
                if (int.TryParse(numStr, out int num) && num > maxSeq)
                {
                    maxSeq = num;
                }
            }
        }

        int seq = Math.Max(maxSeq + 1, 1);
        string productId;
        do
        {
            productId = $"{prefix}{seq:D3}";
            seq++;
        } while (allProducts.Any(p => p.Id == productId) || await _productRepository.ExistsAsync(p => p.Id == productId));

        var product = new Product
        {
            Id = productId,
            TenantId = resolvedTenantId,
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

        await _productRepository.AddAsync(product);

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
        var product = await _productRepository.GetProductByIdAsync(tenantId, id);
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

        await _productRepository.SaveChangesAsync();

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
        var product = await _productRepository.GetProductByIdAsync(tenantId, id);
        if (product == null) return false;

        product.IsAvailable = false; // Soft delete
        await _productRepository.SaveChangesAsync();
        return true;
    }
}
