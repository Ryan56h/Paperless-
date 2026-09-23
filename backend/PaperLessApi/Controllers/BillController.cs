using Microsoft.AspNetCore.Mvc;
using PaperLessApi.Models;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public BillController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet("latest")]
    public async Task<ActionResult<Invoice>> GetLatestInvoice()
    {
        var invoice = await _invoiceService.GetLatestInvoiceAsync();

        if (invoice == null)
        {
            return NotFound(new { message = "Không tìm thấy hóa đơn nào" });
        }

        return Ok(invoice);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetInvoice(string id)
    {
        var invoice = await _invoiceService.GetInvoiceAsync(id);

        if (invoice == null)
        {
            return NotFound();
        }

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<ActionResult<Invoice>> PostInvoice([FromBody] Invoice invoice)
    {
        try
        {
            var result = await _invoiceService.CreateInvoiceAsync(invoice);

            if (!result.Success)
            {
                return Conflict(new { message = result.Message });
            }

            return CreatedAtAction(nameof(GetInvoice), new { id = result.Invoice!.Id }, result.Invoice);
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException?.Message ?? "";
            return StatusCode(500, new { message = $"Internal Server Error: {ex.Message} | Inner: {innerMsg}" });
        }
    }
}
