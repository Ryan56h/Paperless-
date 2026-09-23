using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    private string GetTenantId()
    {
        var tenantId = User.FindFirstValue("tenant_id");
        return !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var tenantId = GetTenantId();
        var products = await _productService.GetProductsAsync(tenantId, category, search);
        return Ok(products);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var tenantId = GetTenantId();
        var categories = await _productService.GetCategoriesAsync(tenantId);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string id)
    {
        var tenantId = GetTenantId();
        var product = await _productService.GetProductByIdAsync(tenantId, id);
        if (product == null)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(product);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        var tenantId = GetTenantId();
        var created = await _productService.CreateProductAsync(tenantId, request);
        return CreatedAtAction(nameof(GetProduct), new { id = created.Id }, created);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] UpdateProductRequest request)
    {
        var tenantId = GetTenantId();
        var updated = await _productService.UpdateProductAsync(tenantId, id, request);
        if (updated == null)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(updated);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var tenantId = GetTenantId();
        var success = await _productService.DeleteProductAsync(tenantId, id);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(new { message = "Sản phẩm đã được xóa." });
    }
}
