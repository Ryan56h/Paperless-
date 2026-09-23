using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;
using PaperLessApi.Models;

namespace PaperLessApi.Services;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _context;

    public CustomerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerDto?> LookupByPhoneAsync(string tenantId, string phone)
    {
        var cleanPhone = phone.Trim();
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == cleanPhone);

        if (customer == null) return null;

        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Phone = customer.Phone,
            Points = customer.Points,
            Tier = customer.Tier,
            TotalSpent = customer.TotalSpent,
            TotalOrders = customer.TotalOrders
        };
    }

    public async Task<List<CustomerDto>> GetCustomersAsync(string tenantId, int limit)
    {
        var customers = await _context.Customers
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.TotalSpent)
            .Take(limit)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                Points = c.Points,
                Tier = c.Tier,
                TotalSpent = c.TotalSpent,
                TotalOrders = c.TotalOrders
            })
            .ToListAsync();

        return customers;
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(string tenantId, string id)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id);

        if (customer == null) return null;

        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Phone = customer.Phone,
            Points = customer.Points,
            Tier = customer.Tier,
            TotalSpent = customer.TotalSpent,
            TotalOrders = customer.TotalOrders
        };
    }

    public async Task<CustomerDto?> CreateCustomerAsync(string tenantId, CreateCustomerRequest request)
    {
        var phone = request.Phone.Trim();
        var exists = await _context.Customers.AnyAsync(c => c.TenantId == tenantId && c.Phone == phone);
        if (exists) return null;

        var customer = new Customer
        {
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Phone = phone,
            Points = 0,
            Tier = "bronze",
            TotalSpent = 0,
            TotalOrders = 0
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Phone = customer.Phone,
            Points = customer.Points,
            Tier = customer.Tier,
            TotalSpent = customer.TotalSpent,
            TotalOrders = customer.TotalOrders
        };
    }
}
