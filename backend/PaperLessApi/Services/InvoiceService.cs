using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _repository;

    public InvoiceService(IInvoiceRepository repository)
    {
        _repository = repository;
    }

    public async Task<Invoice?> GetInvoiceAsync(string id)
    {
        return await _repository.GetInvoiceByIdAsync(id);
    }

    public async Task<Invoice?> GetLatestInvoiceAsync()
    {
        return await _repository.GetLatestInvoiceAsync();
    }

    public async Task<(bool Success, string Message, Invoice? Invoice)> CreateInvoiceAsync(Invoice invoice)
    {
        if (await _repository.ExistsAsync(invoice.Id))
        {
            return (false, "Hóa đơn này đã tồn tại!", null);
        }

        invoice.CreatedAt = DateTime.UtcNow;

        var createdInvoice = await _repository.AddInvoiceAsync(invoice);
        
        return (true, "Tạo hóa đơn thành công", createdInvoice);
    }
}
