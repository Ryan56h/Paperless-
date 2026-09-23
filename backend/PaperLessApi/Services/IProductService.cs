using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetProductsAsync(string tenantId, string? category, string? search);
    Task<List<string>> GetCategoriesAsync(string tenantId);
    Task<ProductDto?> GetProductByIdAsync(string tenantId, string id);
    Task<ProductDto> CreateProductAsync(string tenantId, CreateProductRequest request);
    Task<ProductDto?> UpdateProductAsync(string tenantId, string id, UpdateProductRequest request);
    Task<bool> DeleteProductAsync(string tenantId, string id);
}
