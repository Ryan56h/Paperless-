using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    private string GetTenantId()
    {
        var tenantId = User.FindFirstValue("tenant_id");
        return !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<CustomerDto>> Lookup([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { message = "Vui lòng nhập số điện thoại." });
        }

        var tenantId = GetTenantId();
        var customer = await _customerService.LookupByPhoneAsync(tenantId, phone);

        if (customer == null)
        {
            return NotFound(new { message = "Chưa có thông tin khách hàng này." });
        }

        return Ok(customer);
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetCustomers([FromQuery] int limit = 50)
    {
        var tenantId = GetTenantId();
        var customers = await _customerService.GetCustomersAsync(tenantId, limit);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetCustomerById(string id)
    {
        var tenantId = GetTenantId();
        var customer = await _customerService.GetCustomerByIdAsync(tenantId, id);
        if (customer == null)
        {
            return NotFound(new { message = "Không tìm thấy khách hàng." });
        }

        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var tenantId = GetTenantId();
        var customer = await _customerService.CreateCustomerAsync(tenantId, request);
        if (customer == null)
        {
            return BadRequest(new { message = "Số điện thoại này đã được đăng ký." });
        }

        return Ok(customer);
    }
}
