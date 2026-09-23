using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.Models;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _context;

    public ProductController(IHttpClientFactory httpClientFactory, AppDbContext context)
    {
        _httpClientFactory = httpClientFactory;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
        {
            return BadRequest(new { message = "tenantId is required" });
        }

        var products = await _context.Products
            .Where(p => p.TenantId == tenantId && p.IsAvailable)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(products);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProducts), new { tenantId = product.TenantId }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] Product updatedProduct)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
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
        
        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            return NotFound(new { message = "Product not found" });
        }

        product.IsAvailable = false; // Soft delete
        await _context.SaveChangesAsync();

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
