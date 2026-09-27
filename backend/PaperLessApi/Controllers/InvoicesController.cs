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

    private string? GetTenantId(string? requestedTenantId = null)
    {
        if (User.IsInRole("admin") && !string.IsNullOrWhiteSpace(requestedTenantId))
        {
            return requestedTenantId;
        }
        return User.FindFirstValue("tenant_id");
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
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        if (string.IsNullOrEmpty(tenantId))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var staffName = GetUserName();
        var branchId = GetBranchId();

        var invoice = await _invoiceService.CreateInvoiceAsync(tenantId, staffName, branchId, request);
        return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
    }

    // Danh sách hóa đơn của tenant (có phân loại trạng thái order cho KDS/Display)
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices(
        [FromQuery] string? status,
        [FromQuery] int limit = 50,
        [FromQuery] string? tenantId = null)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var invoices = await _invoiceService.GetInvoicesAsync(tid, status, limit);
        return Ok(invoices);
    }

    // Lấy chi tiết 1 hóa đơn (Public cho khách xem bill qua QR code)
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
    [Authorize]
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
