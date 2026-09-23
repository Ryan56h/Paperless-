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
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    private string GetTenantId()
    {
        var tenantId = User.FindFirstValue("tenant_id");
        return !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
    }

    private string GetUserName()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? "Nhân viên thu ngân";
    }

    private string? GetBranchId()
    {
        return User.FindFirstValue("branch_id");
    }

    // POS CHECKOUT: Tạo hóa đơn mới
    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var staffName = GetUserName();
        var branchId = GetBranchId();

        var invoice = await _invoiceService.CreateInvoiceAsync(tenantId, staffName, branchId, request);
        return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
    }

    // Danh sách hóa đơn của tenant (có phân loại trạng thái order cho KDS/Display)
    [HttpGet]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices(
        [FromQuery] string? status,
        [FromQuery] int limit = 50)
    {
        var tenantId = GetTenantId();
        var invoices = await _invoiceService.GetInvoicesAsync(tenantId, status, limit);
        return Ok(invoices);
    }

    // Lấy chi tiết 1 hóa đơn
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoiceById(string id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
        if (invoice == null)
        {
            return NotFound(new { message = "Không tìm thấy hóa đơn." });
        }

        return Ok(invoice);
    }

    // Tra cứu công khai (Public Lookup theo ID hoặc SĐT khách)
    [HttpGet("lookup")]
    public async Task<ActionResult<List<InvoiceDto>>> Lookup([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Vui lòng nhập số điện thoại hoặc mã hóa đơn." });
        }

        var invoices = await _invoiceService.LookupInvoicesAsync(query);
        return Ok(invoices);
    }

    // Cập nhật trạng thái đơn hàng (preparing, ready, completed, cancelled)
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusRequest request)
    {
        var success = await _invoiceService.UpdateOrderStatusAsync(id, request.Status);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy hóa đơn." });
        }

        return Ok(new { success = true, id, status = request.Status.ToLower() });
    }
}
