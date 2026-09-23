using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IProductService _productService;

    public ProductController(IHttpClientFactory httpClientFactory, IProductService productService)
    {
        _httpClientFactory = httpClientFactory;
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
        {
            return BadRequest(new { message = "tenantId is required" });
        }

        var products = await _productService.GetProductsAsync(tenantId, null, null);
        return Ok(products);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _productService.CreateProductAsync(product.TenantId, new CreateProductRequest
        {
            Name = product.Name,
            Category = product.Category,
            Price = product.Price,
            Unit = product.Unit,
            Barcode = product.Barcode,
            Stock = product.Stock,
            Popular = product.Popular,
            ImageUrl = product.ImageUrl
        });

        return CreatedAtAction(nameof(GetProducts), new { tenantId = product.TenantId }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] Product updatedProduct)
    {
        var tenantId = !string.IsNullOrEmpty(updatedProduct.TenantId) ? updatedProduct.TenantId : "BIZ-GROCERY-01";

        var updated = await _productService.UpdateProductAsync(tenantId, id, new UpdateProductRequest
        {
            Name = updatedProduct.Name,
            Category = updatedProduct.Category,
            Price = updatedProduct.Price,
            Unit = updatedProduct.Unit,
            Barcode = updatedProduct.Barcode,
            Stock = updatedProduct.Stock,
            Popular = updatedProduct.Popular,
            ImageUrl = updatedProduct.ImageUrl,
            IsAvailable = updatedProduct.IsAvailable
        });

        if (updated == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(string id, [FromQuery] string? tenantId)
    {
        var tid = !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
        var success = await _productService.DeleteProductAsync(tid, id);
        if (!success)
        {
            return NotFound(new { message = "Product not found" });
        }

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
