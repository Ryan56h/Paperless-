// PaperLessApi Entry Point
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PaperLessApi.Data;
using PaperLessApi.Hubs;
using PaperLessApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Support Render / Cloud dynamic PORT
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Support both standard ConnectionStrings and cloud DATABASE_URL (postgres://...)
string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl) && (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://")))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    var user = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var dbPort = uri.Port > 0 ? uri.Port : 5432;
    var database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
    connectionString = $"Host={uri.Host};Port={dbPort};Database={database};Username={user};Password={password};SSL Mode=Prefer;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories
builder.Services.AddScoped(typeof(PaperLessApi.Repositories.IGenericRepository<>), typeof(PaperLessApi.Repositories.GenericRepository<>));
builder.Services.AddScoped<PaperLessApi.Repositories.IInvoiceRepository, PaperLessApi.Repositories.InvoiceRepository>();
builder.Services.AddScoped<PaperLessApi.Repositories.IProductRepository, PaperLessApi.Repositories.ProductRepository>();
builder.Services.AddScoped<PaperLessApi.Repositories.ICustomerRepository, PaperLessApi.Repositories.CustomerRepository>();

// Services
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IRevenueService, RevenueService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<IOtpService, OtpService>();
builder.Services.AddSingleton<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Real-time cart sync between devices
builder.Services.AddSignalR();

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PaperLess+ SaaS API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var ex = exceptionHandlerPathFeature?.Error;
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            message = ex?.Message ?? "Internal Server Error",
            type = ex?.GetType().Name,
            inner = ex?.InnerException?.Message
        });
        await context.Response.WriteAsync(result);
    });
});

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PaperLess+ SaaS API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR hub for real-time cart sync between phone & desktop
app.MapHub<CartHub>("/hubs/cart");

app.MapGet("/api/health", async (AppDbContext db) =>
{
    var hasDbUrl = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"));
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        var userCount = canConnect ? await db.Users.CountAsync() : -1;
        var pendingMigrations = canConnect ? await db.Database.GetPendingMigrationsAsync() : Enumerable.Empty<string>();
        return Results.Ok(new
        {
            status = "healthy",
            database = canConnect ? "connected" : "disconnected",
            hasDatabaseUrl = hasDbUrl,
            userCount,
            pendingMigrations,
            serverTime = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            status = "unhealthy",
            hasDatabaseUrl = hasDbUrl,
            error = ex.Message,
            inner = ex.InnerException?.Message
        }, statusCode: 500);
    }
});

app.MapMethods("/api/init-db", new[] { "GET", "POST" }, async (IServiceProvider sp) =>
{
    try
    {
        await DbInitializer.SeedAsync(sp);
        return Results.Ok(new { message = "Database seeded successfully!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace }, statusCode: 500);
    }
});

app.MapMethods("/api/fix-schema", new[] { "GET", "POST" }, async (AppDbContext db) =>
{
    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Barcode"" character varying(50);
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Popular"" boolean NOT NULL DEFAULT false;
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Unit"" character varying(30) NOT NULL DEFAULT 'Cái';
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Stock"" integer NOT NULL DEFAULT 100;

            ALTER TABLE ""Invoices"" ADD COLUMN IF NOT EXISTS ""CashGiven"" bigint NOT NULL DEFAULT 0;
            ALTER TABLE ""Invoices"" ADD COLUMN IF NOT EXISTS ""ChangeDue"" bigint NOT NULL DEFAULT 0;
            ALTER TABLE ""Invoices"" ADD COLUMN IF NOT EXISTS ""Note"" character varying(255);
            ALTER TABLE ""Invoices"" ADD COLUMN IF NOT EXISTS ""OrderStatus"" character varying(20) NOT NULL DEFAULT '';
            ALTER TABLE ""Invoices"" ADD COLUMN IF NOT EXISTS ""TicketNumber"" integer NOT NULL DEFAULT 0;

            ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""Role"" character varying(50) NOT NULL DEFAULT 'owner';
        ");
        return Results.Ok(new { message = "Cập nhật cấu trúc database thành công!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message, inner = ex.InnerException?.Message }, statusCode: 500);
    }
});

app.MapMethods("/api/clean-products", new[] { "GET", "POST" }, async (AppDbContext db) =>
{
    try
    {
        // 1. Ensure columns exist first
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Barcode"" character varying(50);
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Popular"" boolean NOT NULL DEFAULT false;
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Unit"" character varying(30) NOT NULL DEFAULT 'Cái';
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Stock"" integer NOT NULL DEFAULT 100;
        ");

        // 2. Delete all products
        var deletedCount = await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Products"";");
        return Results.Ok(new
        {
            message = "Đã xóa toàn bộ sản phẩm trên máy chủ thành công!",
            deletedCount
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message, inner = ex.InnerException?.Message }, statusCode: 500);
    }
});

try
{
    await DbInitializer.SeedAsync(app.Services);
}
catch (Exception ex)
{
    Console.WriteLine($"[DbInitializer Warning]: {ex.Message}");
}

app.Run();