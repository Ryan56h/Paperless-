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
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    private string? GetTenantId(string? requestedTenantId = null)
    {
        if (User.IsInRole("admin") && !string.IsNullOrWhiteSpace(requestedTenantId))
        {
            return requestedTenantId;
        }
        return User.FindFirstValue("tenant_id");
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<CustomerDto>> Lookup([FromQuery] string phone, [FromQuery] string? tenantId)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { message = "Vui lòng nhập số điện thoại." });
        }

        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var customer = await _customerService.LookupByPhoneAsync(tid, phone);

        if (customer == null)
        {
            return NotFound(new { message = "Chưa có thông tin khách hàng này." });
        }

        return Ok(customer);
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetCustomers([FromQuery] int limit = 50, [FromQuery] string? tenantId = null)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var customers = await _customerService.GetCustomersAsync(tid, limit);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetCustomerById(string id, [FromQuery] string? tenantId = null)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var customer = await _customerService.GetCustomerByIdAsync(tid, id);
        if (customer == null)
        {
            return NotFound(new { message = "Không tìm thấy khách hàng." });
        }

        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerRequest request, [FromQuery] string? tenantId = null)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var customer = await _customerService.CreateCustomerAsync(tid, request);
        if (customer == null)
        {
            return BadRequest(new { message = "Số điện thoại này đã được đăng ký." });
        }

        return Ok(customer);
    }
}

