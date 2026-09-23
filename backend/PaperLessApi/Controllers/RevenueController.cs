using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RevenueController : ControllerBase
{
    private readonly IRevenueService _revenueService;

    public RevenueController(IRevenueService revenueService)
    {
        _revenueService = revenueService;
    }

    private string GetTenantId()
    {
        var tenantId = User.FindFirstValue("tenant_id");
        return !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
    }

    [HttpGet("grocery/today")]
    public async Task<ActionResult<TodayRevenueDto>> GetGroceryTodayRevenue()
    {
        var tenantId = GetTenantId();
        var revenue = await _revenueService.GetGroceryTodayRevenueAsync(tenantId);
        return Ok(revenue);
    }
}
