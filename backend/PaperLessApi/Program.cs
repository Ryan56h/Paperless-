using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Đăng ký Repository và Service (Clean Architecture theo ý bro)
builder.Services.AddScoped<PaperLessApi.Repositories.IInvoiceRepository, PaperLessApi.Repositories.InvoiceRepository>();
builder.Services.AddScoped<PaperLessApi.Services.IInvoiceService, PaperLessApi.Services.InvoiceService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
