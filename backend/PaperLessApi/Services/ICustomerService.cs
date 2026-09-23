using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public interface ICustomerService
{
    Task<CustomerDto?> LookupByPhoneAsync(string tenantId, string phone);
    Task<List<CustomerDto>> GetCustomersAsync(string tenantId, int limit);
    Task<CustomerDto?> GetCustomerByIdAsync(string tenantId, string id);
    Task<CustomerDto?> CreateCustomerAsync(string tenantId, CreateCustomerRequest request);
}
