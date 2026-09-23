using System.Collections.Generic;
using System.Threading.Tasks;
using PaperLessApi.Models;

namespace PaperLessApi.Repositories;

public interface ICustomerRepository : IGenericRepository<Customer>
{
    Task<Customer?> GetByPhoneAsync(string tenantId, string phone);
    Task<Customer?> GetByIdAsync(string tenantId, string customerId);
    Task<List<Customer>> GetCustomersAsync(string tenantId, int limit);
}
