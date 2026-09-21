using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddScoped<
    PaperLessApi.Repositories.IInvoiceRepository,
    PaperLessApi.Repositories.InvoiceRepository>();

builder.Services.AddScoped<
    PaperLessApi.Services.IInvoiceService,
    PaperLessApi.Services.InvoiceService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();