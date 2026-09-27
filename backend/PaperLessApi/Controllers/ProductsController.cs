using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    private string? GetTenantId(string? requestedTenantId = null)
    {
        if (User.IsInRole("admin") && !string.IsNullOrWhiteSpace(requestedTenantId))
        {
            return requestedTenantId;
        }
        return User.FindFirstValue("tenant_id");
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var products = await _productService.GetProductsAsync(tid, category, search);
        return Ok(products);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories([FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var categories = await _productService.GetCategoriesAsync(tid);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string id, [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var product = await _productService.GetProductByIdAsync(tid, id);
        if (product == null)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(product);
    }

    [Authorize(Roles = "owner,admin")]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request, [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var created = await _productService.CreateProductAsync(tid, request);
        return CreatedAtAction(nameof(GetProduct), new { id = created.Id }, created);
    }

    [Authorize(Roles = "owner,admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] UpdateProductRequest request, [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var updated = await _productService.UpdateProductAsync(tid, id, request);
        if (updated == null)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(updated);
    }

    [Authorize(Roles = "owner,admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(string id, [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var success = await _productService.DeleteProductAsync(tid, id);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return Ok(new { message = "Sản phẩm đã được xóa." });
    }
}

