using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customerRepository;

    public CustomerService(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<CustomerDto?> LookupByPhoneAsync(string tenantId, string phone)
    {
        var cleanPhone = phone.Trim();
        var customer = await _customerRepository.GetByPhoneAsync(tenantId, cleanPhone);

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
        var customers = await _customerRepository.GetCustomersAsync(tenantId, limit);

        return customers.Select(c => new CustomerDto
        {
            Id = c.Id,
            Name = c.Name,
            Phone = c.Phone,
            Points = c.Points,
            Tier = c.Tier,
            TotalSpent = c.TotalSpent,
            TotalOrders = c.TotalOrders
        }).ToList();
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(string tenantId, string id)
    {
        var customer = await _customerRepository.GetByIdAsync(tenantId, id);

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
        var exists = await _customerRepository.ExistsAsync(c => c.TenantId == tenantId && c.Phone == phone);
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

        await _customerRepository.AddAsync(customer);

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
