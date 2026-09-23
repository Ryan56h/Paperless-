using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IProductRepository _productRepository;

    public ProductController(IHttpClientFactory httpClientFactory, IProductRepository productRepository)
    {
        _httpClientFactory = httpClientFactory;
        _productRepository = productRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
        {
            return BadRequest(new { message = "tenantId is required" });
        }

        var products = await _productRepository.FindAsync(p => p.TenantId == tenantId && p.IsAvailable);
        return Ok(products.OrderByDescending(p => p.CreatedAt).ToList());
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        await _productRepository.AddAsync(product);

        return CreatedAtAction(nameof(GetProducts), new { tenantId = product.TenantId }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] Product updatedProduct)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        product.Name = updatedProduct.Name;
        product.Category = updatedProduct.Category;
        product.Price = updatedProduct.Price;
        product.Unit = updatedProduct.Unit;
        product.Barcode = updatedProduct.Barcode;
        product.Popular = updatedProduct.Popular;
        
        await _productRepository.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        product.IsAvailable = false; // Soft delete
        await _productRepository.SaveChangesAsync();

        return Ok(new { message = "Product deleted successfully" });
    }

    [HttpGet("lookup-barcode/{barcode}")]
    public async Task<IActionResult> LookupBarcode(string barcode)
    {
        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://world.openfoodfacts.org/api/v2/product/{barcode}.json");
        
        request.Headers.Add("User-Agent", "PaperlessPOS/1.0");
        
        var response = await client.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            return NotFound(new { message = "Không tìm thấy thông tin mã vạch." });
        }

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;
        
        if (root.TryGetProperty("status", out var statusProp) && statusProp.GetInt32() == 1)
        {
            var product = root.GetProperty("product");
            var productName = product.TryGetProperty("product_name", out var nameProp) ? nameProp.GetString() : "";
            var brands = product.TryGetProperty("brands", out var brandProp) ? brandProp.GetString() : "";
            var quantity = product.TryGetProperty("quantity", out var qtyProp) ? qtyProp.GetString() : "";
            var image = product.TryGetProperty("image_url", out var imgProp) ? imgProp.GetString() : "";
            
            var fullName = productName;
            if (!string.IsNullOrWhiteSpace(brands) && !string.IsNullOrWhiteSpace(fullName) && !fullName.Contains(brands)) {
                fullName = $"{brands} - {fullName}";
            }
            if (!string.IsNullOrWhiteSpace(quantity) && !string.IsNullOrWhiteSpace(fullName)) {
                fullName = $"{fullName} {quantity}";
            }
            if (string.IsNullOrWhiteSpace(fullName)) {
                fullName = "Sản phẩm không có tên tiếng Việt";
            }

            return Ok(new
            {
                barcode = barcode,
                name = fullName,
                imageUrl = image
            });
        }
        
        return NotFound(new { message = "Không tìm thấy thông tin sản phẩm trên Open Food Facts." });
    }
}
