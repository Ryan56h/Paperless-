using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<List<Product>> GetProductsAsync(string tenantId, string? category, string? search);
    Task<List<string>> GetCategoriesAsync(string tenantId);
    Task<Product?> GetProductByIdAsync(string tenantId, string id);
    Task<Product?> GetByBarcodeAsync(string tenantId, string barcode);
    Task<bool> DecrementStockAsync(string tenantId, string productId, int quantity);
}
